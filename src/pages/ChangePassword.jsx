import { useState } from 'react'
import BrandMark from '../components/BrandMark'
import { useAuth } from '../context/useAuth'
import { ApiError } from '../api/client'
import './Login.css'

// Shown instead of the portal while the account holds an admin-issued
// temporary password — the backend refuses everything else until it's changed.
function ChangePassword() {
  const { changePassword, logout } = useAuth()
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState(null)
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async (event) => {
    event.preventDefault()
    if (newPassword !== confirmPassword) {
      setError('New passwords do not match.')
      return
    }
    setSubmitting(true)
    setError(null)
    try {
      await changePassword(currentPassword, newPassword)
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Unable to reach the server.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="login-page">
      <div className="login-panel">
        <section className="login-hero">
          <BrandMark variant="login" />
        </section>
        <section className="login-form-section">
          <div className="login-form-wrap">
            <h2>Set a New Password</h2>
            <p className="login-form-subtitle">
              Your administrator issued a temporary password. Choose your own to continue.
            </p>
            <form onSubmit={handleSubmit}>
              <label className="field-label" htmlFor="current-password">
                Temporary Password
              </label>
              <input
                id="current-password"
                type="password"
                className="field-input"
                value={currentPassword}
                onChange={(event) => setCurrentPassword(event.target.value)}
                autoComplete="current-password"
                required
              />
              <label className="field-label" htmlFor="new-password">
                New Password (12+ characters)
              </label>
              <input
                id="new-password"
                type="password"
                className="field-input"
                value={newPassword}
                onChange={(event) => setNewPassword(event.target.value)}
                autoComplete="new-password"
                minLength={12}
                required
              />
              <label className="field-label" htmlFor="confirm-password">
                Confirm New Password
              </label>
              <input
                id="confirm-password"
                type="password"
                className="field-input"
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                autoComplete="new-password"
                minLength={12}
                required
              />
              {error && (
                <p className="login-error" role="alert">
                  {error}
                </p>
              )}
              <button type="submit" className="btn btn-dark btn-block" disabled={submitting}>
                {submitting ? 'Saving…' : 'Save Password'}
              </button>
            </form>
            <p className="login-help">
              <button type="button" className="btn btn-secondary" onClick={logout}>
                Sign out
              </button>
            </p>
          </div>
        </section>
      </div>
    </div>
  )
}

export default ChangePassword
