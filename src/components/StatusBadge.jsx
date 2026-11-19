import './StatusBadge.css'

// `tone` picks the color; defaults to the lowercased label with spaces
// dashed (e.g. "Approved" → approved, "Past Due" → past-due)
function StatusBadge({ status, tone }) {
  const resolved = tone ?? status.toLowerCase().replace(/\s+/g, '-')

  return <span className={`status-badge status-badge--${resolved}`}>{status}</span>
}

export default StatusBadge
