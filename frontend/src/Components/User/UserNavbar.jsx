import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { fetchProfile } from '../../api/catalogueApi'

function UserNavbar({ theme, onToggleTheme, cartCount = 0 }) {
  const navigate = useNavigate()
  const [menuOpen, setMenuOpen] = useState(false)
  const [isAdmin, setIsAdmin] = useState(false)

  useEffect(() => {
    let active = true
    fetchProfile()
      .then((user) => { if (active) setIsAdmin(Boolean(user?.is_admin)) })
      .catch(() => { if (active) setIsAdmin(false) })
    return () => { active = false }
  }, [])

  const logout = () => { localStorage.removeItem('token'); navigate('/login', { replace: true }) }
  const closeMenu = () => setMenuOpen(false)

  return (
    <header className="site-header customer-header">
      <div className="content-width nav-inner customer-nav-inner">
        <Link className="customer-brand" to="/user-home" aria-label="Knot & Bloom home"><span className="customer-brand-logo-wrap"><img className="customer-brand-logo" src="/assets/knot-and-bloom-logo.png" alt="Knot & Bloom logo" /></span></Link>
        <nav className="nav-links" aria-label="Workspace navigation"><Link to="/shop">Shop</Link><Link to="/orders">Orders</Link><Link to="/admin/categories">Categories</Link><Link to="/cart">Cart {cartCount > 0 && <span className="nav-cart-count">{cartCount}</span>}</Link></nav>
        <div className="user-actions"><button className="theme-toggle" type="button" onClick={onToggleTheme} aria-label="Toggle theme">{theme === 'light' ? '☾' : '☀'}</button>{isAdmin && <><Link to="/admin/dashboard">Dashboard</Link><Link to="/admin/insights">Insights</Link></>}<Link className="nav-cart-link" to="/cart" aria-label={'Cart with ' + cartCount + ' items'}>Bag <span className="nav-cart-count">{cartCount}</span></Link><button className="icon-button" type="button" onClick={logout} aria-label="Log out">↪</button><button className="menu-button" type="button" onClick={() => setMenuOpen((open) => !open)} aria-label="Toggle navigation menu">☰</button></div>
      </div>
      <nav className={'content-width mobile-nav ' + (menuOpen ? 'open' : '')} aria-label="Mobile workspace navigation"><Link to="/shop" onClick={closeMenu}>Shop</Link><Link to="/orders" onClick={closeMenu}>Orders</Link>{isAdmin && <><Link to="/admin/dashboard" onClick={closeMenu}>Dashboard</Link><Link to="/admin/insights" onClick={closeMenu}>Insights</Link></>}<Link to="/admin/categories" onClick={closeMenu}>Categories</Link><Link to="/admin/orders" onClick={closeMenu}>Admin orders</Link><Link to="/cart" onClick={closeMenu}>Cart ({cartCount})</Link><button className="button-secondary" type="button" onClick={logout}>Log out</button></nav>
    </header>
  )
}

export default UserNavbar
