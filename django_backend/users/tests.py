from datetime import timedelta
from decimal import Decimal

from django.test import TestCase
from django.utils import timezone
from rest_framework.test import APIClient
from rest_framework_simplejwt.tokens import AccessToken

from catalogue.models import Category, Product
from orders.models import Order, OrderItem

from .models import User


class EcommerceAPITestCase(TestCase):
    """Regression coverage for the existing React-facing API."""

    def setUp(self):
        self.client = self.make_client()
        self.admin = self.create_user("admin@example.com", is_admin=True)
        self.customer = self.create_user("customer@example.com")
        self.other_customer = self.create_user("other@example.com")
        self.category = Category.objects.create(
            name="Keychains",
            description="Small crochet keepsakes.",
        )
        self.other_category = Category.objects.create(
            name="Gifts",
            description="Handmade gifts.",
        )
        self.product = Product.objects.create(
            name="Blue Keychain",
            description="A small blue crochet keychain.",
            price=Decimal("150.00"),
            category=self.category,
            stock=5,
            is_available=True,
        )
        self.other_product = Product.objects.create(
            name="Rose Gift",
            description="A handmade crochet rose.",
            price=Decimal("300.00"),
            category=self.other_category,
            stock=2,
            is_available=True,
        )

    @staticmethod
    def make_client():
        client = APIClient()
        # The development settings intentionally allow localhost, not testserver.
        client.defaults["HTTP_HOST"] = "localhost"
        return client

    @staticmethod
    def create_user(email, is_admin=False):
        user = User(name=email.split("@")[0], email=email, is_admin=is_admin)
        user.set_password("correct-password")
        user.save()
        return user

    def login_as(self, user):
        self.client.credentials()
        response = self.client.post(
            "/api/auth/login",
            {"email": user.email, "password": "correct-password"},
            format="json",
        )
        self.assertEqual(response.status_code, 200)
        self.assertTrue(response.data["token"])
        self.client.credentials(
            HTTP_AUTHORIZATION=f"Bearer {response.data['token']}"
        )
        return response

    def create_order(
        self,
        customer,
        product,
        total=None,
        status=Order.STATUS_PENDING,
        payment_status=Order.PAYMENT_STATUS_VERIFIED,
        payment_reference="__auto__",
    ):
        if payment_reference == "__auto__":
            payment_reference = f"TESTUTR{Order.objects.count() + 1}"
        order = Order.objects.create(
            customer=customer,
            customer_name=customer.name,
            phone="9876543210",
            delivery_address="12 Audit Street, Kolkata",
            payment_method=Order.PAYMENT_ONLINE,
            payment_status=payment_status,
            payment_reference=payment_reference,
            status=status,
            total=total if total is not None else product.price,
        )
        OrderItem.objects.create(
            order=order,
            product=product,
            product_name=product.name,
            unit_price=product.price,
            quantity=1,
            line_total=product.price,
        )
        return order

    def test_registration_login_invalid_credentials_and_stale_jwt_fix(self):
        expired_token = AccessToken()
        expired_token.set_exp(lifetime=timedelta(seconds=-1))

        registration_client = self.make_client()
        registration_client.credentials(HTTP_AUTHORIZATION="Bearer not-a-jwt")
        registration = registration_client.post(
            "/api/auth/register",
            {
                "name": "New Customer",
                "email": "new@example.com",
                "password": "new-password",
            },
            format="json",
        )
        self.assertEqual(registration.status_code, 201)
        self.assertTrue(User.objects.filter(email="new@example.com").exists())

        login_client = self.make_client()
        login_client.credentials(HTTP_AUTHORIZATION=f"Bearer {expired_token}")
        login = login_client.post(
            "/api/auth/login",
            {"email": "customer@example.com", "password": "correct-password"},
            format="json",
        )
        self.assertEqual(login.status_code, 200)
        self.assertEqual(login.data["user"]["email"], "customer@example.com")
        self.assertFalse(login.data["user"]["is_admin"])

        login_client.credentials(HTTP_AUTHORIZATION="Bearer not-a-jwt")
        invalid = login_client.post(
            "/api/auth/login",
            {"email": "customer@example.com", "password": "wrong-password"},
            format="json",
        )
        self.assertEqual(invalid.status_code, 401)
        self.assertEqual(invalid.data["message"], "Invalid email or password")

    def test_catalogue_listing_and_detail_require_authentication(self):
        unauthenticated = self.make_client()
        self.assertEqual(unauthenticated.get("/api/catalogue/categories").status_code, 401)
        self.assertEqual(unauthenticated.get("/api/catalogue/products").status_code, 401)
        self.assertEqual(
            unauthenticated.get(f"/api/catalogue/products/{self.product.id}").status_code,
            401,
        )

        self.login_as(self.customer)
        categories = self.client.get("/api/catalogue/categories")
        products = self.client.get("/api/catalogue/products")
        detail = self.client.get(f"/api/catalogue/products/{self.product.id}")

        self.assertEqual(categories.status_code, 200)
        self.assertEqual(products.status_code, 200)
        self.assertEqual(detail.status_code, 200)
        self.assertEqual(len(categories.data), 6)
        self.assertIn("Keychains", {category["name"] for category in categories.data})
        self.assertEqual(len(products.data), 2)
        self.assertEqual(detail.data["category_name"], "Keychains")
        self.assertEqual(detail.data["price"], "150.00")

    def test_unauthenticated_and_normal_users_cannot_use_admin_apis(self):
        unauthenticated = self.make_client()
        protected_requests = (
            ("/api/catalogue/categories", {"name": "Blocked"}),
            ("/api/catalogue/products", {
                "name": "Blocked",
                "description": "Blocked",
                "price": "1.00",
                "category": self.category.id,
                "stock": 1,
            }),
        )
        for path, payload in protected_requests:
            with self.subTest(path=path):
                self.assertEqual(
                    unauthenticated.post(path, payload, format="json").status_code,
                    401,
                )
        self.assertEqual(unauthenticated.get("/api/orders/admin").status_code, 401)
        self.assertEqual(unauthenticated.get("/api/orders/admin/dashboard").status_code, 401)

        self.login_as(self.customer)
        for path, payload in protected_requests:
            with self.subTest(path=path):
                self.assertEqual(self.client.post(path, payload, format="json").status_code, 403)
        self.assertEqual(self.client.get("/api/orders/admin").status_code, 403)
        self.assertEqual(self.client.get("/api/orders/admin/dashboard").status_code, 403)

    def test_valid_checkout_calculates_total_and_decrements_stock(self):
        self.login_as(self.customer)
        response = self.client.post(
            "/api/orders/",
            {
                "customer_name": "Checkout Customer",
                "phone": "+91 9876543210",
                "delivery_address": "12 Audit Street, Kolkata",
                "payment_reference": "checkout-utr-123456",
                "items": [
                    {"product_id": self.product.id, "quantity": 2},
                    {"product_id": self.other_product.id, "quantity": 1},
                ],
            },
            format="json",
        )

        self.assertEqual(response.status_code, 201)
        self.assertEqual(response.data["total"], "600.00")
        self.assertEqual(len(response.data["items"]), 2)
        self.assertEqual(Order.objects.get(id=response.data["id"]).total, Decimal("600.00"))
        self.product.refresh_from_db()
        self.other_product.refresh_from_db()
        self.assertEqual(self.product.stock, 3)
        self.assertEqual(self.other_product.stock, 1)

    def test_checkout_rejects_invalid_input_duplicate_lines_and_insufficient_stock(self):
        self.login_as(self.customer)
        initial_orders = Order.objects.count()
        initial_stock = self.product.stock

        invalid = self.client.post(
            "/api/orders/",
            {
                "customer_name": "",
                "phone": "bad",
                "delivery_address": "x",
                "items": [],
            },
            format="json",
        )
        self.assertEqual(invalid.status_code, 400)

        duplicate = self.client.post(
            "/api/orders/",
            {
                "customer_name": "Checkout Customer",
                "phone": "9876543210",
                "delivery_address": "12 Audit Street, Kolkata",
                "items": [
                    {"product_id": self.product.id, "quantity": 1},
                    {"product_id": self.product.id, "quantity": 1},
                ],
            },
            format="json",
        )
        self.assertEqual(duplicate.status_code, 400)

        insufficient = self.client.post(
            "/api/orders/",
            {
                "customer_name": "Checkout Customer",
                "phone": "9876543210",
                "delivery_address": "12 Audit Street, Kolkata",
                "payment_reference": "invalid-test-123456",
                "items": [{"product_id": self.product.id, "quantity": 6}],
            },
            format="json",
        )
        self.assertEqual(insufficient.status_code, 400)
        self.assertEqual(Order.objects.count(), initial_orders)
        self.product.refresh_from_db()
        self.assertEqual(self.product.stock, initial_stock)

    def test_customers_only_see_their_own_orders_and_admins_can_manage_orders(self):
        own_order = self.create_order(self.customer, self.product)
        other_order = self.create_order(self.other_customer, self.other_product)

        self.login_as(self.customer)
        history = self.client.get("/api/orders/")
        self.assertEqual(history.status_code, 200)
        self.assertEqual([order["id"] for order in history.data], [own_order.id])
        self.assertEqual(self.client.get(f"/api/orders/{own_order.id}").status_code, 200)
        self.assertEqual(self.client.get(f"/api/orders/{other_order.id}").status_code, 404)

        self.login_as(self.admin)
        admin_orders = self.client.get("/api/orders/admin")
        self.assertEqual(admin_orders.status_code, 200)
        self.assertEqual({order["id"] for order in admin_orders.data}, {own_order.id, other_order.id})

        update = self.client.patch(
            f"/api/orders/admin/{own_order.id}",
            {"status": Order.STATUS_SHIPPED},
            format="json",
        )
        self.assertEqual(update.status_code, 200)
        self.assertEqual(update.data["status"], Order.STATUS_SHIPPED)
        own_order.refresh_from_db()
        self.assertEqual(own_order.status, Order.STATUS_SHIPPED)

    def test_admin_dashboard_counts_recent_orders_and_delivered_revenue_only(self):
        pending = self.create_order(self.customer, self.product, Decimal("40.00"))
        delivered = self.create_order(
            self.customer,
            self.product,
            Decimal("100.00"),
            status=Order.STATUS_DELIVERED,
        )
        cancelled = self.create_order(
            self.other_customer,
            self.other_product,
            Decimal("250.00"),
            status=Order.STATUS_CANCELLED,
        )

        self.login_as(self.admin)
        response = self.client.get("/api/orders/admin/dashboard")

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data["stats"]["total_products"], 2)
        self.assertEqual(response.data["stats"]["total_orders"], 3)
        self.assertEqual(response.data["stats"]["total_customers"], 2)
        self.assertEqual(response.data["stats"]["delivered_revenue"], "100.00")
        recent_ids = {order["id"] for order in response.data["recent_orders"]}
        self.assertEqual(recent_ids, {pending.id, delivered.id, cancelled.id})
        self.assertIn(
            Order.STATUS_DELIVERED,
            {order["status"] for order in response.data["recent_orders"]},
        )

    def test_sales_insights_is_admin_only_and_excludes_pending_cancelled_sales(self):
        pending = self.create_order(self.customer, self.product, Decimal("40.00"))
        delivered = self.create_order(
            self.customer,
            self.product,
            Decimal("100.00"),
            status=Order.STATUS_DELIVERED,
        )
        cancelled = self.create_order(
            self.other_customer,
            self.other_product,
            Decimal("250.00"),
            status=Order.STATUS_CANCELLED,
        )

        unauthenticated = self.make_client()
        self.assertEqual(unauthenticated.get("/api/orders/admin/insights").status_code, 401)

        self.login_as(self.customer)
        self.assertEqual(self.client.get("/api/orders/admin/insights").status_code, 403)

        self.login_as(self.admin)
        response = self.client.get("/api/orders/admin/insights")

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data["summary"]["delivered_revenue"], "100.00")
        self.assertEqual(response.data["summary"]["completed_orders"], 1)
        self.assertEqual(response.data["summary"]["completed_units"], 1)
        self.assertEqual(response.data["best_selling_products"][0]["product_name"], self.product.name)
        self.assertEqual(response.data["best_selling_products"][0]["quantity_sold"], 1)
        self.assertEqual({pending.status, delivered.status, cancelled.status}, {
            Order.STATUS_PENDING,
            Order.STATUS_DELIVERED,
            Order.STATUS_CANCELLED,
        })
        self.assertEqual(len(response.data["sales_trend"]), 1)

    def test_sales_insights_explains_insufficient_history(self):
        self.login_as(self.admin)
        response = self.client.get("/api/orders/admin/insights")

        self.assertEqual(response.status_code, 200)
        self.assertFalse(response.data["forecast"]["available"])
        self.assertIn("More historical completed sales are needed", response.data["forecast"]["message"])
        self.assertEqual(response.data["forecast"]["predictions"], [])

    def test_sales_insights_uses_linear_regression_after_enough_history(self):
        for weeks_ago, total in ((5, "50.00"), (4, "75.00"), (3, "100.00"), (2, "125.00")):
            order = self.create_order(
                self.customer,
                self.product,
                Decimal(total),
                status=Order.STATUS_DELIVERED,
            )
            Order.objects.filter(pk=order.pk).update(
                created_at=timezone.now() - timedelta(weeks=weeks_ago),
            )

        self.login_as(self.admin)
        response = self.client.get("/api/orders/admin/insights")

        self.assertEqual(response.status_code, 200)
        self.assertTrue(response.data["forecast"]["available"])
        self.assertEqual(response.data["forecast"]["model"], "scikit-learn LinearRegression")
        self.assertEqual(len(response.data["forecast"]["predictions"]), 4)

    def test_payment_submission_rejects_invalid_and_duplicate_utr(self):
        order = self.create_order(
            self.customer,
            self.product,
            payment_status=Order.PAYMENT_STATUS_PENDING,
            payment_reference=None,
        )
        self.login_as(self.customer)

        invalid = self.client.post(
            f"/api/orders/{order.id}/payment",
            {"utr": "123"},
            format="json",
        )
        self.assertEqual(invalid.status_code, 400)

        submitted = self.client.post(
            f"/api/orders/{order.id}/payment",
            {"utr": "utr-123456"},
            format="json",
        )
        self.assertEqual(submitted.status_code, 200)
        self.assertEqual(submitted.data["payment_reference"], "UTR-123456")
        self.assertEqual(submitted.data["payment_status"], Order.PAYMENT_STATUS_PENDING)

        duplicate = self.client.post(
            f"/api/orders/{order.id}/payment",
            {"utr": "UTR-123456"},
            format="json",
        )
        self.assertEqual(duplicate.status_code, 400)

    def test_payment_verification_is_admin_only_and_customer_data_is_private(self):
        order = self.create_order(
            self.customer,
            self.product,
            payment_status=Order.PAYMENT_STATUS_PENDING,
            payment_reference="PRIVATE-UTR-123456",
        )

        self.login_as(self.customer)
        forbidden = self.client.patch(
            f"/api/orders/admin/{order.id}/payment",
            {"payment_status": Order.PAYMENT_STATUS_VERIFIED},
            format="json",
        )
        self.assertEqual(forbidden.status_code, 403)
        own_order = self.client.get(f"/api/orders/{order.id}")
        self.assertEqual(own_order.status_code, 200)
        self.assertEqual(own_order.data["payment_reference"], "PRIVATE-UTR-123456")
        self.assertEqual(self.client.get(f"/api/orders/{order.id}").status_code, 200)

        self.login_as(self.other_customer)
        self.assertEqual(self.client.get(f"/api/orders/{order.id}").status_code, 404)

        self.login_as(self.admin)
        verified = self.client.patch(
            f"/api/orders/admin/{order.id}/payment",
            {"payment_status": Order.PAYMENT_STATUS_VERIFIED},
            format="json",
        )
        self.assertEqual(verified.status_code, 200)
        self.assertEqual(verified.data["payment_status"], Order.PAYMENT_STATUS_VERIFIED)

    def test_unpaid_delivered_orders_are_excluded_from_dashboard_and_insights(self):
        unpaid = self.create_order(
            self.customer,
            self.product,
            Decimal("900.00"),
            status=Order.STATUS_DELIVERED,
            payment_status=Order.PAYMENT_STATUS_PENDING,
            payment_reference="UNPAID-UTR-123456",
        )
        paid = self.create_order(
            self.customer,
            self.other_product,
            Decimal("100.00"),
            status=Order.STATUS_DELIVERED,
            payment_status=Order.PAYMENT_STATUS_VERIFIED,
            payment_reference="PAID-UTR-123456",
        )

        self.login_as(self.admin)
        dashboard = self.client.get("/api/orders/admin/dashboard")
        self.assertEqual(dashboard.status_code, 200)
        self.assertEqual(dashboard.data["stats"]["delivered_revenue"], "100.00")

        insights = self.client.get("/api/orders/admin/insights")
        self.assertEqual(insights.status_code, 200)
        self.assertEqual(insights.data["summary"]["delivered_revenue"], "100.00")
        self.assertEqual(insights.data["summary"]["completed_orders"], 1)
        self.assertNotEqual(unpaid.payment_status, paid.payment_status)

    def test_admin_cannot_mark_unverified_order_delivered(self):
        order = self.create_order(
            self.customer,
            self.product,
            payment_status=Order.PAYMENT_STATUS_REJECTED,
            payment_reference="REJECTED-UTR-123456",
        )
        self.login_as(self.admin)
        response = self.client.patch(
            f"/api/orders/admin/{order.id}",
            {"status": Order.STATUS_DELIVERED},
            format="json",
        )
        self.assertEqual(response.status_code, 400)
