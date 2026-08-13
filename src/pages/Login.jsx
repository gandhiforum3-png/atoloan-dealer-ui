import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import BrandMark from '../components/BrandMark'
import './Login.css'

function Login() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [remember, setRemember] = useState(false)

  const handleSubmit = (event) => {
    event.preventDefault()
    navigate('/dashboard')
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

          <div className="login-hero-stats">
            <div>
              <p className="login-hero-stat-value">1.5M+</p>
              <p className="login-hero-stat-label">Applications Processed</p>
            </div>
            <div>
              <p className="login-hero-stat-value">&lt; 3s</p>
              <p className="login-hero-stat-label">Soft Pull Response Time</p>
            </div>
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
              />

              <div className="login-form-row">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={remember}
                    onChange={(event) => setRemember(event.target.checked)}
                  />
                  Remember this computer
                </label>
                <a href="#forgot-password" className="text-link">
                  Forgot Password?
                </a>
              </div>

              <button type="submit" className="btn btn-dark btn-block">
                Sign In to Dashboard
              </button>

              <button type="button" className="btn btn-secondary btn-block">
                <i className="fa-solid fa-shield-halved" aria-hidden="true"></i>
                Use Security Key or Passkey
              </button>
            </form>
          </div>
        </section>
      </div>
    </div>
  )
}

export default Login
