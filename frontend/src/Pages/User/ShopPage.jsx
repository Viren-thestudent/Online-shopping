import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import UserNavbar from '../../Components/User/UserNavbar'
import RecommendationSection from '../../Components/User/RecommendationSection'
import SmartShoppingAssistant from '../../Components/User/SmartShoppingAssistant'
import { fetchCategories, fetchProducts, fetchRecommendations } from '../../api/catalogueApi'
import { cartItemCount, formatPrice, getCart, saveCart } from '../../data/catalogue'

function ProductCard({ product, onAdd }) {
  return (
    <article className="product-card glass-card">
      <Link className="product-image-link" to={`/products/${product.id}`}>
        {product.image_url ? <img className="product-image" src={product.image_url} alt={product.name} /> : <span className="image-placeholder">No image yet</span>}
        {product.is_available && product.stock > 0 && <span className="product-badge">Available</span>}
      </Link>
      <div className="product-card-body">
        <p className="product-category">{product.category_name || 'Uncategorised'}</p>
        <h3><Link to={`/products/${product.id}`}>{product.name}</Link></h3>
        <div className="product-card-footer">
          <strong>{formatPrice(product.price)}</strong>
          <button className="button-secondary compact-button" type="button" onClick={() => onAdd(product)} disabled={!product.is_available || product.stock < 1}>{product.stock > 0 && product.is_available ? 'Add to cart' : 'Unavailable'}</button>
        </div>
      </div>
    </article>
  )
}

function ShopPage({ theme, onToggleTheme }) {
  const [categories, setCategories] = useState([])
  const [catalogue, setCatalogue] = useState([])
  const [cart, setCart] = useState(() => getCart())
  const [search, setSearch] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [sort, setSort] = useState('featured')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [recommendations, setRecommendations] = useState([])
  const [recommendationsError, setRecommendationsError] = useState('')
  const [recommendationsForProductId, setRecommendationsForProductId] = useState('')
  const [notice, setNotice] = useState('')

  useEffect(() => {
    let active = true
    Promise.all([fetchCategories(), fetchProducts()])
      .then(([nextCategories, nextProducts]) => {
        if (!active) return
        setCategories(nextCategories)
        setCatalogue(nextProducts)
        setError('')
      })
      .catch((requestError) => { if (active) setError(requestError.message) })
      .finally(() => { if (active) setLoading(false) })
    const refreshCart = () => setCart(getCart())
    window.addEventListener('storage', refreshCart)
    window.addEventListener('loopluxe:cart-updated', refreshCart)
    return () => {
      active = false
      window.removeEventListener('storage', refreshCart)
      window.removeEventListener('loopluxe:cart-updated', refreshCart)
    }
  }, [])

  const recommendationSeed = catalogue.find((product) => product.is_available && product.stock > 0)

  useEffect(() => {
    if (!recommendationSeed) return undefined

    let active = true
    fetchRecommendations(recommendationSeed.id)
      .then((nextRecommendations) => {
        if (!active) return
        setRecommendations(nextRecommendations)
        setRecommendationsError('')
        setRecommendationsForProductId(String(recommendationSeed.id))
      })
      .catch((requestError) => {
        if (!active) return
        setRecommendationsError(requestError.message)
        setRecommendationsForProductId(String(recommendationSeed.id))
      })
    return () => { active = false }
  }, [recommendationSeed])

  const products = useMemo(() => {
    const query = search.trim().toLowerCase()
    return catalogue
      .filter((product) => selectedCategory === 'all' || String(product.category) === selectedCategory)
      .filter((product) => !query || `${product.name} ${product.description} ${product.category_name || ''}`.toLowerCase().includes(query))
      .sort((first, second) => sort === 'price-low' ? Number(first.price) - Number(second.price) : sort === 'price-high' ? Number(second.price) - Number(first.price) : 0)
  }, [catalogue, search, selectedCategory, sort])

  const addToCart = (product) => {
    const currentQuantity = Number(cart[product.id] || 0)
    if (currentQuantity >= product.stock) {
      setNotice(`${product.name} is already at the available stock limit.`)
      return
    }
    const nextCart = { ...cart, [product.id]: currentQuantity + 1 }
    setCart(nextCart)
    saveCart(nextCart)
    setNotice(`${product.name} added to your cart.`)
    window.setTimeout(() => setNotice(''), 2600)
  }

  const recommendationsForCurrentSeed = recommendationSeed && recommendationsForProductId === String(recommendationSeed.id)
  const recommendationsToDisplay = recommendationsForCurrentSeed ? recommendations : []
  const recommendationsAreLoading = Boolean(recommendationSeed) && !recommendationsForCurrentSeed
  const recommendationsDisplayError = recommendationsForCurrentSeed ? recommendationsError : ''

  return (
    <div className="page-shell user-page" id="top">
      <UserNavbar theme={theme} onToggleTheme={onToggleTheme} cartCount={cartItemCount(cart)} />
      <main>
        <SmartShoppingAssistant products={catalogue} loading={loading} error={error} />
        <section className="shop-hero"><div className="content-width shop-hero-grid"><div><p className="eyebrow">Knot &amp; Bloom / live catalogue</p><h1>Find a small thing with a <em>big feeling.</em></h1><p>Browse the current collection of crochet pieces made for gifting, collecting, and everyday routines.</p></div><div className="shop-hero-note glass-card"><span className="hero-note-mark">*</span><div><strong>Connected to the studio</strong><small>Prices, categories, stock, and images come from the Django catalogue.</small></div></div></div></section>
        <div className="content-width"><RecommendationSection title="Recommended for You" description="A live catalogue-based starting point; future behaviour data can make this personal." products={recommendationsToDisplay} loading={recommendationsAreLoading} error={recommendationsDisplayError} /></div>
        <section className="catalogue-section">
          <div className="content-width">
            <div className="catalogue-toolbar glass-card"><label className="search-field"><span>Search</span><input type="search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder='Try "phone case" or "gift"' /></label><div className="category-filters" aria-label="Filter by category"><button className={selectedCategory === 'all' ? 'filter-chip active' : 'filter-chip'} type="button" onClick={() => setSelectedCategory('all')}>All pieces</button>{categories.map((category) => <button className={selectedCategory === String(category.id) ? 'filter-chip active' : 'filter-chip'} type="button" key={category.id} onClick={() => setSelectedCategory(String(category.id))}>{category.name}</button>)}</div><label className="sort-field"><span>Sort</span><select value={sort} onChange={(event) => setSort(event.target.value)}><option value="featured">Featured</option><option value="price-low">Price: low to high</option><option value="price-high">Price: high to low</option></select></label></div>
            {notice && <div className="shop-notice" role="status">{notice} <Link to="/cart">View cart</Link></div>}
            <div className="catalogue-heading"><div><p className="eyebrow">The current edit</p><h2 className="section-title">Pieces made to <em>stay.</em></h2></div><span className="catalogue-count">{loading ? 'Loading...' : `${products.length} ${products.length === 1 ? 'piece' : 'pieces'}`}</span></div>
            {error && <div className="form-message error" role="alert">{error}</div>}
            {loading ? <div className="glass-card empty-catalogue"><h3>Loading the live catalogue...</h3></div> : products.length ? <div className="product-grid">{products.map((product) => <ProductCard key={product.id} product={product} onAdd={addToCart} />)}</div> : <div className="glass-card empty-catalogue"><span className="empty-mark">-</span><h3>No pieces matched that search.</h3><p>Try another phrase or clear the category filter.</p><button className="button-secondary" type="button" onClick={() => { setSearch(''); setSelectedCategory('all') }}>Show all pieces</button></div>}
          </div>
        </section>
      </main>
      <footer className="site-footer"><div className="content-width"><div className="footer-bottom"><span>Copyright 2026 Knot &amp; Bloom</span><span>Catalogue / checkout</span></div></div></footer>
    </div>
  )
}

export default ShopPage
