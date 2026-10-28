from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ("orders", "0003_order_inventory_reservation"),
    ]

    operations = [
        migrations.AlterField(
            model_name="order",
            name="payment_method",
            field=models.CharField(
                choices=[("upi", "UPI / FamPay"), ("cod", "Cash on Delivery")],
                default="upi",
                max_length=20,
            ),
        ),
    ]
