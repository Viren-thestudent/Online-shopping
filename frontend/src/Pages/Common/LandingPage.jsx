import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { backendUrl, fetchCategories, fetchProducts, fetchProfile } from '../../api/catalogueApi'
import { cartItemCount, formatPrice, getCart, saveCart } from '../../data/catalogue'

const categoryArt = {
  'Phone Covers': { image: backendUrl('/media/products/Birds_Crochet_Phone_Case.jpg'), position: 'center' },
  'Crochet Flowers': { image: '/assets/knots-of-joy-tulip-bouquet.jpg', position: 'center 38%' },
  'Keychains & Charms': { image: '/assets/knots-of-joy-tulip-bouquet.jpg', position: 'center 45%' },
  'Gifts & Accessories': { image: '/assets/knots-of-joy-tulip-bouquet.jpg', position: 'center 62%' },
}

const fallbackCategories = [
  { id: 'phone-covers', name: 'Phone Covers', description: 'Soft, practical pieces for everyday carry.' },
  { id: 'crochet-flowers', name: 'Crochet Flowers', description: 'A little colour that never fades.' },
  { id: 'keychains-charms', name: 'Keychains & Charms', description: 'Tiny companions for your daily rituals.' },
  { id: 'gifts-accessories', name: 'Gifts & Accessories', description: 'Thoughtful details, ready to give.' },
]

function ArrowIcon() {
  return <svg aria-hidden="true" viewBox="0 0 20 20" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.4"><path d="M3 10h13M11 4l6 6-6 6" /></svg>
}

function BagIcon() {
  return <svg aria-hidden="true" viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M5 8.5h14l-1 12H6l-1-12Z" /><path d="M9 9V6a3 3 0 0 1 6 0v3" /></svg>
}

function LandingNavbar({ isAuthenticated, isAdmin, cartCount, menuOpen, onMenuToggle, onCloseMenu }) {
  return (
    <header className="site-header home-header">
      <div className="content-width home-nav-inner">
        <Link className="home-brand" to="/" aria-label="Knot &amp; Bloom home" onClick={onCloseMenu}>
          <span className="home-brand-logo-wrap"><img className="home-brand-logo" src="/assets/knot-and-bloom-logo.png" alt="Knot &amp; Bloom logo" /></span>
        </Link>
        <nav className="home-nav-links" aria-label="Main navigation">
          <a href="#home">Home</a><Link to="/shop">Shop</Link><a href="#collections">Categories</a><a href="#story">About</a><a href="#contact">Contact</a>
        </nav>
        <div className="home-nav-actions">
          {isAuthenticated ? <><Link className="home-account-link" to="/user-home">Account</Link>{isAdmin && <Link className="home-account-link home-admin-link" to="/admin/dashboard">Admin</Link>}<Link className="home-bag-link" to="/cart" aria-label={`Cart with ${cartCount} items`}><BagIcon /><span>Cart</span><b>{cartCount}</b></Link></> : <><Link className="home-account-link" to="/login">Login</Link><Link className="home-register-link" to="/register">Register</Link></>}
          <button className="home-menu-button" type="button" onClick={onMenuToggle} aria-label="Toggle navigation menu" aria-expanded={menuOpen}><span /><span /></button>
        </div>
      </div>
      <nav className={`home-mobile-nav ${menuOpen ? 'open' : ''}`} aria-label="Mobile navigation">
        <a href="#home" onClick={onCloseMenu}>Home</a><Link to="/shop" onClick={onCloseMenu}>Shop</Link><a href="#collections" onClick={onCloseMenu}>Categories</a><a href="#story" onClick={onCloseMenu}>About</a><a href="#contact" onClick={onCloseMenu}>Contact</a>
        {isAuthenticated ? <><Link to="/user-home" onClick={onCloseMenu}>Account</Link><Link to="/cart" onClick={onCloseMenu}>Cart ({cartCount})</Link>{isAdmin && <Link to="/admin/dashboard" onClick={onCloseMenu}>Admin dashboard</Link>}</> : <><Link to="/login" onClick={onCloseMenu}>Login</Link><Link to="/register" onClick={onCloseMenu}>Register</Link></>}
      </nav>
    </header>
  )
}

function HomeCategoryCard({ category }) {
  const art = categoryArt[category.name] || categoryArt['Gifts & Accessories']
  return <Link className="home-category-card" to="/shop"><img src={art.image} alt="" style={{ objectPosition: art.position }} /><span className="home-category-shade" /><span className="home-category-copy"><small>Explore</small><strong>{category.name}</strong><span>{category.description || 'Made to be kept close.'}</span></span><span className="home-category-arrow"><ArrowIcon /></span></Link>
}

function HomeProductCard({ product, onAdd }) {
  const available = product.is_available && product.stock > 0
  return <article className="home-product-card"><Link className="home-product-image" to={`/products/${product.id}`}>{product.image_url ? <img src={product.image_url} alt={product.name} /> : <span>No image available</span>}<span className={`home-stock-pill ${available ? '' : 'unavailable'}`}>{available ? 'In stock' : 'Unavailable'}</span></Link><div className="home-product-copy"><span>{product.category_name || 'The collection'}</span><h3><Link to={`/products/${product.id}`}>{product.name}</Link></h3><div className="home-product-meta"><strong>{formatPrice(product.price)}</strong><button type="button" onClick={() => onAdd(product)} disabled={!available}>{available ? 'Add to cart' : 'Sold out'}</button></div></div></article>
}

function LandingPage() {
  const isAuthenticated = Boolean(localStorage.getItem('token'))
  const [isAdmin, setIsAdmin] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const [categories, setCategories] = useState([])
  const [catalogue, setCatalogue] = useState([])
  const [cart, setCart] = useState(() => getCart())
  const [loading, setLoading] = useState(() => Boolean(localStorage.getItem('token')))
  const [notice, setNotice] = useState('')

  useEffect(() => {
    const refreshCart = () => setCart(getCart())
    window.addEventListener('storage', refreshCart)
    window.addEventListener('loopluxe:cart-updated', refreshCart)
    return () => { window.removeEventListener('storage', refreshCart); window.removeEventListener('loopluxe:cart-updated', refreshCart) }
  }, [])

  useEffect(() => {
    if (!isAuthenticated) return undefined
    let active = true
    Promise.all([fetchCategories(), fetchProducts()]).then(([nextCategories, nextProducts]) => { if (active) { setCategories(nextCategories); setCatalogue(nextProducts) } }).catch(() => { if (active) { setCategories([]); setCatalogue([]) } }).finally(() => { if (active) setLoading(false) })
    fetchProfile().then((user) => { if (active) setIsAdmin(Boolean(user?.is_admin)) }).catch(() => { if (active) setIsAdmin(false) })
    return () => { active = false }
  }, [isAuthenticated])

  const featuredProducts = useMemo(() => catalogue.filter((product) => product.is_available && product.stock > 0).slice(0, 4), [catalogue])
  const visibleCategories = categories.length ? categories.slice(0, 4) : fallbackCategories

  const addToCart = (product) => {
    const currentQuantity = Number(cart[product.id] || 0)
    if (currentQuantity >= product.stock) { setNotice(`${product.name} is already at the available stock limit.`); return }
    const nextCart = { ...cart, [product.id]: currentQuantity + 1 }
    setCart(nextCart); saveCart(nextCart); setNotice(`${product.name} added to your cart.`); window.setTimeout(() => setNotice(''), 2600)
  }

  return <div className="page-shell knots-home" id="home">
    <div className="home-announcement"><span>Small things, made with feeling</span><span className="home-announcement-line" /><span>Est. for everyday joy</span></div>
    <LandingNavbar isAuthenticated={isAuthenticated} isAdmin={isAdmin} cartCount={cartItemCount(cart)} menuOpen={menuOpen} onMenuToggle={() => setMenuOpen((open) => !open)} onCloseMenu={() => setMenuOpen(false)} />
    <main>
      <section className="home-hero"><div className="content-width home-hero-grid"><div className="home-hero-copy"><p className="home-eyebrow">Knot &amp; Bloom / handmade objects</p><h1>Handcrafted crochet,<br /><em>made with love.</em></h1><p className="home-hero-lead">Thoughtful little pieces, made slowly and designed to bring a soft moment of joy to the everyday.</p><div className="home-hero-actions"><Link className="home-button home-button-primary" to="/shop">Explore collection <ArrowIcon /></Link><a className="home-button home-button-quiet" href="#story">Discover our story <ArrowIcon /></a></div><div className="home-hero-note"><span className="home-note-dot" /> Made by hand in small batches</div></div><div className="home-hero-visual"><div className="home-hero-image-frame"><img src="/assets/knots-of-joy-tulip-bouquet.jpg" alt="A bouquet of pink crochet tulips" /></div><div className="home-hero-caption"><span>01</span><p>The joy is in<br /><em>the little details.</em></p></div><div className="home-hero-sticker">Made<br />with<br /><em>joy</em></div></div></div></section>
      <section className="home-category-section" id="collections"><div className="content-width"><div className="home-section-heading"><div><p className="home-eyebrow">Browse the edit</p><h2>Find your <em>favourite.</em></h2></div><Link to="/shop" className="home-text-link">View all pieces <ArrowIcon /></Link></div><div className="home-category-grid">{visibleCategories.map((category) => <HomeCategoryCard category={category} key={category.id || category.name} />)}</div></div></section>
      <section className="home-products-section"><div className="content-width"><div className="home-section-heading"><div><p className="home-eyebrow">The current collection</p><h2>Pieces made to <em>stay.</em></h2></div><span className="home-section-rule" /></div>{isAuthenticated && loading && <div className="home-catalogue-status">Gathering the live collection…</div>}{isAuthenticated && !loading && featuredProducts.length > 0 && <div className="home-product-grid">{featuredProducts.map((product) => <HomeProductCard product={product} onAdd={addToCart} key={product.id} />)}</div>}{!isAuthenticated && <div className="home-catalogue-gate"><div><p className="home-eyebrow">Live catalogue</p><h3>Made for you to discover.</h3><p>Sign in to browse the current pieces, see real availability, and add your favourites to the cart.</p></div><Link className="home-button home-button-primary" to="/login">Enter the shop <ArrowIcon /></Link></div>}{isAuthenticated && !loading && featuredProducts.length === 0 && <div className="home-catalogue-gate"><div><p className="home-eyebrow">The shelves are being refreshed</p><h3>Your live collection will appear here.</h3><p>Visit the shop to browse the catalogue and see the latest pieces.</p></div><Link className="home-button home-button-primary" to="/shop">Open the shop <ArrowIcon /></Link></div>}{notice && <p className="home-cart-notice" role="status">{notice} <Link to="/cart">View cart</Link></p>}</div></section>
      <section className="home-story-section" id="story"><div className="content-width home-story-grid"><div className="home-story-art"><img src="/assets/knots-of-joy-tulip-bouquet.jpg" alt="A bouquet of pink crochet tulips" /><span>Made for<br /><em>the everyday.</em></span></div><div className="home-story-copy"><p className="home-eyebrow">The Knot &amp; Bloom way</p><h2>Little things,<br /><em>made lovely.</em></h2><p>We believe the smallest objects can carry the biggest feeling. Each piece is crocheted with patience, personality, and a little room for imperfection—the kind that makes something feel truly yours.</p><Link className="home-text-link" to="/shop">Meet the collection <ArrowIcon /></Link></div></div></section>
      <section className="home-newsletter-section" id="contact"><div className="content-width home-newsletter"><div><p className="home-eyebrow">Stay close</p><h2>A little joy,<br /><em>now and then.</em></h2></div><div><p>Come back when you need a thoughtful gift, a tiny keepsake, or simply something made by hand.</p><Link className="home-button home-button-light" to={isAuthenticated ? '/shop' : '/register'}>{isAuthenticated ? 'Browse the collection' : 'Join the circle'} <ArrowIcon /></Link></div></div></section>
    </main>
    <footer className="home-footer"><div className="content-width"><div className="home-footer-main"><div className="home-footer-brand"><span className="home-footer-logo-wrap"><img className="home-footer-logo" src="/assets/knot-and-bloom-logo.png" alt="Knot &amp; Bloom logo" /></span></div><p>Handmade with Love, Made to Bloom.</p><div className="home-footer-links"><Link to="/shop">Shop</Link><Link to="/register">Join us</Link><a href="#contact">Contact</a></div></div><div className="home-footer-bottom"><span>© 2026 Knot &amp; Bloom</span><span>Made with patience / good yarn</span></div></div></footer>
  </div>
}

export default LandingPage
