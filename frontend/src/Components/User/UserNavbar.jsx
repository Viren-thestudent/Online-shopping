import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { fetchProfile } from '../../api/catalogueApi'
import { PRODUCT_CATEGORIES } from '../../data/catalogue'

function ProductsMenu({ mobile = false, onNavigate }) {
  const [open, setOpen] = useState(false)

  return (
    <div className={`products-nav-menu ${mobile ? 'mobile-products-menu' : ''}`}>
      <button className="products-nav-trigger" type="button" aria-expanded={open} onClick={() => setOpen((current) => !current)}>
        Products <span aria-hidden="true">{open ? '−' : '+'}</span>
      </button>
      {open && <div className="products-nav-dropdown" role="menu">
        {PRODUCT_CATEGORIES.map((category) => (
          <Link key={category} role="menuitem" to={`/shop?category=${encodeURIComponent(category)}`} onClick={onNavigate}>{category}</Link>
        ))}
      </div>}
    </div>
  )
}

function UserNavbar({ theme, onToggleTheme, cartCount = 0 }) {
  const navigate = useNavigate()
  const [menuOpen, setMenuOpen] = useState(false)
  const [isAdmin, setIsAdmin] = useState(false)

  useEffect(() => {
    let active = true
    fetchProfile()
      .then((user) => { if (active) setIsAdmin(Boolean(user?.can_access_admin || user?.can_request_admin_verification)) })
      .catch(() => { if (active) setIsAdmin(false) })
    return () => { active = false }
  }, [])

  const logout = () => { localStorage.removeItem('token'); navigate('/login', { replace: true }) }
  const closeMenu = () => setMenuOpen(false)

  return (
    <header className="site-header customer-header">
      <div className="content-width nav-inner customer-nav-inner">
        <Link className="customer-brand" to="/user-home" aria-label="Knot & Bloom home"><span className="customer-brand-logo-wrap"><img className="customer-brand-logo" src="/assets/knot-and-bloom-logo.png" alt="Knot & Bloom logo" /></span></Link>
        <nav className="nav-links" aria-label="Workspace navigation"><Link to="/shop">Shop</Link><ProductsMenu /><Link to="/orders">My Orders</Link><Link to="/cart">Cart {cartCount > 0 && <span className="nav-cart-count">{cartCount}</span>}</Link></nav>
        <div className="user-actions"><button className="theme-toggle" type="button" onClick={onToggleTheme} aria-label="Toggle theme">{theme === 'light' ? '☾' : '☀'}</button>{isAdmin && <><Link to="/admin/dashboard">Dashboard</Link><Link to="/admin/insights">Insights</Link></>}<Link className="nav-cart-link" to="/cart" aria-label={'Cart with ' + cartCount + ' items'}>Bag <span className="nav-cart-count">{cartCount}</span></Link><button className="icon-button" type="button" onClick={logout} aria-label="Log out">↪</button><button className="menu-button" type="button" onClick={() => setMenuOpen((open) => !open)} aria-label="Toggle navigation menu">☰</button></div>
      </div>
      <nav className={'content-width mobile-nav ' + (menuOpen ? 'open' : '')} aria-label="Mobile workspace navigation"><Link to="/shop" onClick={closeMenu}>Shop</Link><ProductsMenu mobile onNavigate={closeMenu} /><Link to="/orders" onClick={closeMenu}>My Orders</Link>{isAdmin && <><Link to="/admin/dashboard" onClick={closeMenu}>Dashboard</Link><Link to="/admin/insights" onClick={closeMenu}>Insights</Link><Link to="/admin/categories" onClick={closeMenu}>Categories</Link><Link to="/admin/orders" onClick={closeMenu}>Admin orders</Link></>}<Link to="/cart" onClick={closeMenu}>Cart ({cartCount})</Link><button className="button-secondary" type="button" onClick={logout}>Log out</button></nav>
    </header>
  )
}

export default UserNavbar
