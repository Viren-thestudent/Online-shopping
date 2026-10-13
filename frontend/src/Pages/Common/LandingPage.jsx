import { useState } from 'react'
import { Link } from 'react-router-dom'

function MarkIcon({ type = 'spark' }) {
  if (type === 'grid') return <svg aria-hidden="true" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" /><rect x="3" y="14" width="7" height="7" rx="1" /><rect x="14" y="14" width="7" height="7" rx="1" /></svg>
  if (type === 'thread') return <svg aria-hidden="true" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M4 8c3.5-5 12.5-5 16 0s-5.5 11-10 7 2-11 6-7 1.5 7-2 9" /></svg>
  return <svg aria-hidden="true" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="m12 3 1.7 6.3L20 11l-6.3 1.7L12 19l-1.7-6.3L4 11l6.3-1.7L12 3Z" /><path d="m19 17 .6 2.4L22 20l-2.4.6L19 23l-.6-2.4L16 20l2.4-.6L19 17Z" /></svg>
}

function LandingNavbar({ theme, onToggleTheme }) {
  const [menuOpen, setMenuOpen] = useState(false)
  const closeMenu = () => setMenuOpen(false)

  return (
    <header className="site-header">
      <div className="content-width nav-inner">
        <a className="brand-mark" href="#home" aria-label="LoopLuxe home"><img src="/assets/loopluxe_logo.png" alt="LoopLuxe Handcrafted Crochet" /></a>
        <nav className="nav-links" aria-label="Main navigation"><a href="#home">Home</a><a href="#workspace">Workspace</a><a href="#studio">Studio</a><a href="#contact">Contact</a></nav>
        <div className="nav-actions"><button className="theme-toggle" type="button" onClick={onToggleTheme} aria-label="Toggle theme">{theme === 'light' ? '☾' : '☀'}</button><Link to="/login">Log in</Link><Link className="button-primary" to="/register">Join the studio</Link><button className="menu-button" type="button" onClick={() => setMenuOpen((open) => !open)} aria-label="Toggle navigation menu">☰</button></div>
      </div>
      <nav className={`content-width mobile-nav ${menuOpen ? 'open' : ''}`} aria-label="Mobile navigation"><a href="#home" onClick={closeMenu}>Home</a><a href="#workspace" onClick={closeMenu}>Workspace</a><a href="#studio" onClick={closeMenu}>Studio</a><a href="#contact" onClick={closeMenu}>Contact</a><Link className="button-secondary" to="/login" onClick={closeMenu}>Log in</Link></nav>
    </header>
  )
}

function LandingPage({ theme, onToggleTheme }) {
  return (
    <div className="page-shell" id="home">
      <LandingNavbar theme={theme} onToggleTheme={onToggleTheme} />
      <main>
        <section className="hero"><div className="content-width hero-grid"><div className="hero-copy"><p className="eyebrow">LoopLuxe studio / 01</p><h1>Made slowly.<br /><em>Designed forward.</em></h1><p>A calm digital home for a modern crochet brand. Shape your catalogue, keep your saved spaces close, and let every detail feel considered.</p><div className="hero-actions"><Link className="button-primary" to="/register">Enter the studio <span aria-hidden="true">↗</span></Link><a className="button-secondary" href="#workspace">See the system</a></div><div className="hero-note"><span /> Handcrafted identity / digital precision</div></div><div className="hero-visual" aria-label="Abstract LoopLuxe studio visual"><div className="orbit-stage"><div className="orbit-core" /><span className="orbit-label top">soft signal / 01</span><span className="orbit-label bottom">threaded by hand</span></div><div className="hero-card"><small>Interface note</small><strong>Warmth, with <em>edge.</em></strong><small>Teal light / rose detail / quiet motion</small></div></div></div></section>
        <section className="section" id="workspace"><div className="content-width"><div className="section-header"><div><p className="eyebrow">The foundation</p><h2 className="section-title">A softer way to run your <em>space.</em></h2></div><span className="section-link">System overview</span></div><div className="signal-grid"><article className="glass-card signal-card"><div className="card-icon"><MarkIcon type="thread" /></div><h3>Threaded navigation</h3><p>Clear routes for your studio, account, and future catalogue without the clutter.</p></article><article className="glass-card signal-card"><div className="card-icon"><MarkIcon type="spark" /></div><h3>Ambient by design</h3><p>Soft light, subtle motion, and tactile surfaces that stay focused on the work.</p></article><article className="glass-card signal-card"><div className="card-icon"><MarkIcon type="grid" /></div><h3>Ready to grow</h3><p>A flexible visual system that can hold real inventory when your backend is ready.</p></article></div></div></section>
        <section className="section workflow-section" id="studio"><div className="content-width"><div className="section-header"><div><p className="eyebrow">Catalogue status</p><h2 className="section-title">The shelves are ready when <em>you are.</em></h2></div></div><div className="empty-panel glass-card"><div className="empty-content"><div className="empty-mark"><MarkIcon type="thread" /></div><h3>No live catalogue yet</h3><p>Your collection space is intentionally clear. Connect real catalogue data when you are ready to bring products into the experience.</p><Link className="button-secondary" to="/login">Open my workspace ↗</Link></div></div></div></section>
        <section className="section" id="contact"><div className="content-width"><div className="cta-panel"><p className="eyebrow">The LoopLuxe point of view</p><h2 className="section-title">A premium canvas for handmade <em>things.</em></h2><p>Keep the interface warm, modern, and unmistakably yours while your real catalogue and account data do the talking.</p><Link className="button-primary" to="/register">Create your space ↗</Link></div></div></section>
      </main>
      <footer className="site-footer"><div className="content-width"><div className="footer-main"><a className="brand-mark" href="#home"><img src="/assets/loopluxe_logo.png" alt="LoopLuxe" /></a><p className="footer-tagline">A digital studio for crochet, craft, and the quiet details that make a brand feel like itself.</p></div><div className="footer-bottom"><span>© 2026 LoopLuxe Studio</span><span>Made with patience / good yarn</span></div></div></footer>
    </div>
  )
}

export default LandingPage
