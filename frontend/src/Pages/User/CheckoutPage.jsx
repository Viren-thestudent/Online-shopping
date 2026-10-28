import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import UserNavbar from '../../Components/User/UserNavbar'
import { createOrder } from '../../api/ordersApi'
import { fetchProducts } from '../../api/catalogueApi'
import { cartItemCount, formatPrice, getCart, saveCart } from '../../data/catalogue'

function CheckoutPage({ theme, onToggleTheme }) {
  const navigate = useNavigate()
  const [cart] = useState(() => getCart())
  const [products, setProducts] = useState([])
  const [form, setForm] = useState({ customer_name: '', phone: '', delivery_address: '', payment_method: 'upi', payment_reference: '' })
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    let active = true
    fetchProducts()
      .then((nextProducts) => { if (active) setProducts(nextProducts) })
      .catch((requestError) => {
        if (!active) return
        if (requestError.status === 401) {
          navigate('/login', { replace: true, state: { sessionExpired: true } })
          return
        }
        setError(requestError.message)
      })
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [navigate])

  const items = useMemo(() => products
    .filter((product) => Number.isInteger(Number(cart[product.id])) && Number(cart[product.id]) > 0)
    .map((product) => ({ ...product, quantity: Number(cart[product.id]) })), [cart, products])
  const total = items.reduce((sum, item) => sum + Number(item.price) * item.quantity, 0)

  const updateField = (event) => setForm((current) => ({ ...current, [event.target.name]: event.target.value }))

  const submitOrder = async (event) => {
    event.preventDefault()
    setError('')
    if (!items.length) {
      setError('Your cart is empty. Add a product before checking out.')
      return
    }
    if (form.customer_name.trim().length < 2) {
      setError('Enter the customer name for delivery.')
      return
    }
    if (!/^[0-9+()\-\s]{7,30}$/.test(form.phone.trim())) {
      setError('Enter a valid phone number.')
      return
    }
    if (form.delivery_address.trim().length < 5) {
      setError('Enter a complete delivery address.')
      return
    }
    if (form.payment_method === 'upi' && !/^[A-Za-z0-9][A-Za-z0-9._/\-\s]{5,99}$/.test(form.payment_reference.trim())) {
      setError('Enter a valid UTR or transaction reference after completing the UPI payment.')
      return
    }

    setSubmitting(true)
    try {
      const order = await createOrder({
        customer_name: form.customer_name.trim(),
        phone: form.phone.trim(),
        delivery_address: form.delivery_address.trim(),
        payment_method: form.payment_method,
        payment_reference: form.payment_method === 'upi' ? form.payment_reference.trim() : '',
        items: items.map((item) => ({ product_id: item.id, quantity: item.quantity })),
      })
      saveCart({})
      navigate(`/orders/${order.id}/confirmation`, { replace: true })
    } catch (requestError) {
      if (requestError.status === 401) {
        navigate('/login', { replace: true, state: { sessionExpired: true } })
      } else {
        setError(requestError.message)
      }
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="page-shell user-page">
      <UserNavbar theme={theme} onToggleTheme={onToggleTheme} cartCount={cartItemCount(cart)} />
      <main className="content-width checkout-page">
        <div className="checkout-heading">
          <div>
            <p className="eyebrow">Secure checkout</p>
            <h1>Bring it <em>home.</em></h1>
            <p>Review your pieces, pay by FamPay UPI, and submit the transaction reference for manual review.</p>
          </div>
          <Link className="button-secondary" to="/cart">Back to cart</Link>
        </div>
        {loading ? <div className="glass-card empty-catalogue"><h3>Loading your order summary...</h3></div> : !items.length ? <div className="glass-card empty-catalogue"><h2>Your cart is empty.</h2><p>Add a product before opening checkout.</p><Link className="button-primary" to="/shop">Continue shopping</Link></div> : <div className="checkout-layout">
          <form className="glass-card checkout-form-card" onSubmit={submitOrder}>
            <p className="eyebrow">Delivery details</p>
            <h2>Where should we send it?</h2>
            {error && <div className="form-message error" role="alert">{error}</div>}
            <div className="form-field"><label htmlFor="checkout-name">Customer name</label><input className="form-control" id="checkout-name" name="customer_name" value={form.customer_name} onChange={updateField} autoComplete="name" required /></div>
            <div className="form-field"><label htmlFor="checkout-phone">Phone number</label><input className="form-control" id="checkout-phone" name="phone" value={form.phone} onChange={updateField} autoComplete="tel" inputMode="tel" required /></div>
            <div className="form-field"><label htmlFor="checkout-address">Delivery address</label><textarea className="form-control checkout-address" id="checkout-address" name="delivery_address" value={form.delivery_address} onChange={updateField} autoComplete="street-address" required /></div>
            <div className="payment-method-options"><p className="form-field-label">Payment method</p><label className={`payment-method-option ${form.payment_method === 'cod' ? 'active' : ''}`}><input type="radio" name="payment_method" value="cod" checked={form.payment_method === 'cod'} onChange={updateField} /><span><strong>Cash on Delivery (COD)</strong><small>Pay when your order arrives.</small></span></label><label className={`payment-method-option ${form.payment_method === 'upi' ? 'active' : ''}`}><input type="radio" name="payment_method" value="upi" checked={form.payment_method === 'upi'} onChange={updateField} /><span><strong>Online Payment (UPI / QR Code)</strong><small>Pay now and submit the UTR for admin verification.</small></span></label></div>
            {form.payment_method === 'upi' && <><div className="payment-choice checkout-payment-choice"><div className="payment-qr-wrap"><img className="payment-qr" src="/assets/fampay-qr.jpeg" alt="FamPay QR code for Knot &amp; Bloom payment" /></div><div className="payment-instructions"><strong>Pay securely with FamPay / UPI</strong><p>Scan this QR with any UPI app and pay the exact order amount.</p><span>Payee: Dabhani viren prakashbhai</span><span>UPI ID: 6353834366@fam</span><b>Amount: {formatPrice(total)}</b></div></div><div className="form-field"><label htmlFor="checkout-payment-reference">UTR / transaction reference</label><input className="form-control" id="checkout-payment-reference" name="payment_reference" value={form.payment_reference} onChange={updateField} autoComplete="off" inputMode="text" placeholder="Enter the reference shown by your UPI app" required /><small className="checkout-payment-note">Submitting a reference does not verify payment. An authorized Knot &amp; Bloom admin will review it.</small></div></>}
            {form.payment_method === 'cod' && <p className="cod-payment-note">Your order will be created as Cash on Delivery. Payment remains pending until an authorized admin confirms collection.</p>}
            <button className="button-primary checkout-submit" type="submit" disabled={submitting}>{submitting ? 'Submitting order...' : form.payment_method === 'cod' ? 'Place COD order' : `Submit payment details · ${formatPrice(total)}`}</button>
          </form>
          <aside className="glass-card checkout-summary">
            <p className="eyebrow">Order summary</p>
            <div className="checkout-items">{items.map((item) => <div className="checkout-item" key={item.id}><div>{item.image_url ? <img src={item.image_url} alt="" /> : <span className="image-placeholder">No image</span>}</div><div><strong>{item.name}</strong><small>{item.quantity} × {formatPrice(item.price)}</small></div><b>{formatPrice(Number(item.price) * item.quantity)}</b></div>)}</div>
            <div className="summary-row"><span>Pieces</span><strong>{cartItemCount(cart)}</strong></div>
            <div className="summary-row total-row"><span>Total</span><strong>{formatPrice(total)}</strong></div>
            <small className="checkout-note">Prices and stock are verified from the Django database when you place the order. Payment remains pending until reviewed.</small>
          </aside>
        </div>}
      </main>
    </div>
  )
}

export default CheckoutPage
