import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import UserNavbar from '../../Components/User/UserNavbar'
import { PRODUCTS, cartItemCount, formatPrice, getCart, saveCart } from '../../data/catalogue'

function CartPage({ theme, onToggleTheme }) {
  const [cart, setCart] = useState(() => getCart())

  useEffect(() => {
    const refreshCart = () => setCart(getCart())
    window.addEventListener('storage', refreshCart)
    window.addEventListener('loopluxe:cart-updated', refreshCart)
    return () => {
      window.removeEventListener('storage', refreshCart)
      window.removeEventListener('loopluxe:cart-updated', refreshCart)
    }
  }, [])

  const items = useMemo(() => PRODUCTS.filter((product) => cart[product.id]).map((product) => ({ ...product, quantity: cart[product.id] })), [cart])
  const total = items.reduce((sum, item) => sum + item.price * item.quantity, 0)

  const updateQuantity = (productId, quantity) => {
    const nextCart = { ...cart }
    if (quantity <= 0) delete nextCart[productId]
    else nextCart[productId] = quantity
    setCart(nextCart)
    saveCart(nextCart)
  }

  return (
    <div className="page-shell user-page">
      <UserNavbar theme={theme} onToggleTheme={onToggleTheme} cartCount={cartItemCount(cart)} />
      <main className="content-width cart-page">
        <div className="cart-heading"><div><p className="eyebrow">Your demo cart</p><h1>A little room for <em>good things.</em></h1><p>Cart interactions are stored locally in this frontend demo. No order is submitted.</p></div><Link className="button-secondary" to="/shop">Continue shopping</Link></div>
        {items.length ? <div className="cart-layout"><section className="cart-items glass-card">{items.map((item) => <article className="cart-item" key={item.id}><img src={item.image} alt="" /><div className="cart-item-copy"><p className="product-category">{item.badge}</p><h2><Link to={`/products/${item.id}`}>{item.name}</Link></h2><strong>{formatPrice(item.price)}</strong></div><div className="quantity-control"><button type="button" onClick={() => updateQuantity(item.id, item.quantity - 1)} aria-label={`Decrease ${item.name} quantity`}>−</button><span>{item.quantity}</span><button type="button" onClick={() => updateQuantity(item.id, item.quantity + 1)} aria-label={`Increase ${item.name} quantity`}>+</button></div><button className="remove-button" type="button" onClick={() => updateQuantity(item.id, 0)}>Remove</button></article>)}</section><aside className="cart-summary glass-card"><p className="eyebrow">Summary</p><div className="summary-row"><span>Pieces</span><strong>{cartItemCount(cart)}</strong></div><div className="summary-row total-row"><span>Demo total</span><strong>{formatPrice(total)}</strong></div><button className="button-primary" type="button" onClick={() => window.alert('This is a frontend demo cart. Checkout is not connected.')}>Proceed to demo checkout</button><small>No payment or order API is connected.</small></aside></div> : <div className="glass-card empty-catalogue cart-empty"><span className="empty-mark">♡</span><h2>Your cart is still open.</h2><p>Add a handmade piece from the catalogue and it will appear here.</p><Link className="button-primary" to="/shop">Explore the edit</Link></div>}
      </main>
    </div>
  )
}

export default CartPage
