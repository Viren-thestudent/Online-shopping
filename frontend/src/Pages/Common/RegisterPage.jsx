import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'

const getRegistrationErrorMessage = (data, status) => {
  if (typeof data === 'string' && data.trim()) return data.trim()
  if (data?.message) return data.message
  if (data?.detail) return data.detail

  if (data && typeof data === 'object') {
    const messages = Object.values(data)
      .flatMap((value) => Array.isArray(value) ? value : [value])
      .filter(Boolean)
      .map(String)

    if (messages.length) return messages.join(' ')
  }

  return status ? `Unable to create your account (request failed with status ${status}).` : 'Unable to create your account right now.'
}

function RegisterPage({ theme, onToggleTheme }) {
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
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: form.name.trim(), email: form.email.trim(), password: form.password }),
      })
      const responseText = await response.text()
      let data = {}
      try {
        data = responseText ? JSON.parse(responseText) : {}
      } catch {
        data = responseText
      }
      if (!response.ok) throw new Error(getRegistrationErrorMessage(data, response.status))
      navigate('/login', { state: { registered: true } })
    } catch (error) {
      setStatus({ type: 'error', message: error.message || 'Something went wrong. Please try again.' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-page">
      <aside className="auth-aside"><Link className="brand-mark" to="/"><img src="/assets/loopluxe_logo.png" alt="LoopLuxe Handcrafted Crochet" /></Link><div className="auth-quote"><p className="eyebrow">A good beginning</p><h1>Make room for things made with care.</h1><p>Join a community that believes everyday objects can hold a little more warmth.</p></div><small>Small batch · thoughtfully made · LoopLuxe</small></aside>
      <main className="auth-main">
        <div className="auth-topbar"><Link to="/">← Back to home</Link><button className="theme-toggle" type="button" onClick={onToggleTheme} aria-label="Toggle theme">{theme === 'light' ? '☾' : '☼'}</button></div>
        <div className="auth-form-wrap"><p className="eyebrow">Start your collection</p><h2>Create account</h2><p>Make an account to save your favorites and get first access to new work.</p>
          {status.message && <div className={`form-message ${status.type}`} role="alert">{status.message}</div>}
          <form onSubmit={handleSubmit} noValidate>
            <div className="form-field"><label htmlFor="name">Full name</label><input className="form-control" id="name" name="name" value={form.name} onChange={updateField} autoComplete="name" /></div>
            <div className="form-field"><label htmlFor="email">Email address</label><input className="form-control" id="email" name="email" type="email" value={form.email} onChange={updateField} autoComplete="email" /></div>
            <div className="form-field"><label htmlFor="password">Password</label><div className="password-wrap"><input className="form-control" id="password" name="password" type={showPassword ? 'text' : 'password'} value={form.password} onChange={updateField} autoComplete="new-password" /><button className="password-toggle" type="button" onClick={() => setShowPassword((shown) => !shown)}>{showPassword ? 'Hide' : 'Show'}</button></div></div>
            <div className="form-field"><label htmlFor="confirmPassword">Confirm password</label><div className="password-wrap"><input className="form-control" id="confirmPassword" name="confirmPassword" type={showConfirm ? 'text' : 'password'} value={form.confirmPassword} onChange={updateField} autoComplete="new-password" /><button className="password-toggle" type="button" onClick={() => setShowConfirm((shown) => !shown)}>{showConfirm ? 'Hide' : 'Show'}</button></div></div>
            <button className="button-primary auth-submit" type="submit" disabled={loading}>{loading ? 'Creating account…' : 'Create account ↗'}</button>
          </form>
          <p className="auth-switch">Already have an account? <Link to="/login">Log in</Link></p>
        </div>
      </main>
    </div>
  )
}

export default RegisterPage
