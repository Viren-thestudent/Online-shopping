from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ("orders", "0002_order_payment_review"),
    ]

    operations = [
        migrations.AddField(
            model_name="order",
            name="inventory_released",
            field=models.BooleanField(default=False),
        ),
        migrations.AddField(
            model_name="order",
            name="inventory_reserved",
            field=models.BooleanField(default=False),
        ),
    ]
