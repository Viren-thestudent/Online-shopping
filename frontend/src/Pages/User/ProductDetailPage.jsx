import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import UserNavbar from '../../Components/User/UserNavbar'
import RecommendationSection from '../../Components/User/RecommendationSection'
import { fetchProduct, fetchRecommendations } from '../../api/catalogueApi'
import { cartItemCount, formatPrice, getCart, saveCart } from '../../data/catalogue'

function ProductDetailPage({ theme, onToggleTheme }) {
  const { productId } = useParams()
  const [product, setProduct] = useState(null)
  const [cart, setCart] = useState(() => getCart())
  const [quantity, setQuantity] = useState(1)
  const [error, setError] = useState('')
  const [recommendations, setRecommendations] = useState([])
  const [recommendationsError, setRecommendationsError] = useState('')
  const [recommendationsForProductId, setRecommendationsForProductId] = useState('')
  const [errorForProductId, setErrorForProductId] = useState('')
  const [notice, setNotice] = useState('')

  useEffect(() => {
    let active = true

    fetchProduct(productId)
      .then((nextProduct) => {
        if (!active) return
        setProduct(nextProduct)
        setError('')
      })
      .catch((requestError) => {
        if (!active) return
        setError(requestError.message)
        setErrorForProductId(String(productId))
      })

    fetchRecommendations(productId)
      .then((nextRecommendations) => {
        if (!active) return
        setRecommendations(nextRecommendations)
        setRecommendationsError('')
        setRecommendationsForProductId(String(productId))
      })
      .catch((requestError) => {
        if (!active) return
        setRecommendationsError(requestError.message)
        setRecommendationsForProductId(String(productId))
      })

    const refreshCart = () => setCart(getCart())
    window.addEventListener('storage', refreshCart)
    window.addEventListener('loopluxe:cart-updated', refreshCart)
    return () => {
      active = false
      window.removeEventListener('storage', refreshCart)
      window.removeEventListener('loopluxe:cart-updated', refreshCart)
    }
  }, [productId])

  const currentProduct = product && String(product.id) === String(productId) ? product : null
  const currentError = errorForProductId === String(productId) ? error : ''
  const productLoading = !currentProduct && !currentError
  const recommendationsForCurrentProduct = recommendationsForProductId === String(productId)
  const recommendationsLoading = !recommendationsForCurrentProduct

  const addToCart = () => {
    const nextCart = { ...cart, [currentProduct.id]: (cart[currentProduct.id] || 0) + quantity }
    setCart(nextCart)
    saveCart(nextCart)
    setNotice(`${quantity} ${quantity === 1 ? 'piece' : 'pieces'} added to your cart.`)
  }

  return (
    <div className="page-shell user-page">
      <UserNavbar theme={theme} onToggleTheme={onToggleTheme} cartCount={cartItemCount(cart)} />
      <main className="content-width detail-page">
        <Link className="back-link" to="/shop">Back to catalogue</Link>
        {productLoading ? <div className="glass-card empty-catalogue"><h3>Loading product...</h3></div> : currentError ? <div className="form-message error" role="alert">{currentError}</div> : !currentProduct ? <div className="not-found-panel"><p className="eyebrow">Catalogue / not found</p><h1>That piece has wandered off.</h1><p>Return to the catalogue to find another handmade favourite.</p><Link className="button-primary" to="/shop">Back to shop</Link></div> : (
          <>
            <div className="detail-grid">
              <div className="detail-image-wrap glass-card">{currentProduct.image_url ? <img className="detail-image" src={currentProduct.image_url} alt={currentProduct.name} /> : <div className="detail-image image-placeholder">No image uploaded</div>}</div>
              <article className="detail-copy">
                <p className="product-category">{currentProduct.category_name || 'Uncategorised'}</p>
                <h1>{currentProduct.name}</h1>
                <p className="detail-price">{formatPrice(currentProduct.price)}</p>
                <p className="detail-description">{currentProduct.description}</p>
                <div className="detail-meta"><span>{currentProduct.is_available && currentProduct.stock > 0 ? `${currentProduct.stock} available` : 'Currently unavailable'}</span><span>Made with care</span></div>
                <div className="quantity-row"><label htmlFor="quantity">Quantity</label><div className="quantity-control"><button type="button" onClick={() => setQuantity((value) => Math.max(1, value - 1))} aria-label="Decrease quantity">-</button><span>{quantity}</span><button type="button" onClick={() => setQuantity((value) => Math.min(currentProduct.stock || 1, value + 1))} aria-label="Increase quantity">+</button></div></div>
                <button className="button-primary add-detail-button" type="button" disabled={!currentProduct.is_available || currentProduct.stock < 1} onClick={addToCart}>{currentProduct.is_available && currentProduct.stock > 0 ? `Add to cart · ${formatPrice(Number(currentProduct.price) * quantity)}` : 'Currently unavailable'}</button>
                {notice && <p className="shop-notice inline-notice" role="status">{notice} <Link to="/cart">View cart</Link></p>}
              </article>
            </div>
            <RecommendationSection title="Similar Products" description="Matched from names, categories, and descriptions in the live catalogue." products={recommendationsForCurrentProduct ? recommendations : []} loading={recommendationsLoading} error={recommendationsForCurrentProduct ? recommendationsError : ''} />
          </>
        )}
      </main>
    </div>
  )
}

export default ProductDetailPage
