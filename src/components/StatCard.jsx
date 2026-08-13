import './StatCard.css'

function StatCard({ label, value, change }) {
  const isPositive = change.trim().startsWith('+')

  return (
    <div className="stat-card">
      <p className="stat-card-label">{label}</p>
      <div className="stat-card-row">
        <span className="stat-card-value">{value}</span>
        <span className={`stat-card-change${isPositive ? ' stat-card-change--up' : ' stat-card-change--down'}`}>
          {change}
        </span>
      </div>
    </div>
  )
}

export default StatCard
