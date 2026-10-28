import re
from decimal import Decimal

from django.db import transaction
from rest_framework import serializers

from catalogue.models import Product

from .models import Order, OrderItem


class OrderItemSerializer(serializers.ModelSerializer):
    product_id = serializers.IntegerField(source="product.id", read_only=True, allow_null=True)
    image_url = serializers.SerializerMethodField()

    class Meta:
        model = OrderItem
        fields = ("product_id", "product_name", "unit_price", "quantity", "line_total", "image_url")

    def get_image_url(self, obj):
        if not obj.product or not obj.product.image:
            return None
        request = self.context.get("request")
        url = obj.product.image.url
        return request.build_absolute_uri(url) if request else url


class OrderSerializer(serializers.ModelSerializer):
    items = OrderItemSerializer(many=True, read_only=True)
    customer_email = serializers.EmailField(source="customer.email", read_only=True)

    class Meta:
        model = Order
        fields = (
            "id",
            "customer_name",
            "customer_email",
            "phone",
            "delivery_address",
            "payment_method",
            "payment_status",
            "payment_reference",
            "status",
            "total",
            "created_at",
            "updated_at",
            "items",
        )
        read_only_fields = fields


class DashboardOrderSerializer(serializers.ModelSerializer):
    customer_email = serializers.EmailField(source="customer.email", read_only=True)

    class Meta:
        model = Order
        fields = ("id", "customer_name", "customer_email", "created_at", "total", "status", "payment_status")
        read_only_fields = fields


class CheckoutItemSerializer(serializers.Serializer):
    product_id = serializers.IntegerField(min_value=1)
    quantity = serializers.IntegerField(min_value=1, max_value=999)


class CreateOrderSerializer(serializers.Serializer):
    customer_name = serializers.CharField(max_length=120, trim_whitespace=True)
    phone = serializers.CharField(max_length=30, trim_whitespace=True)
    delivery_address = serializers.CharField(min_length=5, trim_whitespace=True)
    payment_method = serializers.ChoiceField(choices=Order.PAYMENT_METHOD_CHOICES, default=Order.PAYMENT_ONLINE)
    payment_reference = serializers.CharField(max_length=100, trim_whitespace=True, required=False, allow_blank=True)
    items = CheckoutItemSerializer(many=True, allow_empty=False)

    def validate_customer_name(self, value):
        if not value.strip():
            raise serializers.ValidationError("Customer name is required.")
        return value.strip()

    def validate_phone(self, value):
        phone = value.strip()
        if not re.fullmatch(r"[0-9+()\-\s]{7,30}", phone):
            raise serializers.ValidationError("Enter a valid phone number.")
        return phone

    def validate_delivery_address(self, value):
        address = value.strip()
        if not address:
            raise serializers.ValidationError("Delivery address is required.")
        return address

    def validate_items(self, value):
        product_ids = [item["product_id"] for item in value]
        if len(product_ids) != len(set(product_ids)):
            raise serializers.ValidationError("Each product may appear only once in the cart.")
        return value

    @staticmethod
    def normalize_reference(value):
        return re.sub(r"\s+", "", value).upper()

    def validate(self, attrs):
        payment_method = attrs.get("payment_method", Order.PAYMENT_ONLINE)
        reference = self.normalize_reference(attrs.get("payment_reference", ""))
        if payment_method == Order.PAYMENT_COD:
            if reference:
                raise serializers.ValidationError({"payment_reference": "COD orders do not require a UTR or transaction reference."})
            attrs["payment_reference"] = None
            return attrs

        if not reference:
            raise serializers.ValidationError({"payment_reference": "A UTR or transaction reference is required for online payment."})
        if not re.fullmatch(r"[A-Z0-9][A-Z0-9._/-]{5,99}", reference):
            raise serializers.ValidationError({
                "payment_reference": "Enter a valid UTR or transaction reference (6-100 letters, numbers, or - / _ .)."
            })
        if Order.objects.filter(payment_reference__iexact=reference).exists():
            raise serializers.ValidationError({"payment_reference": "This payment reference has already been submitted."})
        attrs["payment_reference"] = reference
        return attrs

    def create(self, validated_data):
        request = self.context["request"]
        items = validated_data.pop("items")
        product_ids = [item["product_id"] for item in items]

        with transaction.atomic():
            products = {
                product.pk: product
                for product in Product.objects.select_for_update().filter(pk__in=product_ids)
            }
            missing_ids = [product_id for product_id in product_ids if product_id not in products]
            if missing_ids:
                raise serializers.ValidationError({"items": "One or more products no longer exist."})

            unavailable = [
                product.name
                for product in products.values()
                if not product.is_available
            ]
            if unavailable:
                raise serializers.ValidationError({"items": f"Unavailable product: {unavailable[0]}."})

            order = Order.objects.create(
                customer=request.user,
                total=Decimal("0.00"),
                payment_status=Order.PAYMENT_STATUS_PENDING,
                inventory_reserved=True,
                **validated_data,
            )
            total = Decimal("0.00")

            for item in items:
                product = products[item["product_id"]]
                quantity = item["quantity"]
                if product.stock < quantity:
                    raise serializers.ValidationError(
                        {"items": f"Only {product.stock} of {product.name} remain in stock."}
                    )

                line_total = product.price * quantity
                OrderItem.objects.create(
                    order=order,
                    product=product,
                    product_name=product.name,
                    unit_price=product.price,
                    quantity=quantity,
                    line_total=line_total,
                )
                product.stock -= quantity
                product.save(update_fields=["stock", "updated_at"])
                total += line_total

            order.total = total
            order.save(update_fields=["total", "updated_at"])

        return order


class AdminOrderStatusSerializer(serializers.ModelSerializer):
    class Meta:
        model = Order
        fields = ("status",)

    def validate_status(self, value):
        paid_statuses = {Order.STATUS_CONFIRMED, Order.STATUS_PROCESSING, Order.STATUS_SHIPPED, Order.STATUS_DELIVERED}
        if value in paid_statuses and self.instance.payment_status != Order.PAYMENT_STATUS_VERIFIED:
            raise serializers.ValidationError("Verify or collect payment before moving this order into fulfilment.")
        if self.instance.status == Order.STATUS_DELIVERED and value != Order.STATUS_DELIVERED:
            raise serializers.ValidationError("A delivered order cannot move backwards in the fulfilment workflow.")
        return value


class PaymentSubmissionSerializer(serializers.Serializer):
    utr = serializers.CharField(max_length=100, trim_whitespace=True)

    def validate_utr(self, value):
        reference = CreateOrderSerializer.normalize_reference(value)
        if not re.fullmatch(r"[A-Z0-9][A-Z0-9._/-]{5,99}", reference):
            raise serializers.ValidationError(
                "Enter a valid UTR or transaction reference (6-100 letters, numbers, or - / _ .)."
            )
        order = self.context["order"]
        if order.payment_method != Order.PAYMENT_ONLINE:
            raise serializers.ValidationError("Only online-payment orders accept a UTR or transaction reference.")
        if order.payment_status == Order.PAYMENT_STATUS_VERIFIED:
            raise serializers.ValidationError("This payment has already been verified.")
        if order.payment_reference and order.payment_reference.upper() == reference:
            raise serializers.ValidationError("This payment reference has already been submitted.")
        if order.payment_reference and order.payment_status == Order.PAYMENT_STATUS_PENDING:
            raise serializers.ValidationError("Payment details have already been submitted for this order.")
        if Order.objects.filter(payment_reference__iexact=reference).exclude(pk=order.pk).exists():
            raise serializers.ValidationError("This payment reference has already been submitted.")
        return reference

    def save(self, **kwargs):
        order = self.context["order"]
        order.payment_method = Order.PAYMENT_ONLINE
        order.payment_reference = self.validated_data["utr"]
        order.payment_status = Order.PAYMENT_STATUS_PENDING
        order.save(update_fields=["payment_method", "payment_reference", "payment_status", "updated_at"])
        return order


class AdminPaymentStatusSerializer(serializers.ModelSerializer):
    class Meta:
        model = Order
        fields = ("payment_status",)

    def validate_payment_status(self, value):
        if value == Order.PAYMENT_STATUS_VERIFIED and self.instance.payment_method == Order.PAYMENT_ONLINE and not self.instance.payment_reference:
            raise serializers.ValidationError("A submitted UTR is required before verifying an online payment.")
        if value == Order.PAYMENT_STATUS_REJECTED and self.instance.payment_method == Order.PAYMENT_COD:
            raise serializers.ValidationError("COD remains pending until cash is collected; cancel the order if needed.")
        if self.instance.payment_status == Order.PAYMENT_STATUS_VERIFIED and value != Order.PAYMENT_STATUS_VERIFIED:
            raise serializers.ValidationError("A verified payment cannot be changed back to another status.")
        return value
