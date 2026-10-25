from decimal import Decimal

from django.test import TestCase
from rest_framework.test import APIClient

from users.models import User

from .models import Category, Product


class ContentBasedRecommendationTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.client.defaults["HTTP_HOST"] = "localhost"
        self.user = User(
            email="recommendations@example.com",
            name="Recommendation Customer",
        )
        self.user.set_password("correct-password")
        self.user.save()
        self.client.force_authenticate(user=self.user)
        self.phone_category = Category.objects.create(name="Recommendation Phone Covers")
        self.flower_category = Category.objects.create(name="Recommendation Flowers")
        self.current = self.create_product(
            "Blue Bird Phone Case",
            "A cream crochet phone case with blue birds and green leaves.",
            self.phone_category,
        )
        self.similar = self.create_product(
            "Floral Crochet Phone Cover",
            "A cream crochet phone cover with blue flowers and a hanging charm.",
            self.phone_category,
        )
        self.different = self.create_product(
            "Mini Crochet Rose",
            "A red crochet rose with layered petals for floral gifts.",
            self.flower_category,
        )

    @staticmethod
    def create_product(name, description, category, **overrides):
        values = {
            "name": name,
            "description": description,
            "category": category,
            "price": Decimal("150.00"),
            "stock": 5,
            "is_available": True,
        }
        values.update(overrides)
        return Product.objects.create(
            **values,
        )

    def test_endpoint_returns_real_similar_products_and_excludes_source(self):
        response = self.client.get(
            "/api/ml/recommendations/",
            {"product_id": self.current.pk},
        )

        self.assertEqual(response.status_code, 200)
        ids = [product["id"] for product in response.data]
        self.assertIn(self.similar.pk, ids)
        self.assertNotIn(self.current.pk, ids)
        self.assertEqual(response.data[0]["name"], self.similar.name)
        self.assertIn("category_name", response.data[0])
        self.assertIn("image_url", response.data[0])

    def test_unavailable_and_out_of_stock_products_are_not_recommended(self):
        unavailable = self.create_product(
            "Unavailable Phone Cover",
            "A cream crochet phone cover with blue stitching.",
            self.phone_category,
            is_available=False,
        )
        out_of_stock = self.create_product(
            "Out of Stock Phone Cover",
            "A cream crochet phone cover with blue stitching.",
            self.phone_category,
            stock=0,
        )

        response = self.client.get(
            "/api/ml/recommendations/",
            {"product_id": self.current.pk},
        )
        ids = [product["id"] for product in response.data]

        self.assertNotIn(unavailable.pk, ids)
        self.assertNotIn(out_of_stock.pk, ids)

    def test_missing_description_duplicate_text_and_refresh_are_safe(self):
        blank_description = self.create_product(
            "Blue Bird Phone Case Two",
            "",
            self.phone_category,
        )
        duplicate = self.create_product(
            "Another Blue Bird Phone Case",
            self.current.description,
            self.phone_category,
        )

        first_response = self.client.get(
            "/api/ml/recommendations/",
            {"product_id": self.current.pk},
        )
        self.assertEqual(first_response.status_code, 200)
        first_ids = [product["id"] for product in first_response.data]
        self.assertIn(blank_description.pk, first_ids)
        self.assertIn(duplicate.pk, first_ids)

        self.similar.name = "Red Rose Phone Cover"
        self.similar.description = "A completely different floral cover."
        self.similar.save()
        second_response = self.client.get(
            "/api/ml/recommendations/",
            {"product_id": self.current.pk},
        )
        self.assertEqual(second_response.status_code, 200)

    def test_invalid_product_ids_and_empty_catalog_are_handled(self):
        self.assertEqual(
            self.client.get("/api/ml/recommendations/").status_code,
            400,
        )
        self.assertEqual(
            self.client.get(
                "/api/ml/recommendations/",
                {"product_id": "not-an-integer"},
            ).status_code,
            400,
        )
        self.assertEqual(
            self.client.get(
                "/api/ml/recommendations/",
                {"product_id": 999999},
            ).status_code,
            404,
        )

        Product.objects.all().delete()

        # There is no valid source product in an empty catalogue; the endpoint
        # reports that clearly instead of inventing a recommendation.
        self.assertEqual(
            self.client.get(
                "/api/ml/recommendations/",
                {"product_id": self.current.pk},
            ).status_code,
            404,
        )
