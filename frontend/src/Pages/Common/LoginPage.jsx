import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'

const getLoginErrorMessage = (data, status) => {
  if (typeof data === 'string' && data.trim() && !data.trim().startsWith('<')) return data.trim()
  if (typeof data?.message === 'string' && data.message.trim()) return data.message.trim()
  if (typeof data?.detail === 'string' && data.detail.trim()) return data.detail.trim()
  if (typeof data?.error === 'string' && data.error.trim()) return data.error.trim()
  if (data && typeof data === 'object') {
    const messages = Object.values(data).flatMap((value) => Array.isArray(value) ? value : [value]).map((value) => typeof value === 'object' ? (value?.message || value?.detail) : value).filter(Boolean).map(String)
    if (messages.length) return messages.join(' ')
  }
  return status ? `Unable to log in (request failed with status ${status}).` : 'Unable to log in right now.'
}

function AuthBrand() {
  return <Link className="knots-auth-brand" to="/" aria-label="Knot & Bloom home"><img className="knots-auth-logo" src="/assets/knot-and-bloom-logo.png" alt="Knot & Bloom logo" /></Link>
}

function LoginPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const [form, setForm] = useState({ email: '', password: '' })
  const [showPassword, setShowPassword] = useState(false)
  const [status, setStatus] = useState(() => location.state?.registered ? { type: 'success', message: 'Account created. Log in to continue.' } : location.state?.sessionExpired ? { type: 'error', message: 'Your session expired. Please log in again.' } : { type: '', message: '' })
  const [loading, setLoading] = useState(false)

  const updateField = (event) => setForm((current) => ({ ...current, [event.target.name]: event.target.value }))

  const handleSubmit = async (event) => {
    event.preventDefault()
    setStatus({ type: '', message: '' })
    if (!form.email.trim() || !form.password) {
      setStatus({ type: 'error', message: 'Enter your email and password to continue.' })
      return
    }
    if (!/^\S+@\S+\.\S+$/.test(form.email)) {
      setStatus({ type: 'error', message: 'Please enter a valid email address.' })
      return
    }
    setLoading(true)
    try {
      const response = await fetch('/api/auth/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: form.email.trim(), password: form.password }) })
      const responseText = await response.text()
      let data = {}
      try { data = responseText ? JSON.parse(responseText) : {} } catch { data = responseText }
      if (!response.ok) throw new Error(getLoginErrorMessage(data, response.status))
      if (!data.token) throw new Error('Login succeeded, but the server did not return a token. Please try again.')
      localStorage.setItem('token', data.token)
      navigate('/user-home', { replace: true })
    } catch (error) {
      const message = error instanceof TypeError ? 'Unable to reach the server. Please try again.' : error.message
      setStatus({ type: 'error', message: message || 'Something went wrong. Please try again.' })
    } finally {
      setLoading(false)
    }
  }

  return <div className="auth-page knots-auth knots-auth-login">
    <aside className="auth-aside knots-auth-aside">
      <AuthBrand />
      <div className="knots-auth-message"><p className="knots-auth-kicker">Welcome back</p><h1>Keep a little joy close.</h1><p>Return to the pieces made slowly, thoughtfully, and just for the everyday.</p></div>
      <div className="knots-auth-art"><img src="/assets/knots-of-joy-tulip-bouquet.jpg" alt="A bouquet of pink crochet tulips" /><span>Made by hand<br /><em>with feeling.</em></span></div>
      <small className="knots-auth-caption">Small batch · thoughtfully made · Knot &amp; Bloom</small>
    </aside>
    <main className="auth-main knots-auth-main">
      <div className="auth-topbar knots-auth-topbar"><Link to="/">← Back to home</Link></div>
      <div className="auth-form-wrap knots-auth-form-wrap"><p className="knots-auth-kicker">Your Knot &amp; Bloom space</p><h2>Welcome back</h2><p className="knots-auth-intro">Log in to revisit your saved pieces and keep shopping slowly.</p>
        {status.message && <div className={`form-message ${status.type}`} role="alert">{status.message}</div>}
        <form onSubmit={handleSubmit} noValidate>
          <div className="form-field"><label htmlFor="email">Email address</label><input className="form-control" id="email" name="email" type="email" value={form.email} onChange={updateField} autoComplete="email" aria-label="Email address" /></div>
          <div className="form-field"><label htmlFor="password">Password</label><div className="password-wrap"><input className="form-control" id="password" name="password" type={showPassword ? 'text' : 'password'} value={form.password} onChange={updateField} autoComplete="current-password" aria-label="Password" /><button className="password-toggle" type="button" onClick={() => setShowPassword((shown) => !shown)} aria-label={showPassword ? 'Hide password' : 'Show password'}>{showPassword ? 'Hide' : 'Show'}</button></div></div>
          <button className="button-primary auth-submit" type="submit" disabled={loading}>{loading ? 'Logging in…' : 'Log in'} <span aria-hidden="true">→</span></button>
        </form>
        <p className="auth-switch">New to Knot &amp; Bloom? <Link to="/register">Create an account</Link></p>
      </div>
    </main>
  </div>
}

export default LoginPage
