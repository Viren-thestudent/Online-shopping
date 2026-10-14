import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import UserNavbar from '../../Components/User/UserNavbar'
import {
  PRODUCTS,
  cartItemCount,
  categoryName,
  formatPrice,
  getCart,
  getCategories,
  saveCart,
} from '../../data/catalogue'

function ProductCard({ product, categories, onAdd }) {
  return (
    <article className="product-card glass-card">
      <Link className="product-image-link" to={`/products/${product.id}`}>
        <img className="product-image" src={product.image} alt={product.name} />
        <span className="product-badge">{product.badge}</span>
      </Link>
      <div className="product-card-body">
        <p className="product-category">{categoryName(categories, product.categoryId)}</p>
        <h3><Link to={`/products/${product.id}`}>{product.name}</Link></h3>
        <div className="product-card-footer">
          <strong>{formatPrice(product.price)}</strong>
          <button className="button-secondary compact-button" type="button" onClick={() => onAdd(product)}>Add to cart</button>
        </div>
      </div>
    </article>
  )
}

function ShopPage({ theme, onToggleTheme }) {
  const [categories, setCategories] = useState(() => getCategories())
  const [cart, setCart] = useState(() => getCart())
  const [search, setSearch] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [sort, setSort] = useState('featured')
  const [notice, setNotice] = useState('')

  useEffect(() => {
    const refreshCategories = () => {
      setCategories(getCategories())
      setSelectedCategory((current) => current === 'all' || getCategories().some((category) => category.id === current) ? current : 'all')
    }
    const refreshCart = () => setCart(getCart())
    window.addEventListener('storage', refreshCategories)
    window.addEventListener('loopluxe:categories-updated', refreshCategories)
    window.addEventListener('storage', refreshCart)
    window.addEventListener('loopluxe:cart-updated', refreshCart)
    return () => {
      window.removeEventListener('storage', refreshCategories)
      window.removeEventListener('loopluxe:categories-updated', refreshCategories)
      window.removeEventListener('storage', refreshCart)
      window.removeEventListener('loopluxe:cart-updated', refreshCart)
    }
  }, [])

  const products = useMemo(() => {
    const query = search.trim().toLowerCase()
    return PRODUCTS
      .filter((product) => selectedCategory === 'all' || product.categoryId === selectedCategory)
      .filter((product) => !query || `${product.name} ${product.description}`.toLowerCase().includes(query))
      .sort((first, second) => {
        if (sort === 'price-low') return first.price - second.price
        if (sort === 'price-high') return second.price - first.price
        return 0
      })
  }, [search, selectedCategory, sort])

  const addToCart = (product) => {
    const nextCart = { ...cart, [product.id]: (cart[product.id] || 0) + 1 }
    setCart(nextCart)
    saveCart(nextCart)
    setNotice(`${product.name} added to your demo cart.`)
    window.setTimeout(() => setNotice(''), 2600)
  }

  return (
    <div className="page-shell user-page" id="top">
      <UserNavbar theme={theme} onToggleTheme={onToggleTheme} cartCount={cartItemCount(cart)} />
      <main>
        <section className="shop-hero">
          <div className="content-width shop-hero-grid">
            <div>
              <p className="eyebrow">LoopLuxe / handmade catalogue</p>
              <h1>Find a small thing with a <em>big feeling.</em></h1>
              <p>Browse crochet pieces made for gifting, collecting, and adding a little character to everyday routines.</p>
            </div>
            <div className="shop-hero-note glass-card"><span className="hero-note-mark">✦</span><div><strong>Made slowly</strong><small>Every piece starts with yarn, care, and a good idea.</small></div></div>
          </div>
        </section>

        <section className="catalogue-section">
          <div className="content-width">
            <div className="catalogue-toolbar glass-card">
              <label className="search-field"><span>Search</span><input type="search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Try “bike” or “gift”" /></label>
              <div className="category-filters" aria-label="Filter by category">
                <button className={selectedCategory === 'all' ? 'filter-chip active' : 'filter-chip'} type="button" onClick={() => setSelectedCategory('all')}>All pieces</button>
                {categories.map((category) => <button className={selectedCategory === category.id ? 'filter-chip active' : 'filter-chip'} type="button" key={category.id} onClick={() => setSelectedCategory(category.id)}>{category.name}</button>)}
              </div>
              <label className="sort-field"><span>Sort</span><select value={sort} onChange={(event) => setSort(event.target.value)}><option value="featured">Featured</option><option value="price-low">Price: low to high</option><option value="price-high">Price: high to low</option></select></label>
            </div>

            {notice && <div className="shop-notice" role="status">{notice} <Link to="/cart">View cart →</Link></div>}
            <div className="catalogue-heading"><div><p className="eyebrow">The current edit</p><h2 className="section-title">Pieces made to <em>stay.</em></h2></div><span className="catalogue-count">{products.length} {products.length === 1 ? 'piece' : 'pieces'}</span></div>
            {products.length ? <div className="product-grid">{products.map((product) => <ProductCard key={product.id} product={product} categories={categories} onAdd={addToCart} />)}</div> : <div className="glass-card empty-catalogue"><span className="empty-mark">⌕</span><h3>No pieces matched that search.</h3><p>Try another phrase or clear the category filter to see the full edit.</p><button className="button-secondary" type="button" onClick={() => { setSearch(''); setSelectedCategory('all') }}>Show all pieces</button></div>}
          </div>
        </section>
      </main>
      <footer className="site-footer"><div className="content-width"><div className="footer-bottom"><span>© 2026 LoopLuxe Studio</span><span>Catalogue / demo cart</span></div></div></footer>
    </div>
  )
}

export default ShopPage
