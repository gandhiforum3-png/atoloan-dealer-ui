import { useState } from 'react'
import { updateCustomer } from '../../api/customers'
import Modal from '../../components/Modal'
import { friendlyError } from '../../utils/format'

const FIELDS = [
  { name: 'first_name', label: 'First name' },
  { name: 'last_name', label: 'Last name' },
  { name: 'phone_number', label: 'Phone', type: 'tel', error: 'Enter a 10-digit phone number.', rule: /^\d{10}$/u },
  { name: 'address', label: 'Street address' },
  { name: 'city', label: 'City' },
  { name: 'state', label: 'State', maxLength: 2, error: 'Use the 2-letter state code, like CA.', rule: /^[A-Z]{2}$/u },
  { name: 'zipcode', label: 'ZIP code', inputMode: 'numeric', maxLength: 5, error: 'Enter a 5-digit ZIP code.', rule: /^\d{5}$/u },
]

function normalise(name, value) {
  const trimmed = (value || '').trim()
  if (name === 'phone_number') return trimmed.replace(/\D/gu, '')
  if (name === 'state') return trimmed.toUpperCase()
  return trimmed
}

// Correct a customer's contact details on their behalf (audited server-side).
function CustomerEditModal({ customer, onClose, onSaved }) {
  const [values, setValues] = useState(() => Object.fromEntries(FIELDS.map(({ name }) => [name, customer[name] || ''])))
  const [invalid, setInvalid] = useState({})
  const [error, setError] = useState(null)
  const [saving, setSaving] = useState(false)

  async function handleSubmit(event) {
    event.preventDefault()
    // Only what the admin edited: an untouched legacy value (e.g. state
    // "California") must not block saving an unrelated fix
    const changes = Object.fromEntries(
      FIELDS.map(({ name }) => [name, normalise(name, values[name])]).filter(
        ([name, value]) => value !== '' && value !== normalise(name, customer[name])
      )
    )
    const bad = FIELDS.filter(({ name, rule }) => rule && changes[name] !== undefined && !rule.test(changes[name]))
    setInvalid(Object.fromEntries(bad.map(({ name }) => [name, true])))
    if (bad.length) return
    if (Object.keys(changes).length === 0) {
      onClose() // nothing edited: nothing to save or audit
      return
    }

    setSaving(true)
    setError(null)
    try {
      onSaved(await updateCustomer(customer.id, changes))
    } catch (err) {
      setError(friendlyError(err))
      setSaving(false)
    }
  }

  return (
    <Modal title="Edit customer details" onClose={onClose}>
      <form onSubmit={handleSubmit} noValidate>
        {error && (
          <div className="modal-error" role="alert">
            {error}
          </div>
        )}
        <p className="dealers-field-hint dealers-field-hint--block">
          Sign-in email <strong>{customer.email}</strong> can&apos;t be changed. Every edit is recorded in the audit log.
        </p>
        {FIELDS.map(({ name, label, error: message, type, inputMode, maxLength }) => (
          <div key={name}>
            <label className="field-label" htmlFor={`customer-${name}`}>
              {label}
            </label>
            <input
              id={`customer-${name}`}
              className="field-input"
              value={values[name]}
              onChange={(event) => setValues((prev) => ({ ...prev, [name]: event.target.value }))}
              aria-invalid={invalid[name] ? 'true' : undefined}
              aria-describedby={invalid[name] ? `customer-${name}-error` : undefined}
              type={type}
              inputMode={inputMode}
              maxLength={maxLength}
            />
            {invalid[name] && (
              <p id={`customer-${name}-error`} className="field-error">
                {message}
              </p>
            )}
          </div>
        ))}
        <div className="modal-actions">
          <button type="button" className="btn btn-secondary" onClick={onClose}>
            Cancel
          </button>
          <button type="submit" className="btn btn-primary" disabled={saving}>
            {saving ? 'Saving…' : 'Save changes'}
          </button>
        </div>
      </form>
    </Modal>
  )
}

export default CustomerEditModal
