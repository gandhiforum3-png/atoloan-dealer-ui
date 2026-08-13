import { Routes, Route, Navigate } from 'react-router-dom'
import DashboardLayout from './layouts/DashboardLayout'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import SoftPull from './pages/SoftPull'
import BankNetwork from './pages/BankNetwork'
import Applications from './pages/Applications'
import QRCode from './pages/QRCode'
import Settings from './pages/Settings'

function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="/login" element={<Login />} />

      <Route element={<DashboardLayout />}>
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/soft-pull" element={<SoftPull />} />
        <Route path="/bank-network" element={<BankNetwork />} />
        <Route path="/applications" element={<Applications />} />
        <Route path="/qr-code" element={<QRCode />} />
        <Route path="/settings" element={<Settings />} />
      </Route>

      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  )
}

export default App
