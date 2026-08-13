import './StatusBadge.css'

function StatusBadge({ status }) {
  const tone = status.toLowerCase()

  return <span className={`status-badge status-badge--${tone}`}>{status}</span>
}

export default StatusBadge
