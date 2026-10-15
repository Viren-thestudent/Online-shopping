import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import UserNavbar from '../../Components/User/UserNavbar'
import { fetchMyOrders } from '../../api/ordersApi'
import { cartItemCount, formatPrice, getCart } from '../../data/catalogue'

function OrderHistoryPage({ theme, onToggleTheme }) {
  const navigate = useNavigate()
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let active = true
    fetchMyOrders()
      .then((nextOrders) => { if (active) setOrders(nextOrders) })
      .catch((requestError) => {
        if (!active) return
        if (requestError.status === 401) navigate('/login', { replace: true, state: { sessionExpired: true } })
        else setError(requestError.message)
      })
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [navigate])

  return <div className="page-shell user-page"><UserNavbar theme={theme} onToggleTheme={onToggleTheme} cartCount={cartItemCount(getCart())} /><main className="content-width orders-page"><div className="orders-heading"><div><p className="eyebrow">Your Knot & Bloom orders</p><h1>Keep track of the <em>good things.</em></h1><p>Every order uses FamPay UPI and stays pending until payment review.</p></div><Link className="button-secondary" to="/shop">Shop the collection</Link></div>{error && <div className="form-message error" role="alert">{error}</div>}{loading ? <div className="glass-card empty-catalogue"><h3>Loading order history...</h3></div> : orders.length ? <div className="orders-list">{orders.map((order) => <Link className="glass-card order-history-card" to={`/orders/${order.id}/confirmation`} key={order.id}><div><p className="eyebrow">Order #{order.id}</p><h2>{new Date(order.created_at).toLocaleDateString('en-IN', { dateStyle: 'medium' })}</h2><span>{order.items.length} {order.items.length === 1 ? 'item' : 'items'} · Payment: {order.payment_status || 'pending'}</span></div><div className="order-history-meta"><span className="order-status">{order.status}</span><strong>{formatPrice(order.total)}</strong><span>View details →</span></div></Link>)}</div> : <div className="glass-card empty-catalogue"><span className="empty-mark">♡</span><h2>No orders yet.</h2><p>Your first handmade find is waiting in the collection.</p><Link className="button-primary" to="/shop">Explore the edit</Link></div>}</main></div>
}

export default OrderHistoryPage
