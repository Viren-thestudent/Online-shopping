import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import UserNavbar from '../../Components/User/UserNavbar'
import { fetchAdminDashboard } from '../../api/ordersApi'
import { formatPrice } from '../../data/catalogue'

const emptyStats = {
  total_products: 0,
  total_orders: 0,
  total_customers: 0,
  delivered_revenue: '0.00',
}

const formatOrderDate = (value) => new Date(value).toLocaleDateString('en-IN', {
  day: 'numeric',
  month: 'short',
  year: 'numeric',
})

function AdminDashboardPage({ theme, onToggleTheme }) {
  const navigate = useNavigate()
  const [dashboard, setDashboard] = useState({ stats: emptyStats, recent_orders: [] })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let active = true
    fetchAdminDashboard()
      .then((data) => { if (active) setDashboard(data) })
      .catch((requestError) => {
        if (!active) return
        if (requestError.status === 401) navigate('/login', { replace: true, state: { sessionExpired: true } })
        else setError(requestError.message)
      })
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [navigate])

  const stats = dashboard.stats || emptyStats
  const recentOrders = dashboard.recent_orders || []

  return <div className="page-shell user-page"><UserNavbar theme={theme} onToggleTheme={onToggleTheme} cartCount={0} /><main className="content-width admin-page dashboard-page"><div className="admin-heading"><div><p className="eyebrow">Knot & Bloom / admin studio</p><h1>See the <em>whole picture.</em></h1><p>Track catalogue activity, customers, and completed revenue from one place.</p></div><div className="admin-heading-actions"><Link className="button-secondary" to="/admin/insights">Sales insights</Link><Link className="button-secondary" to="/admin/orders">View all orders</Link></div></div>{error && <div className="form-message error" role="alert">{error}</div>}{loading ? <div className="glass-card empty-catalogue"><h3>Loading dashboard...</h3></div> : <><section className="dashboard-stat-grid" aria-label="Dashboard summary"><article className="glass-card dashboard-stat-card"><span className="dashboard-stat-label">Products</span><strong>{stats.total_products}</strong><small>Catalogue items</small></article><article className="glass-card dashboard-stat-card"><span className="dashboard-stat-label">Orders</span><strong>{stats.total_orders}</strong><small>All customer orders</small></article><article className="glass-card dashboard-stat-card"><span className="dashboard-stat-label">Customers</span><strong>{stats.total_customers}</strong><small>Registered shoppers</small></article><article className="glass-card dashboard-stat-card dashboard-revenue-card"><span className="dashboard-stat-label">Delivered revenue</span><strong>{formatPrice(stats.delivered_revenue)}</strong><small>Delivered orders only</small></article></section><section className="dashboard-content-grid"><div className="glass-card dashboard-orders-card"><div className="dashboard-section-heading"><div><p className="eyebrow">Latest activity</p><h2>Recent orders</h2></div><Link className="text-button" to="/admin/orders">Manage orders</Link></div>{recentOrders.length ? <div className="dashboard-order-table-wrap"><table className="dashboard-order-table"><thead><tr><th>Order</th><th>Customer</th><th>Date</th><th>Total</th><th>Status</th></tr></thead><tbody>{recentOrders.map((order) => <tr key={order.id}><td><strong>#{order.id}</strong></td><td><strong>{order.customer_name}</strong><small>{order.customer_email}</small></td><td>{formatOrderDate(order.created_at)}</td><td><strong>{formatPrice(order.total)}</strong></td><td><span className="order-status">{order.status}</span></td></tr>)}</tbody></table></div> : <div className="dashboard-empty"><span className="empty-mark">♡</span><h3>No orders yet.</h3><p>New customer orders will appear here once checkout is used.</p></div>}</div><aside className="glass-card dashboard-actions-card"><p className="eyebrow">Quick actions</p><h2>Keep the studio moving.</h2><div className="dashboard-actions"><Link className="dashboard-action-link" to="/admin/products"><span>Products</span><small>Add, edit, and update stock</small><b>→</b></Link><Link className="dashboard-action-link" to="/admin/categories"><span>Categories</span><small>Organise the collection</small><b>→</b></Link><Link className="dashboard-action-link" to="/admin/orders"><span>Orders</span><small>Review and update fulfilment</small><b>→</b></Link></div></aside></section></>}</main></div>
}

export default AdminDashboardPage
