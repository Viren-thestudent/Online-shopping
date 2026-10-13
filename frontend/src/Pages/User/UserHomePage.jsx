import UserNavbar from '../../Components/User/UserNavbar'

function WorkspaceIcon({ type }) {
  const common = { 'aria-hidden': true, viewBox: '0 0 24 24', width: 17, height: 17, fill: 'none', stroke: 'currentColor', strokeWidth: 1.5 }
  if (type === 'heart') return <svg {...common}><path d="M20.8 8.8c0 5.4-8.8 10.1-8.8 10.1S3.2 14.2 3.2 8.8A4.3 4.3 0 0 1 12 6.7a4.3 4.3 0 0 1 8.8 2.1Z" /></svg>
  if (type === 'box') return <svg {...common}><path d="m4 7 8-4 8 4v10l-8 4-8-4V7Z" /><path d="m4 7 8 4 8-4M12 11v10" /></svg>
  return <svg {...common}><path d="M5 4h14v16H5z" /><path d="M8 8h8M8 12h8M8 16h5" /></svg>
}

function UserHomePage({ theme, onToggleTheme }) {
  return (
    <div className="page-shell user-page" id="top">
      <UserNavbar theme={theme} onToggleTheme={onToggleTheme} cartCount={0} />
      <main>
        <section className="user-hero"><div className="content-width user-hero-grid"><div><p className="eyebrow">Private studio / overview</p><h1>Good to see you, <em>maker.</em></h1><p>Your LoopLuxe workspace is ready. Keep an eye on your saved spaces and return to the catalogue whenever the next chapter is ready.</p><a className="button-primary" href="#dashboard">View overview ↘</a></div><div className="workspace-visual" aria-label="Abstract workspace preview"><div className="workspace-window"><div className="window-bar"><i /><i /><i /></div><div className="window-lines"><div className="window-line tiny" /><div className="window-line" /><div className="window-line short" /><div className="window-line" /><div className="window-line tiny" /></div></div><div className="floating-token a"><WorkspaceIcon type="box" /></div><div className="floating-token b"><WorkspaceIcon type="heart" /></div></div></div></section>
        <section className="section dashboard-section" id="dashboard"><div className="content-width"><div className="section-header"><div><p className="eyebrow">Your dashboard</p><h2 className="section-title">A clear place for the <em>next thing.</em></h2></div><span className="status-pill">Workspace active</span></div><div className="stat-grid"><article className="glass-card stat-card"><div className="card-icon"><WorkspaceIcon type="heart" /></div><strong>0</strong><span>Saved spaces</span></article><article className="glass-card stat-card"><div className="card-icon"><WorkspaceIcon type="box" /></div><strong>0</strong><span>Open orders</span></article><article className="glass-card stat-card"><div className="card-icon"><WorkspaceIcon type="note" /></div><strong>0</strong><span>Studio notes</span></article></div><div className="dashboard-grid"><article className="glass-card dashboard-card"><h2>Saved collection</h2><p>Your personal edit will live here when real catalogue data is connected.</p><div className="collection-empty"><p>This space is intentionally empty for now.<br />No placeholder products, prices, or inventory.</p></div></article><article className="glass-card dashboard-card"><h2>Account pulse</h2><p>A small overview of the details that keep your studio moving.</p><div className="account-list"><div className="account-row"><span>Workspace</span><strong>LoopLuxe / member</strong></div><div className="account-row"><span>Catalogue</span><strong>Awaiting live data</strong></div><div className="account-row"><span>Access</span><strong>Authenticated</strong></div></div></article></div></div></section>
        <section className="section workflow-section"><div className="content-width"><div className="workflow-grid"><article className="glass-card workflow-card"><p className="eyebrow">Ready for the real thing</p><h3>Build from signal, not noise.</h3><p>This interface keeps the focus on your brand system while the backend remains the source of truth for future catalogue and account data.</p><ul className="workflow-list"><li>Neutral empty states preserve trust</li><li>Real API data can slot into these surfaces</li><li>Responsive layout works across the studio</li></ul></article><article className="glass-card workflow-card status-card"><span className="status-pill">System healthy</span><div><strong>Next: connect your catalogue</strong><br /><span>Nothing is invented here.</span></div></article></div></div></section>
      </main>
      <footer className="site-footer"><div className="content-width"><div className="footer-main"><a className="brand-mark" href="#top"><img src="/assets/loopluxe_logo.png" alt="LoopLuxe" /></a><p className="footer-tagline">A calm workspace for the details, the making, and everything still to come.</p></div><div className="footer-bottom"><span>© 2026 LoopLuxe Studio</span><span>Workspace / 01</span></div></div></footer>
    </div>
  )
}

export default UserHomePage
