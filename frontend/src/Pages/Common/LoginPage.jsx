import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'

const getLoginErrorMessage = (data, status) => {
  if (typeof data === 'string' && data.trim() && !data.trim().startsWith('<')) return data.trim()
  if (typeof data?.message === 'string' && data.message.trim()) return data.message.trim()
  if (typeof data?.detail === 'string' && data.detail.trim()) return data.detail.trim()
  if (typeof data?.error === 'string' && data.error.trim()) return data.error.trim()

  if (data && typeof data === 'object') {
    const messages = Object.values(data)
      .flatMap((value) => Array.isArray(value) ? value : [value])
      .map((value) => typeof value === 'object' ? (value?.message || value?.detail) : value)
      .filter(Boolean)
      .map(String)

    if (messages.length) return messages.join(' ')
  }

  return status ? `Unable to log in (request failed with status ${status}).` : 'Unable to log in right now.'
}

function LoginPage({ theme, onToggleTheme }) {
  const navigate = useNavigate()
  const location = useLocation()
  const [form, setForm] = useState({ email: '', password: '' })
  const [showPassword, setShowPassword] = useState(false)
  const [status, setStatus] = useState(() => location.state?.registered ? { type: 'success', message: 'Account created. Log in to continue.' } : { type: '', message: '' })
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
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: form.email.trim(), password: form.password }),
      })
      const responseText = await response.text()
      let data = {}
      try {
        data = responseText ? JSON.parse(responseText) : {}
      } catch {
        data = responseText
      }
      if (!response.ok) throw new Error(getLoginErrorMessage(data, response.status))
      if (!data.token) throw new Error('Login succeeded, but the server did not return a token. Please try again.')
      localStorage.setItem('token', data.token)
      navigate('/user-home', { replace: true })
    } catch (error) {
      const message = error instanceof TypeError
        ? 'Unable to reach the server. Please try again.'
        : error.message
      setStatus({ type: 'error', message: message || 'Something went wrong. Please try again.' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-page">
      <aside className="auth-aside"><Link className="brand-mark" to="/"><img src="/assets/loopluxe_logo.png" alt="LoopLuxe Handcrafted Crochet" /></Link><div className="auth-quote"><p className="eyebrow">Welcome back</p><h1>There is always room for one more beautiful thing.</h1><p>Pick up where you left off and keep building a collection with character.</p></div><small>Small batch · thoughtfully made · LoopLuxe</small></aside>
      <main className="auth-main">
        <div className="auth-topbar"><Link to="/">← Back to home</Link><button className="theme-toggle" type="button" onClick={onToggleTheme} aria-label="Toggle theme">{theme === 'light' ? '☾' : '☼'}</button></div>
        <div className="auth-form-wrap"><p className="eyebrow">Your LoopLuxe space</p><h2>Welcome back</h2><p>Log in to view your saved pieces and keep shopping slowly.</p>
          {status.message && <div className={`form-message ${status.type}`} role="alert">{status.message}</div>}
          <form onSubmit={handleSubmit} noValidate>
            <div className="form-field"><label htmlFor="email">Email address</label><input className="form-control" id="email" name="email" type="email" value={form.email} onChange={updateField} autoComplete="email" /></div>
            <div className="form-field"><label htmlFor="password">Password</label><div className="password-wrap"><input className="form-control" id="password" name="password" type={showPassword ? 'text' : 'password'} value={form.password} onChange={updateField} autoComplete="current-password" /><button className="password-toggle" type="button" onClick={() => setShowPassword((shown) => !shown)}>{showPassword ? 'Hide' : 'Show'}</button></div></div>
            <button className="button-primary auth-submit" type="submit" disabled={loading}>{loading ? 'Logging in…' : 'Log in ↗'}</button>
          </form>
          <p className="auth-switch">New to LoopLuxe? <Link to="/register">Create an account</Link></p>
        </div>
      </main>
    </div>
  )
}

export default LoginPage
