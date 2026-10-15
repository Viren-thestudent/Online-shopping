import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import UserNavbar from '../../Components/User/UserNavbar'
import { fetchAdminOrders, updateOrderPayment, updateOrderStatus } from '../../api/ordersApi'
import { formatPrice } from '../../data/catalogue'

const statuses = ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled']
const paymentStatuses = ['pending', 'verified', 'rejected']

function AdminOrdersPage({ theme, onToggleTheme }) {
  const navigate = useNavigate()
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [savingId, setSavingId] = useState(null)
  const [savingPaymentId, setSavingPaymentId] = useState(null)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')

  useEffect(() => {
    let active = true
    fetchAdminOrders()
      .then((nextOrders) => { if (active) setOrders(nextOrders) })
      .catch((requestError) => {
        if (!active) return
        if (requestError.status === 401) navigate('/login', { replace: true, state: { sessionExpired: true } })
        else setError(requestError.message)
      })
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [navigate])

  const changeStatus = async (orderId, status) => {
    setSavingId(orderId); setError(''); setNotice('')
    try {
      const saved = await updateOrderStatus(orderId, status)
      setOrders((current) => current.map((order) => order.id === orderId ? saved : order))
      setNotice(`Order #${orderId} updated.`)
    } catch (requestError) {
      if (requestError.status === 401) navigate('/login', { replace: true, state: { sessionExpired: true } })
      else setError(requestError.message)
    } finally {
      setSavingId(null)
    }
  }

  const changePaymentStatus = async (orderId, payment_status) => {
    setSavingPaymentId(orderId); setError(''); setNotice('')
    try {
      const saved = await updateOrderPayment(orderId, payment_status)
      setOrders((current) => current.map((order) => order.id === orderId ? saved : order))
      setNotice(`Payment for order #${orderId} updated.`)
    } catch (requestError) {
      if (requestError.status === 401) navigate('/login', { replace: true, state: { sessionExpired: true } })
      else setError(requestError.message)
    } finally {
      setSavingPaymentId(null)
    }
  }

  return <div className="page-shell user-page"><UserNavbar theme={theme} onToggleTheme={onToggleTheme} cartCount={0} /><main className="content-width admin-page"><div className="admin-heading"><div><p className="eyebrow">Knot & Bloom / admin studio</p><h1>Care for every <em>order.</em></h1><p>Review customer orders and update their fulfilment status. Payments are reviewed manually before fulfilment.</p></div><div className="admin-heading-actions"><Link className="button-secondary" to="/admin/products">Manage products</Link><Link className="button-secondary" to="/admin/categories">Categories</Link></div></div>{(error || notice) && <p className={error ? 'admin-notice error-text' : 'admin-notice'} role="status">{error || notice}</p>}{loading ? <div className="glass-card empty-catalogue"><h3>Loading orders...</h3></div> : orders.length ? <div className="admin-order-list">{orders.map((order) => <article className="glass-card admin-order-card" key={order.id}><div className="admin-order-heading"><div><p className="eyebrow">Order #{order.id}</p><h2>{order.customer_name}</h2><span>{order.customer_email} · {order.phone}</span></div><strong>{formatPrice(order.total)}</strong></div><div className="admin-order-address"><small>Delivery address</small><p>{order.delivery_address}</p></div><div className="admin-order-items">{order.items.map((item) => <span key={`${order.id}-${item.product_id || item.product_name}`}>{item.product_name} × {item.quantity}</span>)}</div><div className="admin-payment-review"><div><small>Payment status</small><span className="order-status">{order.payment_status || 'pending'}</span></div><div><small>UTR / reference</small><strong>{order.payment_reference || 'Not submitted'}</strong></div><label className="order-status-control"><span className="sr-only">Payment status for order {order.id}</span><select className="form-control" value={order.payment_status || 'pending'} onChange={(event) => changePaymentStatus(order.id, event.target.value)} disabled={savingPaymentId === order.id}>{paymentStatuses.map((paymentStatus) => <option value={paymentStatus} key={paymentStatus}>{paymentStatus[0].toUpperCase() + paymentStatus.slice(1)}</option>)}</select></label></div><div className="admin-order-footer"><small>{new Date(order.created_at).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })} · UPI / FamPay</small><label className="order-status-control"><span className="sr-only">Status for order {order.id}</span><select className="form-control" value={order.status} onChange={(event) => changeStatus(order.id, event.target.value)} disabled={savingId === order.id}>{statuses.map((status) => <option value={status} key={status}>{status[0].toUpperCase() + status.slice(1)}</option>)}</select></label></div></article>)}</div> : <div className="glass-card empty-catalogue"><h2>No orders yet.</h2><p>New customer orders will appear here.</p></div>}</main></div>
}

export default AdminOrdersPage
