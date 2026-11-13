import { useEffect, useState } from 'react'
import { getCustomer } from '../../api/customers'
import Modal from '../../components/Modal'
import StatusBadge from '../../components/StatusBadge'
import { customerName, formatDate, formatDateTime, friendlyError } from '../../utils/format'
import CustomerStatusBadge from './CustomerStatusBadge'

function documentCount(documents) {
  const received = Object.values(documents).filter(Boolean).length
  return `${received} of ${Object.keys(documents).length} documents`
}

// Read-only account view with the actions an admin can take on it.
function CustomerDetailModal({ customer, onClose, onEdit, onToggleStatus, onCloseAccount }) {
  const [detail, setDetail] = useState(null)
  const [error, setError] = useState(null)

  useEffect(() => {
    let cancelled = false
    getCustomer(customer.id)
      .then((data) => !cancelled && setDetail(data))
      .catch((err) => !cancelled && setError(friendlyError(err)))
    return () => {
      cancelled = true
    }
  }, [customer.id])

  const shown = detail || customer
  const address = [shown.address, shown.city, [shown.state, shown.zipcode].filter(Boolean).join(' ')].filter(Boolean).join(', ')

  return (
    <Modal title={customerName(customer)} size="wide" onClose={onClose}>
      {error && (
        <div className="modal-error" role="alert">
          {error}
        </div>
      )}
      <dl className="customer-facts">
        <div>
          <dt>Email</dt>
          <dd>{shown.email}</dd>
        </div>
        <div>
          <dt>Phone</dt>
          <dd>{shown.phone_number || '—'}</dd>
        </div>
        <div>
          <dt>Address</dt>
          <dd>{address || '—'}</dd>
        </div>
        <div>
          <dt>Status</dt>
          <dd>
            <CustomerStatusBadge status={shown.status} />
          </dd>
        </div>
        <div>
          <dt>Joined</dt>
          <dd>{formatDate(shown.created_at)}</dd>
        </div>
        <div>
          <dt>Last sign-in</dt>
          <dd>{formatDateTime(shown.last_login_at)}</dd>
        </div>
        <div>
          <dt>Sessions</dt>
          <dd>{`${shown.active_sessions} active session${shown.active_sessions === 1 ? '' : 's'}`}</dd>
        </div>
      </dl>

      <h3 className="customer-section-title">Applications</h3>
      {!detail && !error && <p className="qr-code-note">Loading applications…</p>}
      {detail && detail.applications.length === 0 && <p className="qr-code-note">No applications run from this account.</p>}
      {detail && detail.applications.length > 0 && (
        <div className="applications-table-wrap">
          <table className="applications-table">
            <thead>
              <tr>
                <th scope="col">Date</th>
                <th scope="col">Result</th>
                <th scope="col">Lender</th>
                <th scope="col">Rate</th>
                <th scope="col">Documents</th>
              </tr>
            </thead>
            <tbody>
              {detail.applications.map((application) => (
                <tr key={application.id}>
                  <td>{formatDate(application.created_at)}</td>
                  <td>
                    <StatusBadge
                      status={application.status === 'matched' ? 'Matched' : 'In review'}
                      tone={application.status === 'matched' ? 'approved' : 'pending'}
                    />
                  </td>
                  <td>{application.bank_name || '—'}</td>
                  <td>{application.interest_rate || '—'}</td>
                  <td>{documentCount(application.documents)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="modal-actions customer-actions">
        <button type="button" className="btn btn-secondary" onClick={() => onEdit(shown)}>
          Edit details
        </button>
        <button type="button" className="btn btn-secondary" onClick={() => onToggleStatus(shown)}>
          {shown.status === 'disabled' ? 'Enable sign-in' : 'Disable sign-in'}
        </button>
        <button type="button" className="btn btn-danger" onClick={() => onCloseAccount(shown)}>
          Close account
        </button>
      </div>
    </Modal>
  )
}

export default CustomerDetailModal
