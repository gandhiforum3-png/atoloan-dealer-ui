import { NavLink } from 'react-router-dom'
import BrandMark from './BrandMark'
import './Sidebar.css'

const NAV_ITEMS = [
  { to: '/dashboard', label: 'Dashboard', icon: 'fa-house' },
  { to: '/soft-pull', label: 'Soft Pull', icon: 'fa-user-check' },
  { to: '/bank-network', label: 'Bank Network', icon: 'fa-shield-halved' },
  { to: '/applications', label: 'Applications', icon: 'fa-file-lines' },
  { to: '/qr-code', label: 'QR Code', icon: 'fa-qrcode' },
  { to: '/settings', label: 'Settings', icon: 'fa-gear' },
]

function Sidebar() {
  return (
    <aside className="sidebar">
      <div className="sidebar-brand">
        <BrandMark variant="sidebar" />
      </div>

      <nav className="sidebar-nav">
        {NAV_ITEMS.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) => `sidebar-link${isActive ? ' sidebar-link--active' : ''}`}
          >
            <i className={`fa-solid ${item.icon}`} aria-hidden="true"></i>
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>

      <div className="sidebar-status">
        <span className="sidebar-status-dot" aria-hidden="true"></span>
        <div>
          <p className="sidebar-status-title">PORTAL LIVE</p>
          <p className="sidebar-status-subtitle">Secure bank network connected</p>
        </div>
      </div>
    </aside>
  )
}

export default Sidebar
