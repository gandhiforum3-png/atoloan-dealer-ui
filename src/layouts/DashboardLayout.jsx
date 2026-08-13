import { Outlet } from 'react-router-dom'
import Sidebar from '../components/Sidebar'
import Header from '../components/Header'
import { currentUser } from '../data/currentUser'
import './DashboardLayout.css'

function DashboardLayout() {
  return (
    <div className="dashboard-layout">
      <Sidebar />
      <div className="dashboard-layout-main">
        <Header user={currentUser} />
        <div className="dashboard-layout-content">
          <Outlet />
        </div>
      </div>
    </div>
  )
}

export default DashboardLayout
