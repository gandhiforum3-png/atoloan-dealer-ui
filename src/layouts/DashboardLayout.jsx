import { Outlet, useNavigate } from 'react-router-dom'
import Sidebar from '../components/Sidebar'
import Header from '../components/Header'
import { useAuth } from '../context/useAuth'
import './DashboardLayout.css'

function DashboardLayout() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = async () => {
    await logout()
    navigate('/login', { replace: true })
  }

  return (
    <div className="dashboard-layout">
      <Sidebar />
      <div className="dashboard-layout-main">
        <Header user={user} onLogout={handleLogout} />
        <div className="dashboard-layout-content">
          <Outlet />
        </div>
      </div>
    </div>
  )
}

export default DashboardLayout
