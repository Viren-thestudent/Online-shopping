from django.db import models
from django.contrib.auth.models import User

# 1. CATEGORY MODEL
class Category(models.Model):
        name = models.CharField(max_length=100)
        description = models.TextField(blank=True)

        def __str__(self):
            return self.name

# 2. PRODUCT MODEL
class Product(models.Model):
        name = models.CharField(max_length=200)

        category = models.ForeignKey(
            Category,
            on_delete=models.CASCADE
        )

        price = models.DecimalField(
            max_digits=10,
            decimal_places=2
        )

        description = models.TextField()

        stock = models.PositiveIntegerField(default=0)

        image = models.ImageField(
            upload_to='products/',
            blank=True,
            null=True
        )

        created_at = models.DateTimeField(auto_now_add=True)

        def __str__(self):
            return self.name

# 3. USER PROFILE MODEL
class UserProfile(models.Model):
        user = models.OneToOneField(
            User,
            on_delete=models.CASCADE
        )

        phone = models.CharField(max_length=15)

        address = models.TextField(blank=True)

        city = models.CharField(
            max_length=100,
            blank=True
        )

        state = models.CharField(
            max_length=100,
            blank=True
        )

        pincode = models.CharField(
            max_length=10,
            blank=True
        )

        def __str__(self):
            return self.user.username

# 4. CART MODEL
class Cart(models.Model):
        user = models.ForeignKey(
            User,
            on_delete=models.CASCADE
        )

        product = models.ForeignKey(
            Product,
            on_delete=models.CASCADE
        )

        quantity = models.PositiveIntegerField(default=1)

        added_at = models.DateTimeField(
            auto_now_add=True
        )

        def __str__(self):
            return f"{self.user.username} - {self.product.name}"

# 5. ORDER MODEL
class Order(models.Model):
        STATUS_CHOICES = [
            ('Pending', 'Pending'),
            ('Confirmed', 'Confirmed'),
            ('Processing', 'Processing'),
            ('Shipped', 'Shipped'),
            ('Delivered', 'Delivered'),
            ('Cancelled', 'Cancelled'),
        ]

        user = models.ForeignKey(
            User,
            on_delete=models.CASCADE
        )

        address = models.TextField()

        city = models.CharField(max_length=100)

        state = models.CharField(max_length=100)

        pincode = models.CharField(max_length=10)

        total_price = models.DecimalField(
            max_digits=10,
            decimal_places=2
        )

        status = models.CharField(
            max_length=20,
            choices=STATUS_CHOICES,
            default='Pending'
        )

        created_at = models.DateTimeField(
            auto_now_add=True
        )

        def __str__(self):
            return f"Order {self.id} - {self.user.username}"

# 6. ORDER ITEM MODEL
class OrderItem(models.Model):
        order = models.ForeignKey(
            Order,
            on_delete=models.CASCADE,
            related_name='items'
        )

        product = models.ForeignKey(
            Product,
            on_delete=models.CASCADE
        )

        quantity = models.PositiveIntegerField()

        price = models.DecimalField(
            max_digits=10,
            decimal_places=2
        )

        def __str__(self):
            return f"{self.product.name} - {self.quantity}"

# 7. REVIEW MODEL
class Review(models.Model):
        user = models.ForeignKey(
            User,
            on_delete=models.CASCADE
        )

        product = models.ForeignKey(
            Product,
            on_delete=models.CASCADE,
            related_name='reviews'
        )

        rating = models.PositiveIntegerField()

        comment = models.TextField()

        created_at = models.DateTimeField(
            auto_now_add=True
        )

        def __str__(self):
            return f"{self.product.name} - {self.rating}"

# 8. WISHLIST MODEL
class Wishlist(models.Model):
        user = models.ForeignKey(
            User,
            on_delete=models.CASCADE
        )

        product = models.ForeignKey(
            Product,
            on_delete=models.CASCADE
        )

        added_at = models.DateTimeField(
            auto_now_add=True
        )

        def __str__(self):
            return f"{self.user.username} - {self.product.name}"
