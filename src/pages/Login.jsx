import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import BrandMark from '../components/BrandMark'
import { useAuth } from '../context/useAuth'
import { ApiError } from '../api/client'
import './Login.css'

function Login() {
  const navigate = useNavigate()
  const { login, status } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState(null)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (status === 'authenticated') {
      navigate('/dashboard', { replace: true })
    }
  }, [status, navigate])

  const handleSubmit = async (event) => {
    event.preventDefault()
    if (!email || !password) return

    setSubmitting(true)
    setError(null)

    try {
      await login(email, password)
      navigate('/dashboard')
    } catch (err) {
      setError(
        err instanceof ApiError ? err.message : 'Unable to reach the server. Is the backend running?'
      )
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="login-page">
      <div className="login-panel">
        <section className="login-hero">
          <BrandMark variant="login" />

          <div className="login-hero-copy">
            <h1>Accelerate Your Financing Workflow</h1>
            <p>
              Run instant soft credit pulls, secure instant approvals, and coordinate with bank
              networks from one central portal designed for high-performance dealerships.
            </p>
          </div>
        </section>

        <section className="login-form-section">
          <div className="login-form-wrap">
            <h2>Welcome Back</h2>
            <p className="login-form-subtitle">Enter your dealership credentials to access your hub</p>

            <form onSubmit={handleSubmit}>
              <label className="field-label" htmlFor="email">
                Dealer Email
              </label>
              <input
                id="email"
                type="email"
                className="field-input"
                placeholder="manager@westsideauto.com"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                autoComplete="email"
                required
              />

              <label className="field-label" htmlFor="password">
                Password
              </label>
              <input
                id="password"
                type="password"
                className="field-input"
                placeholder="••••••••••••"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                autoComplete="current-password"
                required
              />

              {error && (
                <p className="login-error" role="alert">
                  {error}
                </p>
              )}

              <button type="submit" className="btn btn-dark btn-block" disabled={submitting}>
                {submitting ? 'Signing In…' : 'Sign In to Dashboard'}
              </button>
            </form>

            <p className="login-help">Forgot your password? Ask your Atoloan administrator to reset it.</p>
          </div>
        </section>
      </div>
    </div>
  )
}

export default Login
