import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import StatCard from '../components/StatCard'
import { listLenders } from '../api/admin'
import { getMyApplications, getMyApplicationsSummary } from '../api/applications'
import { useAuth } from '../context/useAuth'
import { friendlyError } from '../utils/format'
import './Dashboard.css'

function formatDate(value) {
  return value ? new Date(value).toLocaleDateString(undefined, { dateStyle: 'medium' }) : '—'
}

function Dashboard() {
  const { user } = useAuth()
  const firstName = user.name.split(' ')[0]
  const [summary, setSummary] = useState(null)
  const [recent, setRecent] = useState(null)
  const [error, setError] = useState(null)
  const [pendingLenders, setPendingLenders] = useState(0)

  useEffect(() => {
    let cancelled = false
    // Stats are counted server-side over every application, not just a page of them
    Promise.all([getMyApplicationsSummary(), getMyApplications({ limit: 5 })])
      .then(([counts, page]) => {
        if (cancelled) return
        setSummary(counts)
        setRecent(page.applications)
      })
      .catch((err) => !cancelled && setError(friendlyError(err)))
    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    if (!user.is_admin) return undefined
    let cancelled = false
    listLenders()
      .then((lenders) => !cancelled && setPendingLenders(lenders.filter((l) => l.approval_status === 'pending').length))
      .catch(() => {})
    return () => {
      cancelled = true
    }
  }, [user.is_admin])

  const stats = [
    { label: 'Total Applications', value: summary?.total },
    { label: 'Matched to a Bank', value: summary?.matched },
    { label: 'No Match Yet', value: summary?.unmatched },
    { label: 'Last 7 Days', value: summary?.last_7_days },
  ]

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Hello, {firstName}</h1>
          <p>Here is your dealership performance overview.</p>
        </div>
        <div className="page-header-actions">
          <Link to="/soft-pull" className="btn btn-primary">
            <i className="fa-solid fa-plus" aria-hidden="true"></i>
            New Application
          </Link>
        </div>
      </div>

      {pendingLenders > 0 && (
        <div className="admin-callout" role="status">
          <i className="fa-solid fa-building-columns" aria-hidden="true"></i>
          <p>
            <strong>
              {pendingLenders} lender{pendingLenders === 1 ? '' : 's'} awaiting approval.
            </strong>{' '}
            Customers aren&apos;t matched to them until you review the rate sheet.
          </p>
          <Link to="/admin/lenders" className="btn btn-dark">
            Review now
          </Link>
        </div>
      )}

      <div className="dashboard-overview">
        <div className="stats-grid">
          {stats.map((stat) => (
            <StatCard key={stat.label} label={stat.label} value={stat.value ?? '—'} />
          ))}
        </div>

        <div className="qr-promo-card">
          <div>
            <span className="qr-promo-icon">
              <i className="fa-solid fa-qrcode" aria-hidden="true"></i>
            </span>
            <h3>Generate QR Code</h3>
            <p>
              Create a showroom QR code that lets walk-in buyers run their own secure soft-pull
              financing instantly.
            </p>
          </div>
          <Link to="/qr-code" className="btn btn-primary btn-block">
            Get QR Code
            <i className="fa-solid fa-arrow-right" aria-hidden="true"></i>
          </Link>
        </div>
      </div>

      <div className="card recent-applications">
        <div className="recent-applications-header">
          <h2>Recent Applications</h2>
          <Link to="/applications" className="text-link">
            View All
          </Link>
        </div>

        {error ? (
          <p className="login-error" role="alert">{error}</p>
        ) : !recent ? (
          <p className="recent-applications-note">Loading applications…</p>
        ) : recent.length === 0 ? (
          <p className="recent-applications-note">
            No applications yet. Run a <Link to="/soft-pull" className="text-link">soft pull</Link> or share
            your <Link to="/qr-code" className="text-link">QR code</Link> to get started.
          </p>
        ) : (
          <table className="applications-table">
            <thead>
              <tr>
                <th>Applicant Name</th>
                <th>Date</th>
                <th>Credit Score</th>
                <th>Best Match</th>
              </tr>
            </thead>
            <tbody>
              {recent.map((application) => (
                <tr key={application.id}>
                  <td className="applications-table-name">
                    {application.first_name} {application.last_name}
                  </td>
                  <td>{formatDate(application.created_at)}</td>
                  <td>{application.prequal_score ?? '—'}</td>
                  <td>
                    {application.bank_name
                      ? `${application.bank_name}${application.interest_rate ? ` · ${application.interest_rate}` : ''}`
                      : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}

export default Dashboard
