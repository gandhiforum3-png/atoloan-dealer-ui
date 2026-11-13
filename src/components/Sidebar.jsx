import { useEffect, useState } from 'react'
import { NavLink } from 'react-router-dom'
import { listLenders } from '../api/admin'
import { useAuth } from '../context/useAuth'
import { LENDERS_CHANGED_EVENT } from '../pages/admin/AdminLenders'
import BrandMark from './BrandMark'
import './Sidebar.css'

// Unset in an environment → the link hides itself.
const CUSTOMER_SITE_URL = import.meta.env.VITE_CUSTOMER_SITE_URL

const NAV_ITEMS = [
  { to: '/dashboard', label: 'Dashboard', icon: 'fa-house' },
  { to: '/soft-pull', label: 'Soft Pull', icon: 'fa-user-check' },
  { to: '/bank-network', label: 'Bank Network', icon: 'fa-shield-halved' },
  { to: '/applications', label: 'Applications', icon: 'fa-file-lines' },
  { to: '/qr-code', label: 'QR Code', icon: 'fa-qrcode' },
]

const ADMIN_ITEMS = [
  { to: '/admin/lenders', label: 'Lender Approvals', icon: 'fa-building-columns', badge: 'pendingLenders' },
  { to: '/admin/dealers', label: 'Dealers', icon: 'fa-users-gear' },
  { to: '/admin/applications', label: 'All Applications', icon: 'fa-folder-open' },
  { to: '/admin/customers', label: 'Customers', icon: 'fa-user-group' },
]

// Pending-lender count for the admin badge; refreshed when the lender queue changes.
function usePendingLenderCount(enabled) {
  const [count, setCount] = useState(0)

  useEffect(() => {
    if (!enabled) return undefined
    let cancelled = false
    const refresh = () =>
      listLenders()
        .then((lenders) => !cancelled && setCount(lenders.filter((l) => l.approval_status === 'pending').length))
        .catch(() => {}) // a missing badge must never break navigation
    refresh()
    window.addEventListener(LENDERS_CHANGED_EVENT, refresh)
    return () => {
      cancelled = true
      window.removeEventListener(LENDERS_CHANGED_EVENT, refresh)
    }
  }, [enabled])

  return count
}

function SidebarLink({ item, badge }) {
  return (
    <NavLink to={item.to} className={({ isActive }) => `sidebar-link${isActive ? ' sidebar-link--active' : ''}`}>
      <i className={`fa-solid ${item.icon}`} aria-hidden="true"></i>
      <span>{item.label}</span>
      {badge > 0 && (
        <span className="sidebar-badge" aria-label={`${badge} pending`}>
          {badge}
        </span>
      )}
    </NavLink>
  )
}

function Sidebar() {
  const { user } = useAuth()
  const isAdmin = Boolean(user?.is_admin)
  const pendingLenders = usePendingLenderCount(isAdmin)

  return (
    <aside className="sidebar">
      <div className="sidebar-brand">
        <BrandMark variant="sidebar" />
      </div>

      <nav className="sidebar-nav">
        {NAV_ITEMS.map((item) => (
          <SidebarLink key={item.to} item={item} />
        ))}
        {isAdmin && (
          <>
            <p className="sidebar-section-label" id="sidebar-admin-label">
              Atoloan Admin
            </p>
            {ADMIN_ITEMS.map((item) => (
              <SidebarLink key={item.to} item={item} badge={item.badge === 'pendingLenders' ? pendingLenders : 0} />
            ))}
          </>
        )}
        {CUSTOMER_SITE_URL && (
          <a
            href={CUSTOMER_SITE_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="sidebar-link sidebar-link--external"
            aria-label="View customer site (opens in a new tab)"
          >
            <i className="fa-solid fa-arrow-up-right-from-square" aria-hidden="true"></i>
            <span>View customer site</span>
          </a>
        )}
      </nav>
    </aside>
  )
}

export default Sidebar
