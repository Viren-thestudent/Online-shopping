from django.db import migrations


class Migration(migrations.Migration):
    dependencies = [
        ("catalogue", "0005_product_category_navigation"),
    ]

    operations = [
        migrations.AlterModelOptions(
            name="category",
            options={"ordering": ["display_order", "name"], "verbose_name_plural": "categories"},
        ),
    ]
