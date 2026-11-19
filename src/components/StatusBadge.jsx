import './StatusBadge.css'

function StatusBadge({ status }) {
  const tone = status.toLowerCase().replace(/\s+/g, '-')

  return <span className={`status-badge status-badge--${tone}`}>{status}</span>
}

export default StatusBadge
