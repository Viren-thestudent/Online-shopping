from django.db import migrations, models


CATEGORY_DEFINITIONS = (
    ("Cover", "Crochet covers and cases.", 1),
    ("Flower", "Handmade crochet flowers and floral creations.", 2),
    ("Bags", "Crochet bags and carry-all pieces.", 3),
    ("Collection", "Curated crochet pieces for gifting and everyday use.", 4),
    ("Keychain", "Small crochet keepsakes for keys and bags.", 5),
    ("Toy Section", "Crochet toys and playful companions.", 6),
    ("Headband", "Handmade crochet headbands and hair accessories.", 7),
    ("Diwali", "Crochet pieces explicitly assigned to the Diwali collection.", 8),
    ("Christmas", "Crochet pieces explicitly assigned to the Christmas collection.", 9),
)

LEGACY_CATEGORY_TARGETS = {
    "Phone Covers": "Cover",
    "Crochet Flowers": "Flower",
    "Keychains & Charms": "Keychain",
    "Gifts & Accessories": "Collection",
    "Keychains": "Keychain",
    "Amigurumi": "Toy Section",
    "Gifts": "Collection",
}


def reconcile_product_categories(apps, schema_editor):
    Category = apps.get_model("catalogue", "Category")
    Product = apps.get_model("catalogue", "Product")

    definitions = {name: (description, display_order) for name, description, display_order in CATEGORY_DEFINITIONS}

    # Reuse existing categories wherever possible so existing product foreign
    # keys remain valid. Legacy categories are merged into the closest new
    # category; no products are created or deleted by this migration.
    for target_name, (description, display_order) in definitions.items():
        target = Category.objects.filter(name=target_name).first()
        if target is None:
            legacy_names = [name for name, mapped_target in LEGACY_CATEGORY_TARGETS.items() if mapped_target == target_name]
            target = Category.objects.filter(name__in=legacy_names).order_by("id").first()
        if target is None:
            target = Category.objects.create(name=target_name, description=description)

        Product.objects.filter(category_id__in=Category.objects.filter(
            name__in=[name for name, mapped_target in LEGACY_CATEGORY_TARGETS.items() if mapped_target == target_name]
        ).exclude(pk=target.pk).values("pk")).update(category_id=target.pk)
        target.name = target_name
        target.description = description
        target.display_order = display_order
        target.save(update_fields=["name", "description", "display_order", "updated_at"])

    # Remove only the old seeded names after their products have been moved.
    # Custom admin-created categories remain available after the nine featured
    # navigation categories.
    Category.objects.filter(name__in=LEGACY_CATEGORY_TARGETS).exclude(
        name__in=[name for name, _, _ in CATEGORY_DEFINITIONS]
    ).delete()


class Migration(migrations.Migration):
    dependencies = [
        ("catalogue", "0004_reconcile_category_names"),
    ]

    operations = [
        migrations.AddField(
            model_name="category",
            name="display_order",
            field=models.PositiveIntegerField(default=1000),
        ),
        migrations.RunPython(reconcile_product_categories, migrations.RunPython.noop),
    ]
