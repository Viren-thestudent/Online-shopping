from decimal import Decimal

from django.db.models import Prefetch, Sum
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from users.views import ORMJWTAuthentication

from catalogue.models import Product
from users.models import User

from .models import Order, OrderItem
from .permissions import IsOrderAdmin
from .insights import build_sales_insights
from .serializers import (
    AdminOrderStatusSerializer,
    CreateOrderSerializer,
    DashboardOrderSerializer,
    OrderSerializer,
    AdminPaymentStatusSerializer,
    PaymentSubmissionSerializer,
)


def order_queryset():
    return Order.objects.select_related("customer").prefetch_related(
        Prefetch("items", queryset=OrderItem.objects.select_related("product"))
    )


class OrderListCreateView(APIView):
    authentication_classes = [ORMJWTAuthentication]
    permission_classes = [IsAuthenticated]

    def get(self, request):
        orders = order_queryset().filter(customer=request.user)
        return Response(OrderSerializer(orders, many=True, context={"request": request}).data)

    def post(self, request):
        serializer = CreateOrderSerializer(data=request.data, context={"request": request})
        serializer.is_valid(raise_exception=True)
        order = serializer.save()
        return Response(
            OrderSerializer(order, context={"request": request}).data,
            status=status.HTTP_201_CREATED,
        )


class CustomerOrderDetailView(APIView):
    authentication_classes = [ORMJWTAuthentication]
    permission_classes = [IsAuthenticated]

    def get(self, request, order_id):
        try:
            order = order_queryset().get(pk=order_id, customer=request.user)
        except Order.DoesNotExist:
            return Response({"message": "Order not found."}, status=status.HTTP_404_NOT_FOUND)
        return Response(OrderSerializer(order, context={"request": request}).data)


class CustomerPaymentSubmissionView(APIView):
    authentication_classes = [ORMJWTAuthentication]
    permission_classes = [IsAuthenticated]

    def post(self, request, order_id):
        try:
            order = Order.objects.get(pk=order_id, customer=request.user)
        except Order.DoesNotExist:
            return Response({"message": "Order not found."}, status=status.HTTP_404_NOT_FOUND)

        serializer = PaymentSubmissionSerializer(
            data=request.data,
            context={"order": order},
        )
        serializer.is_valid(raise_exception=True)
        order = serializer.save()
        order = order_queryset().get(pk=order.pk)
        return Response(OrderSerializer(order, context={"request": request}).data)


class AdminOrderListView(APIView):
    authentication_classes = [ORMJWTAuthentication]
    permission_classes = [IsOrderAdmin]

    def get(self, request):
        orders = order_queryset()
        return Response(OrderSerializer(orders, many=True, context={"request": request}).data)


class AdminDashboardView(APIView):
    authentication_classes = [ORMJWTAuthentication]
    permission_classes = [IsOrderAdmin]

    def get(self, request):
        delivered_revenue = Order.objects.filter(
            status=Order.STATUS_DELIVERED,
            payment_status=Order.PAYMENT_STATUS_VERIFIED,
        ).aggregate(total=Sum("total"))["total"] or Decimal("0.00")
        recent_orders = Order.objects.select_related("customer")[:5]

        return Response(
            {
                "stats": {
                    "total_products": Product.objects.count(),
                    "total_orders": Order.objects.count(),
                    "total_customers": User.objects.filter(is_admin=False).count(),
                    "delivered_revenue": str(delivered_revenue),
                },
                "recent_orders": DashboardOrderSerializer(recent_orders, many=True).data,
            }
        )


class AdminSalesInsightsView(APIView):
    authentication_classes = [ORMJWTAuthentication]
    permission_classes = [IsOrderAdmin]

    def get(self, request):
        return Response(build_sales_insights())


class AdminOrderStatusView(APIView):
    authentication_classes = [ORMJWTAuthentication]
    permission_classes = [IsOrderAdmin]

    def patch(self, request, order_id):
        try:
            order = Order.objects.get(pk=order_id)
        except Order.DoesNotExist:
            return Response({"message": "Order not found."}, status=status.HTTP_404_NOT_FOUND)

        serializer = AdminOrderStatusSerializer(order, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        order = order_queryset().get(pk=order.pk)
        return Response(OrderSerializer(order, context={"request": request}).data)


class AdminPaymentStatusView(APIView):
    authentication_classes = [ORMJWTAuthentication]
    permission_classes = [IsOrderAdmin]

    def patch(self, request, order_id):
        try:
            order = Order.objects.get(pk=order_id)
        except Order.DoesNotExist:
            return Response({"message": "Order not found."}, status=status.HTTP_404_NOT_FOUND)

        serializer = AdminPaymentStatusSerializer(order, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        order = order_queryset().get(pk=order.pk)
        return Response(OrderSerializer(order, context={"request": request}).data)
