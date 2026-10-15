import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import UserNavbar from '../../Components/User/UserNavbar'
import { fetchProduct } from '../../api/catalogueApi'
import { cartItemCount, formatPrice, getCart, saveCart } from '../../data/catalogue'

function ProductDetailPage({ theme, onToggleTheme }) {
  const { productId } = useParams()
  const [product, setProduct] = useState(null)
  const [cart, setCart] = useState(() => getCart())
  const [quantity, setQuantity] = useState(1)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')

  useEffect(() => {
    let active = true
    fetchProduct(productId).then((nextProduct) => { if (active) setProduct(nextProduct) }).catch((requestError) => { if (active) setError(requestError.message) }).finally(() => { if (active) setLoading(false) })
    const refreshCart = () => setCart(getCart())
    window.addEventListener('storage', refreshCart)
    window.addEventListener('loopluxe:cart-updated', refreshCart)
    return () => { active = false; window.removeEventListener('storage', refreshCart); window.removeEventListener('loopluxe:cart-updated', refreshCart) }
  }, [productId])

  const addToCart = () => {
    const nextCart = { ...cart, [product.id]: (cart[product.id] || 0) + quantity }
    setCart(nextCart)
    saveCart(nextCart)
    setNotice(`${quantity} ${quantity === 1 ? 'piece' : 'pieces'} added to your cart.`)
  }

  return (
    <div className="page-shell user-page"><UserNavbar theme={theme} onToggleTheme={onToggleTheme} cartCount={cartItemCount(cart)} /><main className="content-width detail-page"><Link className="back-link" to="/shop">← Back to catalogue</Link>{loading ? <div className="glass-card empty-catalogue"><h3>Loading product…</h3></div> : error ? <div className="form-message error" role="alert">{error}</div> : !product ? <div className="not-found-panel"><p className="eyebrow">Catalogue / not found</p><h1>That piece has wandered off.</h1><p>Return to the catalogue to find another handmade favourite.</p><Link className="button-primary" to="/shop">Back to shop</Link></div> : <div className="detail-grid"><div className="detail-image-wrap glass-card">{product.image_url ? <img className="detail-image" src={product.image_url} alt={product.name} /> : <div className="detail-image image-placeholder">No image uploaded</div>}</div><article className="detail-copy"><p className="product-category">{product.category_name || 'Uncategorised'}</p><h1>{product.name}</h1><p className="detail-price">{formatPrice(product.price)}</p><p className="detail-description">{product.description}</p><div className="detail-meta"><span>{product.is_available && product.stock > 0 ? `${product.stock} available` : 'Currently unavailable'}</span><span>Made with care</span></div><div className="quantity-row"><label htmlFor="quantity">Quantity</label><div className="quantity-control"><button type="button" onClick={() => setQuantity((current) => Math.max(1, current - 1))} aria-label="Decrease quantity">-</button><span>{quantity}</span><button type="button" onClick={() => setQuantity((current) => Math.min(product.stock || 1, current + 1))} aria-label="Increase quantity">+</button></div></div><button className="button-primary add-detail-button" type="button" disabled={!product.is_available || product.stock < 1} onClick={addToCart}>{product.is_available && product.stock > 0 ? `Add to cart · ${formatPrice(Number(product.price) * quantity)}` : 'Currently unavailable'}</button>{notice && <p className="shop-notice inline-notice" role="status">{notice} <Link to="/cart">View cart →</Link></p>}</article></div>}</main></div>
  )
}

export default ProductDetailPage
