import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { apiUrl } from '../../api/catalogueApi'

const getRegistrationErrorMessage = (data, status) => {
  if (typeof data === 'string' && data.trim()) return data.trim()
  if (data?.message) return data.message
  if (data?.detail) return data.detail
  if (data && typeof data === 'object') {
    const messages = Object.values(data).flatMap((value) => Array.isArray(value) ? value : [value]).filter(Boolean).map(String)
    if (messages.length) return messages.join(' ')
  }
  return status ? `Unable to create your account (request failed with status ${status}).` : 'Unable to create your account right now.'
}

function AuthBrand() {
  return <Link className="knots-auth-brand" to="/" aria-label="Knot & Bloom home"><img className="knots-auth-logo" src="/assets/knot-and-bloom-logo.png" alt="Knot & Bloom logo" /></Link>
}

function RegisterPage() {
  const navigate = useNavigate()
  const [form, setForm] = useState({ name: '', email: '', password: '', confirmPassword: '' })
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [status, setStatus] = useState({ type: '', message: '' })
  const [loading, setLoading] = useState(false)

  const updateField = (event) => setForm((current) => ({ ...current, [event.target.name]: event.target.value }))

  const handleSubmit = async (event) => {
    event.preventDefault()
    setStatus({ type: '', message: '' })
    if (!form.name.trim() || !form.email.trim() || !form.password || !form.confirmPassword) {
      setStatus({ type: 'error', message: 'Please complete every field.' })
      return
    }
    if (!/^\S+@\S+\.\S+$/.test(form.email)) {
      setStatus({ type: 'error', message: 'Please enter a valid email address.' })
      return
    }
    if (form.password.length < 6) {
      setStatus({ type: 'error', message: 'Password should be at least 6 characters.' })
      return
    }
    if (form.password !== form.confirmPassword) {
      setStatus({ type: 'error', message: 'Passwords do not match.' })
      return
    }
    setLoading(true)
    try {
      const response = await fetch(apiUrl('/auth/register'), { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: form.name.trim(), email: form.email.trim(), password: form.password }) })
      const responseText = await response.text()
      let data = {}
      try { data = responseText ? JSON.parse(responseText) : {} } catch { data = responseText }
      if (!response.ok) throw new Error(getRegistrationErrorMessage(data, response.status))
      navigate('/login', { state: { registered: true } })
    } catch (error) {
      setStatus({ type: 'error', message: error.message || 'Something went wrong. Please try again.' })
    } finally {
      setLoading(false)
    }
  }

  return <div className="auth-page knots-auth knots-auth-register">
    <aside className="auth-aside knots-auth-aside">
      <AuthBrand />
      <div className="knots-auth-message"><p className="knots-auth-kicker">A good beginning</p><h1>Make room for things made with care.</h1><p>Join a collection of thoughtful crochet pieces, each one made to bring warmth to the everyday.</p></div>
      <div className="knots-auth-art"><img src="/assets/knots-of-joy-tulip-bouquet.jpg" alt="A bouquet of pink crochet tulips" /><span>Start with<br /><em>something small.</em></span></div>
      <small className="knots-auth-caption">Small batch · thoughtfully made · Knot &amp; Bloom</small>
    </aside>
    <main className="auth-main knots-auth-main">
      <div className="auth-topbar knots-auth-topbar"><Link to="/">← Back to home</Link></div>
      <div className="auth-form-wrap knots-auth-form-wrap"><p className="knots-auth-kicker">Start your collection</p><h2>Create account</h2><p className="knots-auth-intro">Make a space for the pieces you want to keep close.</p>
        {status.message && <div className={`form-message ${status.type}`} role="alert">{status.message}</div>}
        <form onSubmit={handleSubmit} noValidate>
          <div className="form-field"><label htmlFor="name">Full name</label><input className="form-control" id="name" name="name" value={form.name} onChange={updateField} autoComplete="name" aria-label="Full name" /></div>
          <div className="form-field"><label htmlFor="email">Email address</label><input className="form-control" id="email" name="email" type="email" value={form.email} onChange={updateField} autoComplete="email" aria-label="Email address" /></div>
          <div className="form-field"><label htmlFor="password">Password</label><div className="password-wrap"><input className="form-control" id="password" name="password" type={showPassword ? 'text' : 'password'} value={form.password} onChange={updateField} autoComplete="new-password" aria-label="Password" /><button className="password-toggle" type="button" onClick={() => setShowPassword((shown) => !shown)} aria-label={showPassword ? 'Hide password' : 'Show password'}>{showPassword ? 'Hide' : 'Show'}</button></div></div>
          <div className="form-field"><label htmlFor="confirmPassword">Confirm password</label><div className="password-wrap"><input className="form-control" id="confirmPassword" name="confirmPassword" type={showConfirm ? 'text' : 'password'} value={form.confirmPassword} onChange={updateField} autoComplete="new-password" aria-label="Confirm password" /><button className="password-toggle" type="button" onClick={() => setShowConfirm((shown) => !shown)} aria-label={showConfirm ? 'Hide confirmation password' : 'Show confirmation password'}>{showConfirm ? 'Hide' : 'Show'}</button></div></div>
          <button className="button-primary auth-submit" type="submit" disabled={loading}>{loading ? 'Creating account…' : 'Create account'} <span aria-hidden="true">→</span></button>
        </form>
        <p className="auth-switch">Already have an account? <Link to="/login">Log in</Link></p>
      </div>
    </main>
  </div>
}

export default RegisterPage
