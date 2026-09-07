import { useEffect, useState } from 'react'
import { getMyApplications } from '../api/applications'
import { ApiError } from '../api/client'
import './Applications.css'

function friendlyError(err) {
  return err instanceof ApiError ? err.message : 'Unable to reach the server. Is the backend running?'
}

const currencyFormatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 0,
})

function formatDate(value) {
  if (!value) return '—'
  return new Date(value).toLocaleString(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  })
}

function ApplicationRow({ application, expanded, onToggle }) {
  const matchedBanks = application.matched_banks || []

  return (
    <>
      <tr className="applications-row" onClick={onToggle}>
        <td>
          <p className="applications-name">
            {application.first_name} {application.last_name}
          </p>
          <p className="applications-subtext">{application.email}</p>
        </td>
        <td>{formatDate(application.created_at)}</td>
        <td>
          {application.prequal_score ?? '—'}
          {application.prequal_tier && <span className="applications-subtext"> · {application.prequal_tier}</span>}
        </td>
        <td>
          {application.bank_name ? (
            <>
              <p className="applications-name">{application.bank_name}</p>
              <p className="applications-subtext">{application.interest_rate}</p>
            </>
          ) : (
            '—'
          )}
        </td>
        <td className="applications-chevron">
          <i className={`fa-solid fa-chevron-${expanded ? 'up' : 'down'}`} aria-hidden="true"></i>
        </td>
      </tr>
      {expanded && (
        <tr className="applications-detail-row">
          <td colSpan={5}>
            <div className="applications-detail">
              <div className="rsr-fact-grid">
                <div>
                  <p className="rsr-fact-label">Phone</p>
                  <p className="rsr-fact-value">{application.phone_number || '—'}</p>
                </div>
                <div>
                  <p className="rsr-fact-label">Address</p>
                  <p className="rsr-fact-value">
                    {[application.address, application.city, application.state, application.zipcode]
                      .filter(Boolean)
                      .join(', ') || '—'}
                  </p>
                </div>
                <div>
                  <p className="rsr-fact-label">Down Payment</p>
                  <p className="rsr-fact-value">
                    {application.down_payment ? currencyFormatter.format(application.down_payment) : '—'}
                  </p>
                </div>
                <div>
                  <p className="rsr-fact-label">Prequal Result</p>
                  <p className="rsr-fact-value">{application.prequal_result_description || '—'}</p>
                </div>
              </div>

              {matchedBanks.length > 0 && (
                <>
                  <p className="rsr-fact-label rsr-fact-label--spaced">
                    Matched Lenders ({matchedBanks.length})
                  </p>
                  <ul className="soft-pull-bank-list applications-bank-list">
                    {matchedBanks.map((bank) => (
                      <li key={bank.bank_id} className="soft-pull-bank-row">
                        <div>
                          <p className="soft-pull-bank-name">{bank.bank_name}</p>
                          <p className="soft-pull-result-note">{bank.program_name}</p>
                        </div>
                        <p className="soft-pull-bank-rate">{bank.interest_rate}</p>
                      </li>
                    ))}
                  </ul>
                </>
              )}
            </div>
          </td>
        </tr>
      )}
    </>
  )
}

function Applications() {
  const [applications, setApplications] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [expandedId, setExpandedId] = useState(null)

  useEffect(() => {
    let cancelled = false

    getMyApplications()
      .then((data) => {
        if (!cancelled) setApplications(data)
      })
      .catch((err) => {
        if (!cancelled) setError(friendlyError(err))
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [])

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Applications</h1>
          <p>Every financing application submitted through your dealership&apos;s soft pull tab.</p>
        </div>
      </div>

      <div className="card applications-card">
        {loading ? (
          <p className="qr-code-note">Loading applications…</p>
        ) : error ? (
          <div className="empty-state">
            <span className="empty-state-icon">
              <i className="fa-solid fa-triangle-exclamation" aria-hidden="true"></i>
            </span>
            <h3>Couldn&apos;t load applications</h3>
            <p>{error}</p>
          </div>
        ) : applications.length === 0 ? (
          <div className="empty-state">
            <span className="empty-state-icon">
              <i className="fa-solid fa-file-lines" aria-hidden="true"></i>
            </span>
            <h3>No Applications Yet</h3>
            <p>Applications submitted from the Soft Pull tab will show up here.</p>
          </div>
        ) : (
          <table className="applications-table">
            <thead>
              <tr>
                <th>Applicant</th>
                <th>Submitted</th>
                <th>Credit Score</th>
                <th>Best Match</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {applications.map((application) => (
                <ApplicationRow
                  key={application.id}
                  application={application}
                  expanded={expandedId === application.id}
                  onToggle={() =>
                    setExpandedId((prev) => (prev === application.id ? null : application.id))
                  }
                />
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}

export default Applications
