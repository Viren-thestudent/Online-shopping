from rest_framework import status
from rest_framework.parsers import FormParser, JSONParser, MultiPartParser
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from users.views import ORMJWTAuthentication

from .models import Category, Product
from .permissions import IsCatalogueAdmin
from .recommendation_service import recommender
from .serializers import CategorySerializer, ProductSerializer


class CatalogueAPIView(APIView):
    authentication_classes = [ORMJWTAuthentication]

    def get_permissions(self):
        if self.request.method in {"POST", "PUT", "PATCH", "DELETE"}:
            return [IsCatalogueAdmin()]
        return [IsAuthenticated()]


class CategoryListCreateView(CatalogueAPIView):
    def get(self, request):
        serializer = CategorySerializer(Category.objects.all(), many=True)
        return Response(serializer.data)

    def post(self, request):
        serializer = CategorySerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data, status=status.HTTP_201_CREATED)


class CategoryDetailView(CatalogueAPIView):
    def get_object(self, category_id):
        return Category.objects.get(pk=category_id)

    def get(self, request, category_id):
        try:
            category = self.get_object(category_id)
        except Category.DoesNotExist:
            return Response({"message": "Category not found."}, status=status.HTTP_404_NOT_FOUND)
        return Response(CategorySerializer(category).data)

    def put(self, request, category_id):
        return self._update(request, category_id, partial=False)

    def patch(self, request, category_id):
        return self._update(request, category_id, partial=True)

    def _update(self, request, category_id, partial):
        try:
            category = self.get_object(category_id)
        except Category.DoesNotExist:
            return Response({"message": "Category not found."}, status=status.HTTP_404_NOT_FOUND)
        serializer = CategorySerializer(category, data=request.data, partial=partial)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data)

    def delete(self, request, category_id):
        try:
            category = self.get_object(category_id)
        except Category.DoesNotExist:
            return Response({"message": "Category not found."}, status=status.HTTP_404_NOT_FOUND)
        category.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class ProductListCreateView(CatalogueAPIView):
    parser_classes = [MultiPartParser, FormParser, JSONParser]

    def get(self, request):
        serializer = ProductSerializer(Product.objects.select_related("category"), many=True, context={"request": request})
        return Response(serializer.data)

    def post(self, request):
        serializer = ProductSerializer(data=request.data, context={"request": request})
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data, status=status.HTTP_201_CREATED)


class ProductDetailView(CatalogueAPIView):
    parser_classes = [MultiPartParser, FormParser, JSONParser]

    def get_object(self, product_id):
        return Product.objects.select_related("category").get(pk=product_id)

    def get(self, request, product_id):
        try:
            product = self.get_object(product_id)
        except Product.DoesNotExist:
            return Response({"message": "Product not found."}, status=status.HTTP_404_NOT_FOUND)
        return Response(ProductSerializer(product, context={"request": request}).data)

    def put(self, request, product_id):
        return self._update(request, product_id, partial=False)

    def patch(self, request, product_id):
        return self._update(request, product_id, partial=True)

    def _update(self, request, product_id, partial):
        try:
            product = self.get_object(product_id)
        except Product.DoesNotExist:
            return Response({"message": "Product not found."}, status=status.HTTP_404_NOT_FOUND)
        serializer = ProductSerializer(product, data=request.data, partial=partial, context={"request": request})
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data)

    def delete(self, request, product_id):
        try:
            product = self.get_object(product_id)
        except Product.DoesNotExist:
            return Response({"message": "Product not found."}, status=status.HTTP_404_NOT_FOUND)
        product.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class ProductRecommendationsView(APIView):
    """Return live, content-similar products for an authenticated customer."""

    authentication_classes = [ORMJWTAuthentication]
    permission_classes = [IsAuthenticated]

    def get(self, request):
        raw_product_id = request.query_params.get("product_id")
        if raw_product_id is None:
            return Response(
                {"message": "product_id is required."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        try:
            product_id = int(raw_product_id)
        except (TypeError, ValueError):
            return Response(
                {"message": "product_id must be a valid integer."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        if product_id < 1:
            return Response(
                {"message": "product_id must be a positive integer."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            products = recommender.recommend(product_id)
        except Product.DoesNotExist:
            return Response(
                {"message": "Product not found."},
                status=status.HTTP_404_NOT_FOUND,
            )

        serializer = ProductSerializer(
            products,
            many=True,
            context={"request": request},
        )
        return Response(serializer.data)
