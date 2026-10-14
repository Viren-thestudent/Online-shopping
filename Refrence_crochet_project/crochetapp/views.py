from django.shortcuts import render, get_object_or_404, redirect
from django.contrib.auth import authenticate, login, logout
from django.contrib import messages
from django.contrib.auth.decorators import login_required

from .models import Product, Category, Cart, Order, OrderItem


def home(request):
    categories = Category.objects.all()
    products = Product.objects.all()

    return render(request, 'crochetapp/home.html', {
        'categories': categories,
        'products': products
    })


def product_detail(request, product_id):
    product = get_object_or_404(Product, id=product_id)

    return render(request, 'crochetapp/product_detail.html', {
        'product': product
    })


@login_required
def add_to_cart(request, product_id):
    product = get_object_or_404(Product, id=product_id)

    cart_item, created = Cart.objects.get_or_create(
        user=request.user,
        product=product,
        defaults={'quantity': 1}
    )

    if not created:
        cart_item.quantity += 1
        cart_item.save()

    return redirect('cart')


@login_required
def cart(request):
    cart_items = Cart.objects.filter(user=request.user)

    total = sum(
        item.product.price * item.quantity
        for item in cart_items
    )

    return render(request, 'crochetapp/cart.html', {
        'cart_items': cart_items,
        'total': total
    })

@login_required
def increase_quantity(request, item_id):
    cart_item = get_object_or_404(
        Cart,
        id=item_id,
        user=request.user
    )

    cart_item.quantity += 1
    cart_item.save()

    return redirect('cart')


@login_required
def decrease_quantity(request, item_id):
    cart_item = get_object_or_404(
        Cart,
        id=item_id,
        user=request.user
    )

    if cart_item.quantity > 1:
        cart_item.quantity -= 1
        cart_item.save()
    else:
        cart_item.delete()

    return redirect('cart')


@login_required
def remove_from_cart(request, item_id):
    cart_item = get_object_or_404(
        Cart,
        id=item_id,
        user=request.user
    )

    cart_item.delete()

    return redirect('cart') 

@login_required
def checkout(request):
    cart_items = Cart.objects.filter(user=request.user)

    if not cart_items.exists():
        return redirect('cart')

    total = sum(
        item.product.price * item.quantity
        for item in cart_items
    )

    if request.method == 'POST':
        address = request.POST.get('address')
        city = request.POST.get('city')
        state = request.POST.get('state')
        pincode = request.POST.get('pincode')

        order = Order.objects.create(
            user=request.user,
            address=address,
            city=city,
            state=state,
            pincode=pincode,
            total_price=total
        )

        for item in cart_items:
            OrderItem.objects.create(
                order=order,
                product=item.product,
                quantity=item.quantity,
                price=item.product.price
            )

        cart_items.delete()

        return redirect('order_success', order_id=order.id)

    return render(request, 'crochetapp/checkout.html', {
        'cart_items': cart_items,
        'total': total
    })

@login_required
def order_success(request, order_id):
    order = get_object_or_404(
        Order,
        id=order_id,
        user=request.user
    )

    return render(request, 'crochetapp/order_success.html', {
        'order': order
    })

# LOGIN
def login_view(request):

    if request.user.is_authenticated:
        return redirect('home')

    if request.method == 'POST':
        username = request.POST.get('username')
        password = request.POST.get('password')

        user = authenticate(
            request,
            username=username,
            password=password
        )

        if user is not None:
            login(request, user)
            return redirect('home')
        else:
            messages.error(request, 'Invalid username or password.')

    return render(request, 'crochetapp/login.html')


# LOGOUT
def logout_view(request):
    logout(request)
    return redirect('home')

