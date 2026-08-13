import { useState } from 'react'
import { US_STATES } from '../data/usStates'
import './SoftPull.css'

const EMPTY_FORM = {
  firstName: '',
  lastName: '',
  email: '',
  phone: '',
  street: '',
  city: '',
  state: '',
  zip: '',
}

const isValidEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
const isValidPhone = (phone) => phone.replace(/\D/g, '').length >= 10

function SoftPull() {
  const [form, setForm] = useState(EMPTY_FORM)
  const [consent, setConsent] = useState(false)
  const [status, setStatus] = useState('idle') // idle | loading | done
  const [result, setResult] = useState(null)

  const updateField = (field) => (event) => {
    setForm((prev) => ({ ...prev, [field]: event.target.value }))
  }

  const canSubmit =
    consent &&
    form.firstName &&
    form.lastName &&
    isValidEmail(form.email) &&
    isValidPhone(form.phone) &&
    form.street &&
    form.city &&
    form.state &&
    form.zip

  const handleSubmit = (event) => {
    event.preventDefault()
    if (!canSubmit) return

    setStatus('loading')
    setResult(null)

    // Mock inquiry — replace with a real soft-pull API call.
    setTimeout(() => {
      setResult({
        scoreRange: '680 - 720',
        matchedLenders: 4,
        recommendedApr: '6.9% - 9.4%',
      })
      setStatus('done')
    }, 900)
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Run Soft Pull</h1>
          <p>Pulls basic credit data instantly without affecting the applicant&apos;s credit score.</p>
        </div>
      </div>

      <form className="card soft-pull-form" onSubmit={handleSubmit}>
        <h2>Applicant Information</h2>

        <div className="soft-pull-grid soft-pull-grid--2">
          <div>
            <label className="field-label" htmlFor="firstName">
              First Name
            </label>
            <input
              id="firstName"
              className="field-input"
              placeholder="John"
              value={form.firstName}
              onChange={updateField('firstName')}
            />
          </div>
          <div>
            <label className="field-label" htmlFor="lastName">
              Last Name
            </label>
            <input
              id="lastName"
              className="field-input"
              placeholder="Doe"
              value={form.lastName}
              onChange={updateField('lastName')}
            />
          </div>
        </div>

        <div className="soft-pull-grid soft-pull-grid--2">
          <div>
            <label className="field-label" htmlFor="email">
              Email Address
            </label>
            <input
              id="email"
              type="email"
              className="field-input"
              placeholder="john.doe@email.com"
              value={form.email}
              onChange={updateField('email')}
            />
          </div>
          <div>
            <label className="field-label" htmlFor="phone">
              Phone Number
            </label>
            <input
              id="phone"
              type="tel"
              className="field-input"
              placeholder="(310) 555-0148"
              value={form.phone}
              onChange={updateField('phone')}
            />
          </div>
        </div>

        <div>
          <label className="field-label" htmlFor="street">
            Street Address
          </label>
          <input
            id="street"
            className="field-input"
            placeholder="1234 Westside Blvd, Apt 4B"
            value={form.street}
            onChange={updateField('street')}
          />
        </div>

        <div className="soft-pull-grid soft-pull-grid--3">
          <div>
            <label className="field-label" htmlFor="city">
              City
            </label>
            <input
              id="city"
              className="field-input"
              placeholder="Los Angeles"
              value={form.city}
              onChange={updateField('city')}
            />
          </div>
          <div>
            <label className="field-label" htmlFor="state">
              State
            </label>
            <select id="state" className="field-input" value={form.state} onChange={updateField('state')}>
              <option value="" disabled>
                Select state
              </option>
              {US_STATES.map((state) => (
                <option key={state} value={state}>
                  {state}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="field-label" htmlFor="zip">
              Zip Code
            </label>
            <input
              id="zip"
              className="field-input"
              placeholder="90025"
              value={form.zip}
              onChange={updateField('zip')}
            />
          </div>
        </div>

        <label className="checkbox-label soft-pull-consent">
          <input type="checkbox" checked={consent} onChange={(event) => setConsent(event.target.checked)} />
          I certify that the applicant has provided written or electronic consent to run a soft pull query.
        </label>

        <div className="soft-pull-submit-row">
          <button type="submit" className="btn btn-dark" disabled={!canSubmit || status === 'loading'}>
            <i className="fa-solid fa-magnifying-glass" aria-hidden="true"></i>
            {status === 'loading' ? 'Running Inquiry…' : 'Run Soft Pull Inquiry'}
          </button>
        </div>
      </form>

      <div className="card soft-pull-results">
        {status === 'done' && result ? (
          <div className="soft-pull-result-grid">
            <div>
              <p className="soft-pull-result-label">Estimated Score Range</p>
              <p className="soft-pull-result-value">{result.scoreRange}</p>
            </div>
            <div>
              <p className="soft-pull-result-label">Matched Lenders</p>
              <p className="soft-pull-result-value">{result.matchedLenders}</p>
            </div>
            <div>
              <p className="soft-pull-result-label">Recommended APR</p>
              <p className="soft-pull-result-value">{result.recommendedApr}</p>
            </div>
          </div>
        ) : (
          <div className="empty-state">
            <span className="empty-state-icon">
              <i className="fa-solid fa-file-lines" aria-hidden="true"></i>
            </span>
            <h3>No Inquiry Data Found</h3>
            <p>Results will appear here after running a soft pull. Check consent and ensure the inputs are correct.</p>
          </div>
        )}
      </div>
    </div>
  )
}

export default SoftPull
