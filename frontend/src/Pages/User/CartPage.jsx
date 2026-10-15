import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import UserNavbar from '../../Components/User/UserNavbar'
import { fetchProducts } from '../../api/catalogueApi'
import { cartItemCount, formatPrice, getCart, saveCart } from '../../data/catalogue'

function CartPage({ theme, onToggleTheme }) {
  const [cart, setCart] = useState(() => getCart())
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let active = true
    fetchProducts().then((nextProducts) => { if (active) setProducts(nextProducts) }).catch((requestError) => { if (active) setError(requestError.message) }).finally(() => { if (active) setLoading(false) })
    const refreshCart = () => setCart(getCart())
    window.addEventListener('storage', refreshCart)
    window.addEventListener('loopluxe:cart-updated', refreshCart)
    return () => { active = false; window.removeEventListener('storage', refreshCart); window.removeEventListener('loopluxe:cart-updated', refreshCart) }
  }, [])

  const items = useMemo(() => products.filter((product) => cart[product.id]).map((product) => ({ ...product, quantity: Number(cart[product.id]) })), [cart, products])
  const total = items.reduce((sum, item) => sum + Number(item.price) * item.quantity, 0)

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
        <div className="cart-heading"><div><p className="eyebrow">Your cart</p><h1>A little room for <em>good things.</em></h1><p>Review your pieces before paying securely with FamPay UPI.</p></div><Link className="button-secondary" to="/shop">Continue shopping</Link></div>
        {error && <div className="form-message error" role="alert">{error}</div>}
        {loading ? <div className="glass-card empty-catalogue"><h3>Loading cart items...</h3></div> : items.length ? <div className="cart-layout"><section className="cart-items glass-card">{items.map((item) => <article className="cart-item" key={item.id}><div className="cart-item-image">{item.image_url ? <img src={item.image_url} alt="" /> : <span className="image-placeholder">No image</span>}</div><div className="cart-item-copy"><p className="product-category">{item.category_name || 'Uncategorised'}</p><h2><Link to={`/products/${item.id}`}>{item.name}</Link></h2><strong>{formatPrice(item.price)}</strong><small className="cart-stock-note">{item.stock} available</small></div><div className="quantity-control"><button type="button" onClick={() => updateQuantity(item.id, item.quantity - 1)} aria-label={`Decrease ${item.name} quantity`}>-</button><span>{item.quantity}</span><button type="button" disabled={item.quantity >= item.stock} onClick={() => updateQuantity(item.id, item.quantity + 1)} aria-label={`Increase ${item.name} quantity`}>+</button></div><button className="remove-button" type="button" onClick={() => updateQuantity(item.id, 0)}>Remove</button></article>)}</section><aside className="cart-summary glass-card"><p className="eyebrow">Summary</p><div className="summary-row"><span>Pieces</span><strong>{cartItemCount(cart)}</strong></div><div className="summary-row total-row"><span>Total</span><strong>{formatPrice(total)}</strong></div><Link className="button-primary" to="/checkout">Proceed to checkout</Link><small>Stock and prices are verified again when your order is submitted.</small></aside></div> : <div className="glass-card empty-catalogue cart-empty"><span className="empty-mark">♡</span><h2>Your cart is still open.</h2><p>Add a handmade piece from the live catalogue and it will appear here.</p><Link className="button-primary" to="/shop">Explore the edit</Link></div>}
      </main>
    </div>
  )
}

export default CartPage
