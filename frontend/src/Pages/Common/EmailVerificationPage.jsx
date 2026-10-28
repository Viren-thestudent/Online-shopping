import { useEffect, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { fetchProfile, requestEmailVerification, verifyEmail } from '../../api/catalogueApi'

function EmailVerificationPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [token, setToken] = useState(searchParams.get('token') || '')
  const [loading, setLoading] = useState(true)
  const [working, setWorking] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [developmentUrl, setDevelopmentUrl] = useState('')

  useEffect(() => {
    fetchProfile()
      .then((user) => {
        if (!user?.is_admin) navigate('/user-home', { replace: true })
        else if (user.is_email_verified) navigate('/admin/dashboard', { replace: true })
      })
      .catch(() => navigate('/login', { replace: true }))
      .finally(() => setLoading(false))
  }, [navigate])

  const requestVerification = async () => {
    setWorking(true); setError(''); setMessage(''); setDevelopmentUrl('')
    try {
      const response = await requestEmailVerification()
      setMessage(response.message || 'Verification request processed.')
      setDevelopmentUrl(response.development_verification_url || '')
    } catch (requestError) { setError(requestError.message) } finally { setWorking(false) }
  }

  const submitToken = async (event) => {
    event.preventDefault()
    setWorking(true); setError(''); setMessage('')
    try {
      await verifyEmail(token.trim())
      navigate('/admin/dashboard', { replace: true })
    } catch (requestError) { setError(requestError.message) } finally { setWorking(false) }
  }

  if (loading) return <div className="page-shell"><main className="content-width admin-access-panel"><p className="eyebrow">Checking verification</p><h1>Preparing your <em>secure link.</em></h1></main></div>

  return <div className="page-shell"><main className="content-width admin-access-panel"><p className="eyebrow">Administrator verification</p><h1>Verify your <em>admin email.</em></h1><p>Administrator access is limited to the confirmed authorized account. Request a time-limited verification link, then open it or paste its token here.</p>{(error || message) && <p className={error ? 'form-message error' : 'form-message success'} role="status">{error || message}</p>}{developmentUrl && <p className="form-message success">Development link: <a href={developmentUrl}>{developmentUrl}</a></p>}<div className="form-actions"><button className="button-primary" type="button" onClick={requestVerification} disabled={working}>Request verification link</button><Link className="button-secondary" to="/user-home">Return to shop</Link></div><form onSubmit={submitToken} className="verification-token-form"><label htmlFor="verification-token">Verification token</label><input className="form-control" id="verification-token" value={token} onChange={(event) => setToken(event.target.value)} placeholder="Paste the token from the link" required /><button className="button-secondary" type="submit" disabled={working}>Verify email</button></form></main></div>
}

export default EmailVerificationPage
