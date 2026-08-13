import { Link } from 'react-router-dom'
import StatCard from '../components/StatCard'
import StatusBadge from '../components/StatusBadge'
import { recentApplications } from '../data/recentApplications'
import { currentUser } from '../data/currentUser'
import './Dashboard.css'

const STATS = [
  { label: 'Total Applications', value: '247', change: '+12%' },
  { label: 'Approved', value: '189', change: '+8%' },
  { label: 'Pending Review', value: '42', change: '-3%' },
  { label: 'Declined', value: '16', change: '+2%' },
]

const currencyFormatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 0,
})

function Dashboard() {
  const firstName = currentUser.name.split(' ')[0]

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Hello, {firstName}</h1>
          <p>Here is your dealership performance overview for today.</p>
        </div>
        <div className="page-header-actions">
          <button type="button" className="btn btn-secondary">
            <i className="fa-solid fa-download" aria-hidden="true"></i>
            Export Reports
          </button>
          <button type="button" className="btn btn-primary">
            <i className="fa-solid fa-plus" aria-hidden="true"></i>
            New Application
          </button>
        </div>
      </div>

      <div className="dashboard-overview">
        <div className="stats-grid">
          {STATS.map((stat) => (
            <StatCard key={stat.label} {...stat} />
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

        <table className="applications-table">
          <thead>
            <tr>
              <th>Applicant Name</th>
              <th>Date</th>
              <th>Status</th>
              <th className="applications-table-amount">Amount</th>
            </tr>
          </thead>
          <tbody>
            {recentApplications.map((application) => (
              <tr key={application.id}>
                <td className="applications-table-name">{application.name}</td>
                <td>{application.date}</td>
                <td>
                  <StatusBadge status={application.status} />
                </td>
                <td className="applications-table-amount">
                  {currencyFormatter.format(application.amount)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default Dashboard
