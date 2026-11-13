import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import App from '../../src/App'
import { AuthProvider } from '../../src/context/AuthContext'
import { getCurrentUser } from '../../src/api/auth'
import { getAllApplicationsSummary, getLender, listAllApplications, listLenders, setLenderApproval } from '../../src/api/admin'
import { listDealers } from '../../src/api/dealers'
import { getMyApplications, getMyApplicationsSummary } from '../../src/api/applications'

vi.mock('../../src/api/auth', () => ({
  getCurrentUser: vi.fn(),
  login: vi.fn(),
  logout: vi.fn(),
  changePassword: vi.fn(),
}))

// vite.config sets mockReset — implementations are (re)applied in beforeEach
vi.mock('../../src/api/applications', () => ({
  getMyApplications: vi.fn(),
  getMyApplicationsSummary: vi.fn(),
}))

vi.mock('../../src/api/admin', () => ({
  listLenders: vi.fn(),
  getLender: vi.fn(),
  setLenderApproval: vi.fn(),
  rejectLender: vi.fn(),
  listAllApplications: vi.fn(),
  getAllApplicationsSummary: vi.fn(),
}))

vi.mock('../../src/api/dealers', () => ({
  listDealers: vi.fn(),
  createDealer: vi.fn(),
  updateDealer: vi.fn(),
  resetDealerPassword: vi.fn(),
}))

const DEALER = {
  dealer_id: 'DLR-000004',
  email: 'manager@westsideauto.com',
  name: 'Andrew Miller',
  dealership_name: 'Westside Auto Group',
  is_admin: false,
  must_change_password: false,
}
const ADMIN = { ...DEALER, dealer_id: 'DLR-000001', is_admin: true }

const PENDING = { id: 7, name: 'Alpha CU', approval_status: 'pending', submitted_by: { dealer_id: 'DLR-000004', dealership_name: 'Westside Auto Group' }, submitted_at: '2026-10-01T00:00:00Z' }
const APPROVED = { id: 8, name: 'Zeta CU', approval_status: 'approved', submitted_by: null, submitted_at: null }

function renderApp(path) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <AuthProvider>
        <App />
      </AuthProvider>
    </MemoryRouter>
  )
}

describe('admin area', () => {
  beforeEach(() => {
    vi.mocked(listLenders).mockResolvedValue([PENDING, APPROVED])
    vi.mocked(listDealers).mockResolvedValue([])
    vi.mocked(getMyApplications).mockResolvedValue({ applications: [], total: 0 })
    vi.mocked(getMyApplicationsSummary).mockResolvedValue({ total: 7, matched: 3, unmatched: 4, last_7_days: 2 })
  })

  it('hides admin navigation from regular dealers', async () => {
    vi.mocked(getCurrentUser).mockResolvedValue(DEALER)
    renderApp('/dashboard')
    expect(await screen.findByText('Hello, Andrew')).toBeInTheDocument()
    expect(screen.queryByText('Atoloan Admin')).not.toBeInTheDocument()
    expect(listLenders).not.toHaveBeenCalled()
  })

  it('redirects a regular dealer away from admin pages', async () => {
    vi.mocked(getCurrentUser).mockResolvedValue(DEALER)
    renderApp('/admin/lenders')
    expect(await screen.findByText('Hello, Andrew')).toBeInTheDocument()
  })

  it('shows admins the admin section with a pending-lender count', async () => {
    vi.mocked(getCurrentUser).mockResolvedValue(ADMIN)
    renderApp('/dashboard')
    expect(await screen.findByText('Atoloan Admin')).toBeInTheDocument()
    expect(await screen.findByLabelText('1 pending')).toBeInTheDocument()
    expect(await screen.findByText(/1 lender awaiting approval/)).toBeInTheDocument()
  })

  it('dashboard stats come from the server-side summary', async () => {
    vi.mocked(getCurrentUser).mockResolvedValue(DEALER)
    renderApp('/dashboard')
    expect(await screen.findByText('7')).toBeInTheDocument()
  })

  it('lists pending lenders first and approves from the review dialog', async () => {
    const user = userEvent.setup()
    vi.mocked(getCurrentUser).mockResolvedValue(ADMIN)
    vi.mocked(getLender).mockResolvedValue({ ...PENDING, rate_sheet: { credit_union_info: { name: 'Alpha CU' }, loan_programs: [] } })
    vi.mocked(setLenderApproval).mockResolvedValue({ ...PENDING, approval_status: 'approved' })
    renderApp('/admin/lenders')

    // Default filter is the work queue: only the pending lender
    const table = await screen.findByRole('table')
    expect(within(table).getByText('Alpha CU')).toBeInTheDocument()
    expect(within(table).queryByText('Zeta CU')).not.toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Review Alpha CU' }))
    const dialog = await screen.findByRole('dialog', { name: 'Alpha CU' })
    await user.click(await within(dialog).findByRole('button', { name: 'Approve lender' }))

    expect(setLenderApproval).toHaveBeenCalledWith(7, 'approved')
    expect(await screen.findByRole('status')).toHaveTextContent('Alpha CU is approved')
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('requires an explicit confirmation before rejecting', async () => {
    const user = userEvent.setup()
    vi.mocked(getCurrentUser).mockResolvedValue(ADMIN)
    vi.mocked(getLender).mockResolvedValue({ ...PENDING, rate_sheet: {} })
    renderApp('/admin/lenders')

    await user.click(await screen.findByRole('button', { name: 'Review Alpha CU' }))
    const dialog = await screen.findByRole('dialog')
    await user.click(await within(dialog).findByRole('button', { name: 'Reject…' }))
    expect(within(dialog).getByRole('button', { name: 'Reject and remove' })).toBeInTheDocument()
    expect(within(dialog).getByText(/permanently remove/)).toBeInTheDocument()
  })

  it('searches customers on submit, not per keystroke', async () => {
    vi.mocked(getCurrentUser).mockResolvedValue(ADMIN)
    vi.mocked(listAllApplications).mockResolvedValue({ applications: [], total: 0 })
    vi.mocked(getAllApplicationsSummary).mockResolvedValue({ total: 0, matched: 0, unmatched: 0, last_7_days: 0 })
    const user = userEvent.setup()
    renderApp('/admin/applications')

    const box = await screen.findByLabelText('Customer')
    await user.type(box, 'jane@example.com')
    expect(listAllApplications).not.toHaveBeenCalledWith(expect.objectContaining({ search: 'jane@example.com' }))

    await user.click(screen.getByRole('button', { name: 'Search' }))
    expect(listAllApplications).toHaveBeenLastCalledWith(expect.objectContaining({ search: 'jane@example.com', offset: 0 }))
    expect(getAllApplicationsSummary).toHaveBeenLastCalledWith({ dealerId: '', search: 'jane@example.com' })
    expect(await screen.findByText(/No customer matches/)).toBeInTheDocument()
  })
})
