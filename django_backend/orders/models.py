from decimal import Decimal

from django.core.validators import MinValueValidator
from django.db import models


class Order(models.Model):
    STATUS_PENDING = "pending"
    STATUS_CONFIRMED = "confirmed"
    STATUS_PROCESSING = "processing"
    STATUS_SHIPPED = "shipped"
    STATUS_DELIVERED = "delivered"
    STATUS_CANCELLED = "cancelled"

    STATUS_CHOICES = (
        (STATUS_PENDING, "Pending"),
        (STATUS_CONFIRMED, "Confirmed"),
        (STATUS_PROCESSING, "Processing"),
        (STATUS_SHIPPED, "Shipped"),
        (STATUS_DELIVERED, "Delivered"),
        (STATUS_CANCELLED, "Cancelled"),
    )
    PAYMENT_COD = "cod"
    PAYMENT_ONLINE = "upi"
    PAYMENT_METHOD_CHOICES = (
        (PAYMENT_ONLINE, "UPI / FamPay"),
        (PAYMENT_COD, "Cash on Delivery"),
    )
    PAYMENT_STATUS_PENDING = "pending"
    PAYMENT_STATUS_VERIFIED = "verified"
    PAYMENT_STATUS_REJECTED = "rejected"
    PAYMENT_STATUS_CHOICES = (
        (PAYMENT_STATUS_PENDING, "Pending review"),
        (PAYMENT_STATUS_VERIFIED, "Verified"),
        (PAYMENT_STATUS_REJECTED, "Rejected"),
    )

    customer = models.ForeignKey("users.User", on_delete=models.PROTECT, related_name="orders")
    customer_name = models.CharField(max_length=120)
    phone = models.CharField(max_length=30)
    delivery_address = models.TextField()
    payment_method = models.CharField(max_length=20, choices=PAYMENT_METHOD_CHOICES, default=PAYMENT_ONLINE)
    payment_status = models.CharField(
        max_length=20,
        choices=PAYMENT_STATUS_CHOICES,
        default=PAYMENT_STATUS_PENDING,
    )
    payment_reference = models.CharField(
        max_length=100,
        unique=True,
        null=True,
        blank=True,
    )
    inventory_reserved = models.BooleanField(default=False)
    inventory_released = models.BooleanField(default=False)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default=STATUS_PENDING)
    total = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        default=Decimal("0.00"),
        validators=[MinValueValidator(Decimal("0.00"))],
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"Order #{self.pk}"


class OrderItem(models.Model):
    order = models.ForeignKey(Order, on_delete=models.CASCADE, related_name="items")
    product = models.ForeignKey(
        "catalogue.Product",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="order_items",
    )
    product_name = models.CharField(max_length=200)
    unit_price = models.DecimalField(max_digits=10, decimal_places=2)
    quantity = models.PositiveIntegerField()
    line_total = models.DecimalField(max_digits=10, decimal_places=2)

    class Meta:
        ordering = ["id"]

    def __str__(self):
        return f"{self.product_name} x {self.quantity}"
