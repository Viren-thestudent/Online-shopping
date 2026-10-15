import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import UserNavbar from '../../Components/User/UserNavbar'
import { fetchOrder } from '../../api/ordersApi'
import { cartItemCount, formatPrice, getCart } from '../../data/catalogue'

function OrderConfirmationPage({ theme, onToggleTheme }) {
  const { orderId } = useParams()
  const navigate = useNavigate()
  const [order, setOrder] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let active = true
    fetchOrder(orderId)
      .then((nextOrder) => { if (active) setOrder(nextOrder) })
      .catch((requestError) => {
        if (!active) return
        if (requestError.status === 401) navigate('/login', { replace: true, state: { sessionExpired: true } })
        else setError(requestError.message)
      })
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [navigate, orderId])

  return <div className="page-shell user-page"><UserNavbar theme={theme} onToggleTheme={onToggleTheme} cartCount={cartItemCount(getCart())} /><main className="content-width order-detail-page">{loading ? <div className="glass-card empty-catalogue"><h3>Loading order confirmation...</h3></div> : error ? <div className="form-message error" role="alert">{error}</div> : order && <><div className="confirmation-hero"><span className="confirmation-mark">✓</span><p className="eyebrow">Order received</p><h1>Thank you for choosing <em>handmade.</em></h1><p>Your order <strong>#{order.id}</strong> is saved. Payment is <strong>{order.payment_status || 'pending'}</strong> until an authorized admin reviews the submitted reference.</p><div className="confirmation-actions"><Link className="button-primary" to="/orders">View order history</Link><Link className="button-secondary" to="/shop">Continue shopping</Link></div></div><section className="glass-card order-card order-confirmation-card"><div className="order-card-heading"><div><p className="eyebrow">UPI payment · manual review</p><h2>Order #{order.id}</h2></div><div className="order-status-stack"><span className="order-status">{order.status}</span><span className="order-status payment-status">{order.payment_status || 'pending'}</span></div></div><div className="order-contact"><div><small>Deliver to</small><strong>{order.customer_name}</strong><span>{order.phone}</span><span>{order.delivery_address}</span></div><div><small>Total</small><strong className="order-total">{formatPrice(order.total)}</strong><span>{order.items.length} {order.items.length === 1 ? 'line item' : 'line items'}</span></div></div><div className="order-items">{order.items.map((item) => <div className="order-line" key={`${order.id}-${item.product_id || item.product_name}`}><div>{item.image_url ? <img src={item.image_url} alt="" /> : <span className="image-placeholder">No image</span>}</div><div><strong>{item.product_name}</strong><small>{item.quantity} × {formatPrice(item.unit_price)}</small></div><b>{formatPrice(item.line_total)}</b></div>)}</div></section></>}</main></div>
}

export default OrderConfirmationPage
