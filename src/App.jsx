import { Routes, Route, Navigate, Outlet } from 'react-router-dom'
import DashboardLayout from './layouts/DashboardLayout'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import SoftPull from './pages/SoftPull'
import BankNetwork from './pages/BankNetwork'
import Applications from './pages/Applications'
import QRCode from './pages/QRCode'
import ChangePassword from './pages/ChangePassword'
import Dealers from './pages/Dealers'
import AdminLenders from './pages/admin/AdminLenders'
import AdminApplications from './pages/admin/AdminApplications'
import AdminCustomers from './pages/admin/AdminCustomers'
import { useAuth } from './context/useAuth'

function RequireAuth() {
  const { status, user } = useAuth()

  if (status === 'loading') {
    return <div className="app-loading">Loading…</div>
  }

  if (status === 'anonymous') {
    return <Navigate to="/login" replace />
  }

  if (user?.must_change_password) {
    return <ChangePassword />
  }

  return <Outlet />
}

// Admin rights are enforced by the API on every request; this only keeps
// non-admins from landing on pages that would just show 403s.
function RequireAdmin() {
  const { user } = useAuth()
  return user?.is_admin ? <Outlet /> : <Navigate to="/dashboard" replace />
}

function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="/login" element={<Login />} />

      <Route element={<RequireAuth />}>
        <Route element={<DashboardLayout />}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/soft-pull" element={<SoftPull />} />
          <Route path="/bank-network" element={<BankNetwork />} />
          <Route path="/applications" element={<Applications />} />
          <Route path="/qr-code" element={<QRCode />} />
          <Route element={<RequireAdmin />}>
            <Route path="/admin/lenders" element={<AdminLenders />} />
            <Route path="/admin/dealers" element={<Dealers />} />
            <Route path="/admin/applications" element={<AdminApplications />} />
            <Route path="/admin/customers" element={<AdminCustomers />} />
          </Route>
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  )
}

export default App
