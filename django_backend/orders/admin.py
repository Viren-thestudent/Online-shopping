from django.contrib import admin

from .models import Order, OrderItem


class OrderItemInline(admin.TabularInline):
    model = OrderItem
    extra = 0
    readonly_fields = ("product", "product_name", "unit_price", "quantity", "line_total")


@admin.register(Order)
class OrderAdmin(admin.ModelAdmin):
    list_display = (
        "id",
        "customer_name",
        "customer",
        "status",
        "payment_status",
        "payment_reference",
        "total",
        "created_at",
    )
    list_filter = ("status", "payment_status", "payment_method", "created_at")
    search_fields = ("customer_name", "customer__email", "phone")
    readonly_fields = (
        "customer",
        "customer_name",
        "phone",
        "delivery_address",
        "payment_method",
        "payment_status",
        "payment_reference",
        "total",
        "created_at",
        "updated_at",
    )
    inlines = (OrderItemInline,)


@admin.register(OrderItem)
class OrderItemAdmin(admin.ModelAdmin):
    list_display = ("order", "product_name", "quantity", "unit_price", "line_total")
    readonly_fields = ("order", "product", "product_name", "unit_price", "quantity", "line_total")
