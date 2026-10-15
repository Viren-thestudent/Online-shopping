from django.db import migrations


TARGET_CATEGORIES = {
    "Phone Covers": "Handmade crochet covers for phones and devices.",
    "Crochet Flowers": "Handmade crochet flowers and floral creations.",
    "Keychains & Charms": "Small crochet keepsakes for keys, bags, and gifting.",
    "Gifts & Accessories": "Handmade crochet pieces for thoughtful gifting and everyday use.",
}

LEGACY_RENAMES = {
    "Amigurumi": "Phone Covers",
    "Gifts": "Crochet Flowers",
    "Keychains": "Keychains & Charms",
}


def reconcile_categories(apps, schema_editor):
    Category = apps.get_model("catalogue", "Category")
    Product = apps.get_model("catalogue", "Product")

    for legacy_name, target_name in LEGACY_RENAMES.items():
        legacy = Category.objects.filter(name=legacy_name).first()
        target = Category.objects.filter(name=target_name).first()

        if legacy is None:
            continue

        if target is None:
            legacy.name = target_name
            legacy.description = TARGET_CATEGORIES[target_name]
            legacy.save(update_fields=["name", "description", "updated_at"])
            continue

        if legacy.pk != target.pk:
            Product.objects.filter(category_id=legacy.pk).update(category_id=target.pk)
            legacy.delete()

    for name, description in TARGET_CATEGORIES.items():
        Category.objects.get_or_create(name=name, defaults={"description": description})


class Migration(migrations.Migration):
    dependencies = [
        ("catalogue", "0003_alter_product_price"),
    ]

    operations = [
        migrations.RunPython(reconcile_categories, migrations.RunPython.noop),
    ]
