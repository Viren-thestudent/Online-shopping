import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'

function UserNavbar({ theme, onToggleTheme }) {
  const navigate = useNavigate()
  const [menuOpen, setMenuOpen] = useState(false)
  const logout = () => { localStorage.removeItem('token'); navigate('/login', { replace: true }) }
  const closeMenu = () => setMenuOpen(false)

  return (
    <header className="site-header">
      <div className="content-width nav-inner"><Link className="brand-mark" to="/user-home" aria-label="LoopLuxe home"><img src="/assets/loopluxe_logo.png" alt="LoopLuxe Handcrafted Crochet" /></Link><nav className="nav-links" aria-label="Workspace navigation"><a href="#top">Overview</a><a href="#dashboard">Dashboard</a><a href="#dashboard">Saved spaces</a><a href="#dashboard">Account</a></nav><div className="user-actions"><button className="theme-toggle" type="button" onClick={onToggleTheme} aria-label="Toggle theme">{theme === 'light' ? '☾' : '☀'}</button><a href="#dashboard">Workspace</a><button className="icon-button" type="button" onClick={logout} aria-label="Log out">↪</button><button className="menu-button" type="button" onClick={() => setMenuOpen((open) => !open)} aria-label="Toggle navigation menu">☰</button></div></div>
      <nav className={`content-width mobile-nav ${menuOpen ? 'open' : ''}`} aria-label="Mobile workspace navigation"><a href="#top" onClick={closeMenu}>Overview</a><a href="#dashboard" onClick={closeMenu}>Dashboard</a><a href="#dashboard" onClick={closeMenu}>Saved spaces</a><button className="button-secondary" type="button" onClick={logout}>Log out</button></nav>
    </header>
  )
}

export default UserNavbar
