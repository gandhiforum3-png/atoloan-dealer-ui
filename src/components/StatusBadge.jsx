import './StatusBadge.css'

// `tone` picks the color; defaults to the lowercased label (e.g. "Approved" → approved)
function StatusBadge({ status, tone }) {
  return <span className={`status-badge status-badge--${tone ?? status.toLowerCase()}`}>{status}</span>
}

export default StatusBadge
