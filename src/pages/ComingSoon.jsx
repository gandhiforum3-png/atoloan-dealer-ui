import './ComingSoon.css'

function ComingSoon({ title, description, icon }) {
  return (
    <div>
      <div className="page-header">
        <div>
          <h1>{title}</h1>
          <p>{description}</p>
        </div>
      </div>

      <div className="card coming-soon-card">
        <div className="empty-state">
          <span className="empty-state-icon">
            <i className={`fa-solid ${icon}`} aria-hidden="true"></i>
          </span>
          <h3>Coming Soon</h3>
          <p>This section of the dealer hub is still under construction.</p>
        </div>
      </div>
    </div>
  )
}

export default ComingSoon
