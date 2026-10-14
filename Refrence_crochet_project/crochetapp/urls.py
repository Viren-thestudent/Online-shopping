from django.urls import path
from . import views

urlpatterns = [

    path(
        '',
        views.home,
        name='home'
    ),

    path(
        'product/<int:product_id>/',
        views.product_detail,
        name='product_detail'
    ),

    path(
        'cart/<int:product_id>/',
        views.add_to_cart,
        name='add_to_cart'
    ),

    path(
        'cart/',
        views.cart,
        name='cart'
    ),

    path(
        'cart/increase/<int:item_id>/',
        views.increase_quantity,
        name='increase_quantity'
    ),

    path(
        'cart/decrease/<int:item_id>/',
        views.decrease_quantity,
        name='decrease_quantity'
    ),

    path(
        'cart/remove/<int:item_id>/',
        views.remove_from_cart,
        name='remove_from_cart'
    ),

    path(
        'login/',
        views.login_view,
        name='login'
    ),

    path(
        'logout/',
        views.logout_view,
        name='logout'
    ),

    path(
        'checkout/',
        views.checkout,
        name='checkout'
    ),

    path(
        'order-success/<int:order_id>/',
        views.order_success,
        name='order_success'
    ),
]