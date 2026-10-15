from django.urls import path

from .views import (
    AdminDashboardView,
    AdminSalesInsightsView,
    AdminOrderListView,
    AdminOrderStatusView,
    AdminPaymentStatusView,
    CustomerOrderDetailView,
    CustomerPaymentSubmissionView,
    OrderListCreateView,
)


urlpatterns = [
    path("", OrderListCreateView.as_view(), name="order-list-create"),
    path("admin/dashboard", AdminDashboardView.as_view(), name="admin-dashboard"),
    path("admin/insights", AdminSalesInsightsView.as_view(), name="admin-sales-insights"),
    path("admin", AdminOrderListView.as_view(), name="admin-order-list"),
    path("admin/<int:order_id>/payment", AdminPaymentStatusView.as_view(), name="admin-payment-status"),
    path("admin/<int:order_id>", AdminOrderStatusView.as_view(), name="admin-order-status"),
    path("<int:order_id>/payment", CustomerPaymentSubmissionView.as_view(), name="customer-payment-submission"),
    path("<int:order_id>", CustomerOrderDetailView.as_view(), name="customer-order-detail"),
]
