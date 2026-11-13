import { useEffect, useState } from 'react'
import { createDealer, listDealers, resetDealerPassword, updateDealer } from '../api/dealers'
import ConfirmModal from '../components/ConfirmModal'
import Modal from '../components/Modal'
import StatusBadge from '../components/StatusBadge'
import { useAuth } from '../context/useAuth'
import { formatDate, friendlyError } from '../utils/format'
import './Dealers.css'

const EMPTY_FORM = { name: '', dealership_name: '', email: '', is_admin: false }

function DealerFormModal({ mode, dealer, isSelf, onClose, onSaved }) {
  const [form, setForm] = useState(
    mode === 'edit'
      ? { name: dealer.name, dealership_name: dealer.dealership_name, email: dealer.email, is_admin: dealer.is_admin }
      : EMPTY_FORM
  )
  const [error, setError] = useState(null)
  const [saving, setSaving] = useState(false)

  function handleChange(field) {
    return (event) =>
      setForm((prev) => ({ ...prev, [field]: event.target.type === 'checkbox' ? event.target.checked : event.target.value }))
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setSaving(true)
    setError(null)
    try {
      const saved = mode === 'add' ? await createDealer(form) : await updateDealer(dealer.dealer_id, form)
      onSaved(saved)
    } catch (err) {
      setError(friendlyError(err))
      setSaving(false)
    }
  }

  return (
    <Modal title={mode === 'add' ? 'Add Dealer' : 'Edit Dealer'} onClose={onClose}>
      <form onSubmit={handleSubmit}>
        {error && (
          <div className="modal-error" role="alert">
            {error}
          </div>
        )}

        <label className="field-label" htmlFor="dealership_name">
          Dealership Name
        </label>
        <input
          id="dealership_name"
          className="field-input"
          value={form.dealership_name}
          onChange={handleChange('dealership_name')}
          required
        />

        <label className="field-label" htmlFor="name">
          Contact Name
        </label>
        <input id="name" className="field-input" value={form.name} onChange={handleChange('name')} required />

        <label className="field-label" htmlFor="email">
          Email
        </label>
        <input
          id="email"
          type="email"
          className="field-input"
          value={form.email}
          onChange={handleChange('email')}
          autoComplete="off"
          required
        />

        <label className="checkbox-label dealers-admin-toggle">
          <input type="checkbox" checked={form.is_admin} onChange={handleChange('is_admin')} disabled={isSelf} />
          <span>
            <strong>Atoloan administrator</strong>
            <span className="dealers-field-hint">
              {isSelf
                ? "You can't remove your own admin access — ask another administrator."
                : 'Can manage dealers, approve lenders and see every application.'}
            </span>
          </span>
        </label>

        {mode === 'add' && (
          <p className="dealers-field-hint dealers-field-hint--block">
            A one-time password is generated when you save. The dealer chooses their own at first sign-in.
          </p>
        )}

        <div className="modal-actions">
          <button type="button" className="btn btn-secondary" onClick={onClose}>
            Cancel
          </button>
          <button type="submit" className="btn btn-primary" disabled={saving}>
            {saving ? 'Saving…' : mode === 'add' ? 'Create Dealer' : 'Save Changes'}
          </button>
        </div>
      </form>
    </Modal>
  )
}

function TemporaryPasswordModal({ title, dealer, password, onClose }) {
  const [copied, setCopied] = useState(false)

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(password)
      setCopied(true)
    } catch {
      // Clipboard access can fail (permissions, insecure context) — the password
      // is still visible on screen for the admin to copy by hand.
    }
  }

  return (
    <Modal title={title} onClose={onClose}>
      <p className="dealers-modal-copy">
        Share this one-time password with <strong>{dealer.dealership_name}</strong> ({dealer.email}) over a secure
        channel. It won&apos;t be shown again, and they&apos;ll be asked to choose their own password at first sign-in.
      </p>
      <div className="dealers-password-row">
        <code className="dealers-password-value">{password}</code>
        <button type="button" className="btn btn-secondary" onClick={handleCopy}>
          <i className={`fa-solid ${copied ? 'fa-check' : 'fa-copy'}`} aria-hidden="true"></i>
          {copied ? 'Copied' : 'Copy'}
        </button>
      </div>
      <div className="modal-actions">
        <button type="button" className="btn btn-primary" onClick={onClose}>
          Done
        </button>
      </div>
    </Modal>
  )
}

function DealerRow({ dealer, isSelf, onEdit, onDeactivate, onActivate, onResetPassword }) {
  const label = dealer.dealership_name
  return (
    <tr className="dealers-row">
      <td>
        <p className="applications-name">
          {dealer.dealership_name}
          {isSelf && <span className="dealers-you"> (you)</span>}
        </p>
        <p className="applications-subtext">{dealer.dealer_id}</p>
      </td>
      <td>
        <p className="applications-name">{dealer.name}</p>
        <p className="applications-subtext">{dealer.email}</p>
      </td>
      <td>
        <div className="dealers-badges">
          <StatusBadge status={dealer.is_active ? 'Active' : 'Inactive'} />
          {dealer.is_admin && <StatusBadge status="Admin" />}
        </div>
      </td>
      <td>{formatDate(dealer.created_at)}</td>
      <td>
        {dealer.last_login_at ? (
          formatDate(dealer.last_login_at)
        ) : (
          <span className="applications-subtext">Never signed in</span>
        )}
        {dealer.must_change_password && dealer.last_login_at && (
          <p className="applications-subtext">Temporary password</p>
        )}
      </td>
      <td>
        <div className="dealers-actions">
          <button type="button" className="dealers-icon-btn" title="Edit" aria-label={`Edit ${label}`} onClick={() => onEdit(dealer)}>
            <i className="fa-solid fa-pen" aria-hidden="true"></i>
          </button>
          <button
            type="button"
            className="dealers-icon-btn"
            title="Reset password"
            aria-label={`Reset password for ${label}`}
            onClick={() => onResetPassword(dealer)}
          >
            <i className="fa-solid fa-key" aria-hidden="true"></i>
          </button>
          {dealer.is_active ? (
            <button
              type="button"
              className="dealers-icon-btn dealers-icon-btn--danger"
              title={isSelf ? "You can't deactivate your own account" : 'Deactivate'}
              aria-label={`Deactivate ${label}`}
              onClick={() => onDeactivate(dealer)}
              disabled={isSelf}
            >
              <i className="fa-solid fa-ban" aria-hidden="true"></i>
            </button>
          ) : (
            <button
              type="button"
              className="dealers-icon-btn"
              title="Reactivate"
              aria-label={`Reactivate ${label}`}
              onClick={() => onActivate(dealer)}
            >
              <i className="fa-solid fa-rotate-left" aria-hidden="true"></i>
            </button>
          )}
        </div>
      </td>
    </tr>
  )
}

function Dealers() {
  const { user } = useAuth()
  const [dealers, setDealers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [search, setSearch] = useState('')
  const [modal, setModal] = useState(null) // { type: 'add' | 'edit' | 'deactivate' | 'reactivate' | 'reset' | 'password', ... }

  useEffect(() => {
    let cancelled = false

    const timeoutId = setTimeout(() => {
      setLoading(true)
      listDealers(search)
        .then((data) => {
          if (!cancelled) {
            setDealers(data)
            setError(null)
          }
        })
        .catch((err) => {
          if (!cancelled) setError(friendlyError(err))
        })
        .finally(() => {
          if (!cancelled) setLoading(false)
        })
    }, 250)

    return () => {
      cancelled = true
      clearTimeout(timeoutId)
    }
  }, [search])

  function upsertDealer(saved) {
    // Never keep a one-time password in list state
    const { temporary_password: _omit, ...dealer } = saved
    setDealers((prev) =>
      prev.some((d) => d.dealer_id === dealer.dealer_id)
        ? prev.map((d) => (d.dealer_id === dealer.dealer_id ? dealer : d))
        : [dealer, ...prev]
    )
  }

  const close = () => setModal(null)

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Dealer Management</h1>
          <p>Onboard new dealerships, manage access, and decide who can administer Atoloan.</p>
        </div>
        <div className="page-header-actions">
          <button type="button" className="btn btn-primary" onClick={() => setModal({ type: 'add' })}>
            <i className="fa-solid fa-plus" aria-hidden="true"></i> Add Dealer
          </button>
        </div>
      </div>

      <div className="card dealers-card">
        <div className="dealers-search">
          <i className="fa-solid fa-magnifying-glass" aria-hidden="true"></i>
          <label htmlFor="dealer-search" className="visually-hidden">
            Search dealers
          </label>
          <input
            id="dealer-search"
            type="search"
            className="field-input dealers-search-input"
            placeholder="Search by dealership, contact, or email"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
        </div>

        {loading ? (
          <p className="qr-code-note">Loading dealers…</p>
        ) : error ? (
          <div className="empty-state">
            <span className="empty-state-icon">
              <i className="fa-solid fa-triangle-exclamation" aria-hidden="true"></i>
            </span>
            <h3>Couldn&apos;t load dealers</h3>
            <p>{error}</p>
          </div>
        ) : dealers.length === 0 ? (
          <div className="empty-state">
            <span className="empty-state-icon">
              <i className="fa-solid fa-building" aria-hidden="true"></i>
            </span>
            <h3>{search ? 'No matching dealers' : 'No Dealers Yet'}</h3>
            <p>{search ? 'Try a different name or email.' : 'Onboard your first dealership to get started.'}</p>
          </div>
        ) : (
          <div className="applications-table-wrap">
            <table className="applications-table dealers-table">
              <thead>
                <tr>
                  <th scope="col">Dealer</th>
                  <th scope="col">Contact</th>
                  <th scope="col">Access</th>
                  <th scope="col">Joined</th>
                  <th scope="col">Last Login</th>
                  <th scope="col">
                    <span className="visually-hidden">Actions</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {dealers.map((dealer) => (
                  <DealerRow
                    key={dealer.dealer_id}
                    dealer={dealer}
                    isSelf={dealer.dealer_id === user.dealer_id}
                    onEdit={(d) => setModal({ type: 'edit', dealer: d })}
                    onDeactivate={(d) => setModal({ type: 'deactivate', dealer: d })}
                    onActivate={(d) => setModal({ type: 'reactivate', dealer: d })}
                    onResetPassword={(d) => setModal({ type: 'reset', dealer: d })}
                  />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {modal?.type === 'add' && (
        <DealerFormModal
          mode="add"
          onClose={close}
          onSaved={(saved) => {
            upsertDealer(saved)
            setModal({ type: 'password', title: 'Dealer Created', dealer: saved, password: saved.temporary_password })
          }}
        />
      )}
      {modal?.type === 'edit' && (
        <DealerFormModal
          mode="edit"
          dealer={modal.dealer}
          isSelf={modal.dealer.dealer_id === user.dealer_id}
          onClose={close}
          onSaved={(saved) => {
            upsertDealer(saved)
            close()
          }}
        />
      )}
      {modal?.type === 'deactivate' && (
        <ConfirmModal
          title="Deactivate Dealer"
          confirmLabel="Deactivate"
          busyLabel="Deactivating…"
          tone="danger"
          onClose={close}
          onConfirm={async () => {
            upsertDealer(await updateDealer(modal.dealer.dealer_id, { is_active: false }))
            close()
          }}
        >
          <strong>{modal.dealer.dealership_name}</strong> won&apos;t be able to sign in until reactivated, and any
          session they have open stops working immediately.
        </ConfirmModal>
      )}
      {modal?.type === 'reactivate' && (
        <ConfirmModal
          title="Reactivate Dealer"
          confirmLabel="Reactivate"
          busyLabel="Reactivating…"
          tone="primary"
          onClose={close}
          onConfirm={async () => {
            upsertDealer(await updateDealer(modal.dealer.dealer_id, { is_active: true }))
            close()
          }}
        >
          <strong>{modal.dealer.dealership_name}</strong> will be able to sign in again with their existing password.
        </ConfirmModal>
      )}
      {modal?.type === 'reset' && (
        <ConfirmModal
          title="Reset Password"
          confirmLabel="Reset Password"
          busyLabel="Resetting…"
          tone="primary"
          onClose={close}
          onConfirm={async () => {
            const { temporary_password } = await resetDealerPassword(modal.dealer.dealer_id)
            setModal({ type: 'password', title: 'Password Reset', dealer: modal.dealer, password: temporary_password })
          }}
        >
          Generate a new one-time password for <strong>{modal.dealer.dealership_name}</strong>? Their current password
          and every open session stop working immediately.
        </ConfirmModal>
      )}
      {modal?.type === 'password' && (
        <TemporaryPasswordModal title={modal.title} dealer={modal.dealer} password={modal.password} onClose={close} />
      )}
    </div>
  )
}

export default Dealers
