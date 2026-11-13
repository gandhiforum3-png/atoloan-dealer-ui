import { useEffect, useMemo, useState } from 'react'
import { getLender, listLenders, rejectLender, setLenderApproval } from '../../api/admin'
import Modal from '../../components/Modal'
import RateSheetReview from '../../components/RateSheetReview'
import StatusBadge from '../../components/StatusBadge'
import { formatDate, friendlyError } from '../../utils/format'
import '../Applications.css'
import './Admin.css'

// Tells the sidebar's pending-count badge to refresh
export const LENDERS_CHANGED_EVENT = 'atoloan:lenders-changed'

const FILTERS = [
  { id: 'pending', label: 'Pending review' },
  { id: 'approved', label: 'Approved' },
  { id: 'all', label: 'All' },
]

function statusLabel(status) {
  return status === 'approved' ? 'Approved' : 'Pending'
}

function SubmittedBy({ lender }) {
  if (!lender.submitted_by) return <span className="applications-subtext">Added by Atoloan</span>
  return (
    <>
      <p className="applications-name">{lender.submitted_by.dealership_name || lender.submitted_by.dealer_id}</p>
      <p className="applications-subtext">{formatDate(lender.submitted_at)}</p>
    </>
  )
}

function LenderReviewModal({ lenderId, onClose, onDone }) {
  const [lender, setLender] = useState(null)
  const [loadError, setLoadError] = useState(null)
  const [confirming, setConfirming] = useState(null) // 'reject' | 'unpublish'
  const [saving, setSaving] = useState(false)
  const [actionError, setActionError] = useState(null)

  useEffect(() => {
    let cancelled = false
    getLender(lenderId)
      .then((data) => !cancelled && setLender(data))
      .catch((err) => !cancelled && setLoadError(friendlyError(err)))
    return () => {
      cancelled = true
    }
  }, [lenderId])

  async function run(action) {
    setSaving(true)
    setActionError(null)
    try {
      if (action === 'approve') {
        onDone({ ...(await setLenderApproval(lenderId, 'approved')) }, `${lender.name} is approved and can now be offered to customers.`)
      } else if (action === 'unpublish') {
        onDone({ ...(await setLenderApproval(lenderId, 'pending')) }, `${lender.name} was moved back to pending. Customers won't be matched to it.`)
      } else {
        await rejectLender(lenderId)
        onDone({ id: lenderId, removed: true }, `${lender.name} was rejected and removed.`)
      }
    } catch (err) {
      setActionError(friendlyError(err))
      setSaving(false)
    }
  }

  const title = lender ? lender.name : 'Review lender'

  return (
    <Modal title={title} onClose={onClose} size="wide">
      {loadError ? (
        <div className="modal-error">{loadError}</div>
      ) : !lender ? (
        <p className="qr-code-note">Loading rate sheet…</p>
      ) : (
        <>
          <div className="lender-review-meta">
            <StatusBadge status={statusLabel(lender.approval_status)} />
            <span>
              {lender.submitted_by
                ? `Submitted by ${lender.submitted_by.dealership_name || lender.submitted_by.dealer_id} on ${formatDate(lender.submitted_at)}`
                : 'Added by Atoloan'}
            </span>
          </div>

          {lender.approval_status === 'pending' && (
            <p className="lender-review-hint">
              Check the rates, tiers and terms against the lender&apos;s official rate sheet. Once approved, every
              customer in an eligible region can be matched to this lender.
            </p>
          )}

          <RateSheetReview rateSheet={lender.rate_sheet} />

          <div className="modal-sticky-actions">
            {actionError && <div className="modal-error lender-review-error">{actionError}</div>}

            {confirming === 'reject' ? (
              <>
                <p className="modal-sticky-actions-note">
                  Reject and permanently remove <strong>{lender.name}</strong>? It will also be removed from the
                  submitting dealer&apos;s network.
                </p>
                <button type="button" className="btn btn-secondary" onClick={() => setConfirming(null)} disabled={saving}>
                  Cancel
                </button>
                <button type="button" className="btn btn-danger" onClick={() => run('reject')} disabled={saving}>
                  {saving ? 'Rejecting…' : 'Reject and remove'}
                </button>
              </>
            ) : confirming === 'unpublish' ? (
              <>
                <p className="modal-sticky-actions-note">
                  Customers won&apos;t be matched to <strong>{lender.name}</strong> until it&apos;s approved again.
                </p>
                <button type="button" className="btn btn-secondary" onClick={() => setConfirming(null)} disabled={saving}>
                  Cancel
                </button>
                <button type="button" className="btn btn-dark" onClick={() => run('unpublish')} disabled={saving}>
                  {saving ? 'Unpublishing…' : 'Unpublish'}
                </button>
              </>
            ) : lender.approval_status === 'pending' ? (
              <>
                <button type="button" className="btn btn-secondary" onClick={() => setConfirming('reject')}>
                  Reject…
                </button>
                <button type="button" className="btn btn-primary" onClick={() => run('approve')} disabled={saving}>
                  {saving ? 'Approving…' : 'Approve lender'}
                </button>
              </>
            ) : (
              <button type="button" className="btn btn-secondary" onClick={() => setConfirming('unpublish')}>
                Unpublish…
              </button>
            )}
          </div>
        </>
      )}
    </Modal>
  )
}

function AdminLenders() {
  const [lenders, setLenders] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [filter, setFilter] = useState('pending')
  const [reviewingId, setReviewingId] = useState(null)
  const [notice, setNotice] = useState(null)

  useEffect(() => {
    listLenders()
      .then(setLenders)
      .catch((err) => setError(friendlyError(err)))
      .finally(() => setLoading(false))
  }, [])

  const counts = useMemo(
    () => ({
      pending: lenders.filter((l) => l.approval_status === 'pending').length,
      approved: lenders.filter((l) => l.approval_status === 'approved').length,
      all: lenders.length,
    }),
    [lenders]
  )
  const visible = filter === 'all' ? lenders : lenders.filter((l) => l.approval_status === filter)

  function handleDone(result, message) {
    setLenders((prev) =>
      result.removed ? prev.filter((l) => l.id !== result.id) : prev.map((l) => (l.id === result.id ? { ...l, ...result } : l))
    )
    setReviewingId(null)
    setNotice(message)
    window.dispatchEvent(new Event(LENDERS_CHANGED_EVENT))
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Lender Approvals</h1>
          <p>
            Lenders submitted by dealers stay hidden from customers until you approve them. Review each rate sheet
            before it goes live.
          </p>
        </div>
      </div>

      {notice && (
        <div className="page-notice" role="status">
          <i className="fa-solid fa-circle-check" aria-hidden="true"></i>
          {notice}
          <button type="button" aria-label="Dismiss" onClick={() => setNotice(null)}>
            <i className="fa-solid fa-xmark" aria-hidden="true"></i>
          </button>
        </div>
      )}

      <div className="card applications-card">
        <div className="admin-toolbar">
          <div className="segmented" role="group" aria-label="Filter lenders">
            {FILTERS.map((f) => (
              <button key={f.id} type="button" aria-pressed={filter === f.id} onClick={() => setFilter(f.id)}>
                {f.label}
                {f.id === 'pending' ? (
                  counts.pending > 0 && <span className="count-pill">{counts.pending}</span>
                ) : (
                  <span className="admin-filter-count"> {counts[f.id]}</span>
                )}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <p className="qr-code-note">Loading lenders…</p>
        ) : error ? (
          <div className="empty-state">
            <span className="empty-state-icon">
              <i className="fa-solid fa-triangle-exclamation" aria-hidden="true"></i>
            </span>
            <h3>Couldn&apos;t load lenders</h3>
            <p>{error}</p>
          </div>
        ) : visible.length === 0 ? (
          <div className="empty-state">
            <span className="empty-state-icon">
              <i className={`fa-solid ${filter === 'pending' ? 'fa-circle-check' : 'fa-building-columns'}`} aria-hidden="true"></i>
            </span>
            <h3>{filter === 'pending' ? "You're all caught up" : 'No lenders'}</h3>
            <p>
              {filter === 'pending'
                ? 'No rate sheets are waiting for review. New dealer submissions will appear here.'
                : 'Lenders appear here once a rate sheet has been uploaded.'}
            </p>
          </div>
        ) : (
          <div className="applications-table-wrap">
            <table className="applications-table">
              <thead>
                <tr>
                  <th scope="col">Lender</th>
                  <th scope="col">Submitted By</th>
                  <th scope="col">Status</th>
                  <th scope="col">
                    <span className="visually-hidden">Actions</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {visible.map((lender) => (
                  <tr key={lender.id} className="admin-row">
                    <td>
                      <p className="applications-name">{lender.name}</p>
                      <p className="applications-subtext">ID {lender.id}</p>
                    </td>
                    <td>
                      <SubmittedBy lender={lender} />
                    </td>
                    <td>
                      <StatusBadge status={statusLabel(lender.approval_status)} />
                    </td>
                    <td className="admin-row-actions">
                      <button
                        type="button"
                        className={`btn ${lender.approval_status === 'pending' ? 'btn-primary' : 'btn-secondary'}`}
                        onClick={() => setReviewingId(lender.id)}
                        aria-label={`${lender.approval_status === 'pending' ? 'Review' : 'View'} ${lender.name}`}
                      >
                        {lender.approval_status === 'pending' ? 'Review' : 'View'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {reviewingId !== null && (
        <LenderReviewModal lenderId={reviewingId} onClose={() => setReviewingId(null)} onDone={handleDone} />
      )}
    </div>
  )
}

export default AdminLenders
