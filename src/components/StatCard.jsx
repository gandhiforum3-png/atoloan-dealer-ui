import './StatCard.css'

function StatCard({ label, value }) {
  return (
    <div className="stat-card">
      <p className="stat-card-label">{label}</p>
      <span className="stat-card-value">{value}</span>
    </div>
  )
}

export default StatCard
