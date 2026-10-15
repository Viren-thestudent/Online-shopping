import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import UserNavbar from '../../Components/User/UserNavbar'
import { fetchAdminInsights } from '../../api/ordersApi'
import { formatPrice } from '../../data/catalogue'

const emptyInsights = {
  summary: { delivered_revenue: '0.00', completed_orders: 0, completed_units: 0 },
  best_selling_products: [],
  sales_trend: [],
  forecast: { available: false, message: '', predictions: [] },
}

const formatPeriod = (value) => new Date(`${value}T00:00:00`).toLocaleDateString('en-IN', {
  day: 'numeric',
  month: 'short',
})

function AdminInsightsPage({ theme, onToggleTheme }) {
  const navigate = useNavigate()
  const [insights, setInsights] = useState(emptyInsights)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let active = true
    fetchAdminInsights()
      .then((data) => { if (active) setInsights({ ...emptyInsights, ...data }) })
      .catch((requestError) => {
        if (!active) return
        if (requestError.status === 401) navigate('/login', { replace: true, state: { sessionExpired: true } })
        else setError(requestError.message)
      })
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [navigate])

  const summary = insights.summary || emptyInsights.summary
  const trend = insights.sales_trend || emptyInsights.sales_trend
  const bestSellers = insights.best_selling_products || []
  const forecast = insights.forecast || emptyInsights.forecast
  const maxRevenue = useMemo(
    () => Math.max(...trend.map((period) => Number(period.revenue)), 1),
    [trend],
  )

  return <div className="page-shell user-page"><UserNavbar theme={theme} onToggleTheme={onToggleTheme} cartCount={0} /><main className="content-width admin-page insights-page"><div className="admin-heading"><div><p className="eyebrow">Knot & Bloom / admin studio</p><h1>Sales <em>insights.</em></h1><p>Explore completed order history and a small, transparent weekly revenue forecast.</p></div><div className="admin-heading-actions"><Link className="button-secondary" to="/admin/dashboard">Back to dashboard</Link><Link className="button-secondary" to="/admin/orders">View orders</Link></div></div>{error && <div className="form-message error" role="alert">{error}</div>}{loading ? <div className="glass-card empty-catalogue"><h3>Loading sales insights...</h3></div> : <><section className="insights-summary-grid" aria-label="Sales insight summary"><article className="glass-card insight-stat-card"><span className="dashboard-stat-label">Delivered revenue</span><strong>{formatPrice(summary.delivered_revenue)}</strong><small>Delivered orders only</small></article><article className="glass-card insight-stat-card"><span className="dashboard-stat-label">Completed orders</span><strong>{summary.completed_orders}</strong><small>Confirmed through delivered</small></article><article className="glass-card insight-stat-card"><span className="dashboard-stat-label">Units sold</span><strong>{summary.completed_units}</strong><small>Completed order items</small></article></section><section className="insights-grid"><article className="glass-card insights-panel"><div className="dashboard-section-heading"><div><p className="eyebrow">Product performance</p><h2>Best sellers</h2></div></div>{bestSellers.length ? <div className="insights-list">{bestSellers.map((product) => <div className="insight-product-row" key={`${product.product_id || 'snapshot'}-${product.product_name}`}><div><strong>{product.product_name}</strong><small>{product.quantity_sold} unit{product.quantity_sold === 1 ? '' : 's'} sold · {formatPrice(product.revenue)}</small></div>{product.product_id ? <Link className="text-button" to={`/products/${product.product_id}`}>View product</Link> : <span className="insight-muted">Archived item</span>}</div>)}</div> : <p className="insight-note">No completed sales data yet.</p>}</article><article className="glass-card insights-panel"><div className="dashboard-section-heading"><div><p className="eyebrow">Completed-sales history</p><h2>Weekly trend</h2></div></div>{trend.length ? <div className="trend-chart" aria-label="Weekly completed-sales revenue trend">{trend.map((period) => <div className="trend-column" key={period.period}><div className="trend-value">{formatPrice(period.revenue)}</div><div className="trend-bar-track"><div className="trend-bar" style={{ height: `${Math.max(8, (Number(period.revenue) / maxRevenue) * 100)}%` }} title={`${formatPrice(period.revenue)} on week of ${formatPeriod(period.period)}`} /></div><strong>{formatPeriod(period.period)}</strong><small>{period.quantity_sold} units</small></div>)}</div> : <p className="insight-note">No completed sales history is available for a trend yet.</p>}</article></section><section className="glass-card insights-panel forecast-panel"><div className="dashboard-section-heading"><div><p className="eyebrow">Transparent model</p><h2>Revenue forecast</h2></div>{forecast.model && <span className="insight-model">{forecast.model}</span>}</div>{forecast.available ? <><p className="insight-note">{forecast.message}</p><div className="forecast-list">{forecast.predictions.map((prediction) => <div className="forecast-row" key={prediction.period}><span>Week of {formatPeriod(prediction.period)}</span><strong>{formatPrice(prediction.predicted_revenue)}</strong></div>)}</div></> : <p className="insight-note">{forecast.message || 'More historical completed sales are needed before a forecast can be shown.'}</p>}</section></>}</main></div>
}

export default AdminInsightsPage
