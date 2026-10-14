import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'

function UserNavbar({ theme, onToggleTheme, cartCount = 0 }) {
  const navigate = useNavigate()
  const [menuOpen, setMenuOpen] = useState(false)
  const logout = () => { localStorage.removeItem('token'); navigate('/login', { replace: true }) }
  const closeMenu = () => setMenuOpen(false)

  return (
    <header className="site-header">
      <div className="content-width nav-inner">
        <Link className="brand-mark" to="/user-home" aria-label="LoopLuxe home"><img src="/assets/loopluxe_logo.png" alt="LoopLuxe Handcrafted Crochet" /></Link>
        <nav className="nav-links" aria-label="Workspace navigation"><Link to="/shop">Shop</Link><Link to="/admin/categories">Categories</Link><Link to="/cart">Cart {cartCount > 0 && <span className="nav-cart-count">{cartCount}</span>}</Link></nav>
        <div className="user-actions"><button className="theme-toggle" type="button" onClick={onToggleTheme} aria-label="Toggle theme">{theme === 'light' ? '☾' : '☀'}</button><Link to="/admin/categories">Admin</Link><Link className="nav-cart-link" to="/cart" aria-label={`Cart with ${cartCount} items`}>Bag <span className="nav-cart-count">{cartCount}</span></Link><button className="icon-button" type="button" onClick={logout} aria-label="Log out">↪</button><button className="menu-button" type="button" onClick={() => setMenuOpen((open) => !open)} aria-label="Toggle navigation menu">☰</button></div>
      </div>
      <nav className={`content-width mobile-nav ${menuOpen ? 'open' : ''}`} aria-label="Mobile workspace navigation"><Link to="/shop" onClick={closeMenu}>Shop</Link><Link to="/admin/categories" onClick={closeMenu}>Categories</Link><Link to="/cart" onClick={closeMenu}>Cart ({cartCount})</Link><button className="button-secondary" type="button" onClick={logout}>Log out</button></nav>
    </header>
  )
}

export default UserNavbar
