from rest_framework import serializers

from .models import Category, Product


class CategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Category
        fields = ("id", "name", "description", "created_at", "updated_at")
        read_only_fields = ("id", "created_at", "updated_at")

    def validate_name(self, value):
        name = value.strip()
        if not name:
            raise serializers.ValidationError("Category name is required.")
        queryset = Category.objects.filter(name__iexact=name)
        if self.instance:
            queryset = queryset.exclude(pk=self.instance.pk)
        if queryset.exists():
            raise serializers.ValidationError("A category with this name already exists.")
        return name


class ProductSerializer(serializers.ModelSerializer):
    category_name = serializers.CharField(source="category.name", read_only=True, allow_null=True)
    image = serializers.FileField(required=False, allow_null=True, write_only=True)
    image_url = serializers.SerializerMethodField()

    class Meta:
        model = Product
        fields = (
            "id", "name", "description", "price", "category", "category_name",
            "stock", "is_available", "image", "image_url", "created_at", "updated_at",
        )
        read_only_fields = ("id", "category_name", "image_url", "created_at", "updated_at")

    def validate_name(self, value):
        value = value.strip()
        if not value:
            raise serializers.ValidationError("Product name is required.")
        return value

    def validate_description(self, value):
        value = value.strip()
        if not value:
            raise serializers.ValidationError("Product description is required.")
        return value

    def validate_price(self, value):
        if value <= 0:
            raise serializers.ValidationError("Price must be greater than zero.")
        return value

    def validate_stock(self, value):
        if value < 0:
            raise serializers.ValidationError("Stock cannot be negative.")
        return value

    def validate_category(self, value):
        if value is None and not self.instance:
            raise serializers.ValidationError("Category is required when creating a product.")
        return value

    def validate(self, attrs):
        if attrs.get("clear_image"):
            attrs.pop("clear_image", None)
            attrs["image"] = None
        return attrs

    def get_image_url(self, obj):
        if not obj.image:
            return None
        request = self.context.get("request")
        url = obj.image.url
        return request.build_absolute_uri(url) if request else url

    def update(self, instance, validated_data):
        clear_image = self.context.get("request").data.get("clear_image") if self.context.get("request") else None
        if clear_image in {True, "true", "1", "on"}:
            instance.image.delete(save=False)
            instance.image = None
        return super().update(instance, validated_data)
