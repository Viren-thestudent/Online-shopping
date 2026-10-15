from django.db import migrations


DEFAULT_CATEGORIES = (
    ("Keychains", "Tiny keepsakes for keys, bags, and gifting."),
    ("Amigurumi", "Small, characterful crochet companions."),
    ("Gifts", "Handmade pieces chosen for thoughtful moments."),
)


def create_default_categories(apps, schema_editor):
    Category = apps.get_model("catalogue", "Category")
    for name, description in DEFAULT_CATEGORIES:
        Category.objects.get_or_create(name=name, defaults={"description": description})


class Migration(migrations.Migration):
    dependencies = [("catalogue", "0001_initial")]
    operations = [migrations.RunPython(create_default_categories, migrations.RunPython.noop)]
