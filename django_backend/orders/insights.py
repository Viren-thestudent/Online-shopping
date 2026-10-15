from collections import defaultdict
from datetime import date, timedelta
from decimal import Decimal, ROUND_HALF_UP

from django.db.models import Sum
from django.utils import timezone

from .models import Order, OrderItem

try:
    from sklearn.linear_model import LinearRegression
except ImportError:  # Keep descriptive insights available if an optional install is missing.
    LinearRegression = None


COMPLETED_ORDER_STATUSES = (
    Order.STATUS_CONFIRMED,
    Order.STATUS_PROCESSING,
    Order.STATUS_SHIPPED,
    Order.STATUS_DELIVERED,
)
MIN_FORECAST_WEEKS = 4
MIN_NONZERO_FORECAST_WEEKS = 3
FORECAST_HORIZON_WEEKS = 4


def money(value):
    return str(Decimal(value or 0).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP))


def week_start(value):
    local_value = timezone.localtime(value) if timezone.is_aware(value) else value
    return local_value.date() - timedelta(days=local_value.weekday())


def completed_sales_queryset():
    return Order.objects.filter(
        status__in=COMPLETED_ORDER_STATUSES,
        payment_status=Order.PAYMENT_STATUS_VERIFIED,
    )


def build_weekly_sales(completed_orders):
    weekly = defaultdict(lambda: {"revenue": Decimal("0.00"), "quantity": 0})
    order_rows = completed_orders.values_list("created_at", "total")
    item_rows = OrderItem.objects.filter(
        order__status__in=COMPLETED_ORDER_STATUSES,
        order__payment_status=Order.PAYMENT_STATUS_VERIFIED,
    ).values_list(
        "order__created_at", "quantity"
    )

    for created_at, total in order_rows:
        weekly[week_start(created_at)]["revenue"] += total or Decimal("0.00")
    for created_at, quantity in item_rows:
        weekly[week_start(created_at)]["quantity"] += quantity or 0

    if not weekly:
        return []

    first_week = min(weekly)
    last_week = max(weekly)
    periods = []
    current_week = first_week
    while current_week <= last_week:
        periods.append(
            {
                "period": current_week.isoformat(),
                "revenue": weekly[current_week]["revenue"],
                "quantity": weekly[current_week]["quantity"],
            }
        )
        current_week += timedelta(days=7)
    return periods


def build_forecast(weekly_sales):
    if LinearRegression is None:
        return {
            "available": False,
            "model": None,
            "message": "Forecasting is unavailable because scikit-learn is not installed.",
            "predictions": [],
        }

    nonzero_periods = [period for period in weekly_sales if period["revenue"] > 0]
    if len(weekly_sales) < MIN_FORECAST_WEEKS or len(nonzero_periods) < MIN_NONZERO_FORECAST_WEEKS:
        return {
            "available": False,
            "model": "scikit-learn LinearRegression",
            "message": (
                "More historical completed sales are needed before a reliable forecast can be shown. "
                f"At least {MIN_FORECAST_WEEKS} weeks with sales across "
                f"{MIN_NONZERO_FORECAST_WEEKS} periods are required."
            ),
            "predictions": [],
        }

    model = LinearRegression()
    x_values = [[index] for index in range(len(weekly_sales))]
    revenue_values = [float(period["revenue"]) for period in weekly_sales]
    model.fit(x_values, revenue_values)
    future_indexes = range(len(weekly_sales), len(weekly_sales) + FORECAST_HORIZON_WEEKS)
    last_period = date.fromisoformat(weekly_sales[-1]["period"])
    predictions = []
    for index, predicted_revenue in zip(future_indexes, model.predict([[value] for value in future_indexes])):
        predictions.append(
            {
                "period": (last_period + timedelta(days=7 * (index - len(weekly_sales) + 1))).isoformat(),
                "predicted_revenue": money(max(0, predicted_revenue)),
            }
        )

    return {
        "available": True,
        "model": "scikit-learn LinearRegression",
        "message": (
            f"Forecast trained on {len(weekly_sales)} completed-sales weeks. "
            "Predictions are directional and use weekly completed-sales revenue."
        ),
        "predictions": predictions,
    }


def build_sales_insights():
    completed_orders = completed_sales_queryset()
    completed_items = OrderItem.objects.filter(
        order__status__in=COMPLETED_ORDER_STATUSES,
        order__payment_status=Order.PAYMENT_STATUS_VERIFIED,
    )
    delivered_revenue = Order.objects.filter(
        status=Order.STATUS_DELIVERED,
        payment_status=Order.PAYMENT_STATUS_VERIFIED,
    ).aggregate(total=Sum("total"))["total"]

    best_selling = completed_items.values("product_id", "product_name").annotate(
        quantity_sold=Sum("quantity"),
        revenue=Sum("line_total"),
    ).order_by("-quantity_sold", "-revenue", "product_name")[:10]
    best_selling_products = [
        {
            "product_id": row["product_id"],
            "product_name": row["product_name"],
            "quantity_sold": row["quantity_sold"],
            "revenue": money(row["revenue"]),
        }
        for row in best_selling
    ]

    weekly_sales = build_weekly_sales(completed_orders)
    trend = [
        {
            "period": period["period"],
            "revenue": money(period["revenue"]),
            "quantity_sold": period["quantity"],
        }
        for period in weekly_sales[-12:]
    ]

    return {
        "summary": {
            "delivered_revenue": money(delivered_revenue),
            "completed_orders": completed_orders.count(),
            "completed_units": completed_items.aggregate(total=Sum("quantity"))["total"] or 0,
        },
        "best_selling_products": best_selling_products,
        "sales_trend": trend,
        "forecast": build_forecast(weekly_sales),
    }
