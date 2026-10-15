from django.urls import path

from .views import (
    CategoryDetailView,
    CategoryListCreateView,
    ProductDetailView,
    ProductListCreateView,
)


urlpatterns = [
    path("categories", CategoryListCreateView.as_view(), name="category-list-create"),
    path("categories/<int:category_id>", CategoryDetailView.as_view(), name="category-detail"),
    path("products", ProductListCreateView.as_view(), name="product-list-create"),
    path("products/<int:product_id>", ProductDetailView.as_view(), name="product-detail"),
]
