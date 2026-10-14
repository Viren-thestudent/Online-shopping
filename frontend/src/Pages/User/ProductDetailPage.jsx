import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import UserNavbar from '../../Components/User/UserNavbar'
import { PRODUCTS, cartItemCount, categoryName, formatPrice, getCart, getCategories, saveCart } from '../../data/catalogue'

function ProductDetailPage({ theme, onToggleTheme }) {
  const { productId } = useParams()
  const product = PRODUCTS.find((item) => item.id === productId)
  const [categories] = useState(() => getCategories())
  const [cart, setCart] = useState(() => getCart())
  const [quantity, setQuantity] = useState(1)
  const [notice, setNotice] = useState('')

  useEffect(() => {
    const refreshCart = () => setCart(getCart())
    window.addEventListener('storage', refreshCart)
    window.addEventListener('loopluxe:cart-updated', refreshCart)
    return () => {
      window.removeEventListener('storage', refreshCart)
      window.removeEventListener('loopluxe:cart-updated', refreshCart)
    }
  }, [])

  if (!product) {
    return <div className="page-shell user-page"><UserNavbar theme={theme} onToggleTheme={onToggleTheme} cartCount={cartItemCount(cart)} /><main className="content-width not-found-panel"><p className="eyebrow">Catalogue / not found</p><h1>That piece has wandered off.</h1><p>Return to the catalogue to find another handmade favourite.</p><Link className="button-primary" to="/shop">Back to shop</Link></main></div>
  }

  const addToCart = () => {
    const nextCart = { ...cart, [product.id]: (cart[product.id] || 0) + quantity }
    setCart(nextCart)
    saveCart(nextCart)
    setNotice(`${quantity} ${quantity === 1 ? 'piece' : 'pieces'} added to your demo cart.`)
  }

  return (
    <div className="page-shell user-page">
      <UserNavbar theme={theme} onToggleTheme={onToggleTheme} cartCount={cartItemCount(cart)} />
      <main className="content-width detail-page">
        <Link className="back-link" to="/shop">← Back to catalogue</Link>
        <div className="detail-grid">
          <div className="detail-image-wrap glass-card"><img className="detail-image" src={product.image} alt={product.name} /></div>
          <article className="detail-copy"><p className="product-category">{categoryName(categories, product.categoryId)}</p><h1>{product.name}</h1><p className="detail-price">{formatPrice(product.price)}</p><p className="detail-description">{product.description}</p><div className="detail-meta"><span>Small batch</span><span>Gift-ready</span><span>Made with care</span></div><div className="quantity-row"><label htmlFor="quantity">Quantity</label><div className="quantity-control"><button type="button" onClick={() => setQuantity((current) => Math.max(1, current - 1))} aria-label="Decrease quantity">−</button><span>{quantity}</span><button type="button" onClick={() => setQuantity((current) => current + 1)} aria-label="Increase quantity">+</button></div></div><button className="button-primary add-detail-button" type="button" onClick={addToCart}>Add to demo cart · {formatPrice(product.price * quantity)}</button>{notice && <p className="shop-notice inline-notice" role="status">{notice} <Link to="/cart">View cart →</Link></p>}</article>
        </div>
      </main>
    </div>
  )
}

export default ProductDetailPage
