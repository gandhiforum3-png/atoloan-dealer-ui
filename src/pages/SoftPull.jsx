import { useState } from 'react'
import { US_STATES } from '../data/usStates'
import { VEHICLE_TYPES } from '../data/vehicleTypes'
import { submitSoftPull } from '../api/softPull'
import { ApiError } from '../api/client'
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
  vehicleType: '',
  vehiclePrice: '',
  downPayment: '',
}

const isValidEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
const isValidPhone = (phone) => phone.replace(/\D/g, '').length >= 10

function friendlyError(err) {
  return err instanceof ApiError ? err.message : 'Unable to reach the server. Is the backend running?'
}

function buildPayload(form, consent) {
  const answers = { 'vehicle-type': form.vehicleType }
  if (form.vehiclePrice.trim()) {
    answers['vehicle-price'] = form.vehiclePrice.trim()
  }
  if (form.downPayment.trim()) {
    answers['down-payment'] = form.downPayment.trim()
  }

  return {
    contactInfo: {
      firstName: form.firstName.trim(),
      lastName: form.lastName.trim(),
      email: form.email.trim(),
      phone: form.phone.trim(),
      address: form.street.trim(),
      city: form.city.trim(),
      state: form.state,
      zip: form.zip.trim(),
    },
    answers,
    // The dealer's certification that the applicant consented (FCRA) — the
    // backend refuses the pull without it and records the time.
    consent,
  }
}

function SoftPull() {
  const [form, setForm] = useState(EMPTY_FORM)
  const [consent, setConsent] = useState(false)
  const [status, setStatus] = useState('idle') // idle | loading | done
  const [result, setResult] = useState(null)
  const [error, setError] = useState(null)

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
    form.zip &&
    form.vehicleType

  const handleSubmit = async (event) => {
    event.preventDefault()
    if (!canSubmit) return

    setStatus('loading')
    setError(null)
    setResult(null)

    try {
      const data = await submitSoftPull(buildPayload(form, consent))
      setResult(data)
      setStatus('done')
    } catch (err) {
      setError(friendlyError(err))
      setStatus('idle')
    }
  }

  const prequal = result?.prequal
  const matchedBanks = result?.matched_banks ?? []

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
              placeholder="e.g. name@email.com"
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
              placeholder="e.g. (310) 555-0148"
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
            placeholder="Street and unit number"
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
              placeholder="e.g. 90025"
              value={form.zip}
              onChange={updateField('zip')}
            />
          </div>
        </div>

        <div className="soft-pull-grid soft-pull-grid--3">
          <div>
            <label className="field-label" htmlFor="vehicleType">
              Vehicle Type
            </label>
            <select
              id="vehicleType"
              className="field-input"
              value={form.vehicleType}
              onChange={updateField('vehicleType')}
            >
              <option value="" disabled>
                Select vehicle type
              </option>
              {VEHICLE_TYPES.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="field-label" htmlFor="vehiclePrice">
              Vehicle Price <span className="field-label-optional">(optional)</span>
            </label>
            <input
              id="vehiclePrice"
              type="number"
              min="0"
              step="1"
              className="field-input"
              placeholder="e.g. 32000"
              value={form.vehiclePrice}
              onChange={updateField('vehiclePrice')}
            />
          </div>
          <div>
            <label className="field-label" htmlFor="downPayment">
              Down Payment <span className="field-label-optional">(optional)</span>
            </label>
            <input
              id="downPayment"
              type="number"
              min="0"
              step="1"
              className="field-input"
              placeholder="e.g. 5000"
              value={form.downPayment}
              onChange={updateField('downPayment')}
            />
          </div>
        </div>

        <label className="checkbox-label soft-pull-consent">
          <input type="checkbox" checked={consent} onChange={(event) => setConsent(event.target.checked)} />
          I certify that the applicant has provided written or electronic consent to run a soft pull query.
        </label>

        {error && (
          <p className="login-error" role="alert">
            {error}
          </p>
        )}

        <div className="soft-pull-submit-row">
          <button type="submit" className="btn btn-dark" disabled={!canSubmit || status === 'loading'}>
            <i className="fa-solid fa-magnifying-glass" aria-hidden="true"></i>
            {status === 'loading' ? 'Running Inquiry…' : 'Run Soft Pull Inquiry'}
          </button>
        </div>
      </form>

      <div className="card soft-pull-results">
        {status === 'done' && prequal ? (
          <div>
            <div className="soft-pull-result-grid">
              <div>
                <p className="soft-pull-result-label">Credit Score</p>
                <p className="soft-pull-result-value">{prequal.score ?? '—'}</p>
              </div>
              <div>
                <p className="soft-pull-result-label">Tier</p>
                <p className="soft-pull-result-value">{prequal.tier ?? '—'}</p>
              </div>
              <div>
                <p className="soft-pull-result-label">Score Range</p>
                <p className="soft-pull-result-value">{prequal.score_range ?? '—'}</p>
              </div>
            </div>

            {prequal.score == null && (
              <p className="soft-pull-result-note">
                {prequal.result_description || 'No credit file was found for this applicant.'}
              </p>
            )}

            {matchedBanks.length > 0 ? (
              <div className="soft-pull-bank-match">
                <p className="soft-pull-result-label">
                  Matched Lenders <span className="soft-pull-count">({matchedBanks.length})</span>
                </p>
                <ul className="soft-pull-bank-list">
                  {matchedBanks.map((bank) => (
                    <li key={bank.bank_id} className="soft-pull-bank-row">
                      <div>
                        <p className="soft-pull-bank-name">{bank.bank_name}</p>
                        <p className="soft-pull-result-note">
                          {bank.program_name}
                          {bank.term_in_months ? ` · ${bank.term_in_months} mo` : ''}
                        </p>
                      </div>
                      <p className="soft-pull-bank-rate">{bank.interest_rate}</p>
                    </li>
                  ))}
                </ul>
              </div>
            ) : (
              prequal.score != null && (
                <p className="soft-pull-result-note">
                  No lender match yet — vehicle price is needed to calculate a loan amount for bank
                  matching.
                </p>
              )
            )}
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
