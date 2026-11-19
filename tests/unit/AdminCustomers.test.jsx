import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import App from '../../src/App'
import { AuthProvider } from '../../src/context/AuthContext'
import { getCurrentUser } from '../../src/api/auth'
import { listLenders } from '../../src/api/admin'
import { closeCustomer, getCustomer, listCustomers, setCustomerStatus, updateCustomer } from '../../src/api/customers'

vi.mock('../../src/api/auth', () => ({ getCurrentUser: vi.fn(), login: vi.fn(), logout: vi.fn(), changePassword: vi.fn() }))
vi.mock('../../src/api/applications', () => ({ getMyApplications: vi.fn(), getMyApplicationsSummary: vi.fn() }))
vi.mock('../../src/api/admin', () => ({
  listLenders: vi.fn(), getLender: vi.fn(), setLenderApproval: vi.fn(), rejectLender: vi.fn(),
  listAllApplications: vi.fn(), getAllApplicationsSummary: vi.fn(),
}))
vi.mock('../../src/api/customers', () => ({
  listCustomers: vi.fn(), getCustomer: vi.fn(), updateCustomer: vi.fn(), setCustomerStatus: vi.fn(), closeCustomer: vi.fn(),
}))

const ADMIN = { dealer_id: 'DLR-000001', email: 'admin@atoloans.com', name: 'Ana', dealership_name: 'ATO', is_admin: true, must_change_password: false }
const JANE = {
  id: 7, email: 'jane@example.com', first_name: 'Jane', last_name: 'Doe', phone_number: '4155550100', status: 'active',
  created_at: '2026-09-01T12:00:00Z', last_login_at: '2026-10-05T12:00:00Z', active_sessions: 1, applications: 1,
}
const JANE_DETAIL = {
  ...JANE, address: '1 Main St', city: 'San Francisco', state: 'CA', zipcode: '94102',
  applications: [{
    id: 7, created_at: '2026-10-01T15:00:00Z', status: 'matched', bank_name: 'Alpha CU', interest_rate: '5.49%',
    term_in_months: 60, program_name: 'Used', documents: { drivers_license: true, paycheck: false },
  }],
}

function renderPage() {
  return render(
    <MemoryRouter initialEntries={['/admin/customers']}>
      <AuthProvider>
        <App />
      </AuthProvider>
    </MemoryRouter>
  )
}

async function openJane(user) {
  await user.click(await screen.findByRole('button', { name: 'View Jane Doe' }))
  return screen.findByRole('dialog', { name: 'Jane Doe' })
}

describe('admin customers', () => {
  beforeEach(() => {
    vi.mocked(getCurrentUser).mockResolvedValue(ADMIN)
    vi.mocked(listLenders).mockResolvedValue([])
    vi.mocked(listCustomers).mockResolvedValue({ customers: [JANE], total: 1 })
    vi.mocked(getCustomer).mockResolvedValue(JANE_DETAIL)
  })

  it('lists customers with status and last sign-in', async () => {
    renderPage()
    const row = (await screen.findByText('Jane Doe')).closest('tr')
    expect(within(row).getByText('jane@example.com')).toBeInTheDocument()
    expect(within(row).getByText('Active')).toBeInTheDocument()
    expect(within(row).getByText(new Date(JANE.last_login_at).toLocaleDateString(undefined, { dateStyle: 'medium' }))).toBeInTheDocument()
  })

  it('searches on submit', async () => {
    const user = userEvent.setup()
    renderPage()
    await screen.findByText('Jane Doe')
    await user.type(screen.getByLabelText('Search customers'), 'jane{Enter}')
    expect(listCustomers).toHaveBeenLastCalledWith(expect.objectContaining({ search: 'jane', offset: 0 }))
  })

  it('shows activity and applications in the detail view', async () => {
    const user = userEvent.setup()
    renderPage()
    const dialog = await openJane(user)
    expect(await within(dialog).findByText('Alpha CU')).toBeInTheDocument()
    expect(within(dialog).getByText('1 active session')).toBeInTheDocument()
    expect(within(dialog).getByText('1 of 2 documents')).toBeInTheDocument()
    expect(getCustomer).toHaveBeenCalledWith(7)
  })

  it('disables after confirmation and updates the row', async () => {
    vi.mocked(setCustomerStatus).mockResolvedValue({ email: JANE.email, status: 'disabled' })
    const user = userEvent.setup()
    renderPage()
    const dialog = await openJane(user)

    await user.click(await within(dialog).findByRole('button', { name: 'Disable sign-in' }))
    const confirm = await screen.findByRole('dialog', { name: 'Disable customer' })
    await user.click(within(confirm).getByRole('button', { name: 'Disable' }))

    expect(setCustomerStatus).toHaveBeenCalledWith(7, 'disabled')
    const row = (await screen.findByText('Jane Doe')).closest('tr')
    expect(await within(row).findByText('Disabled')).toBeInTheDocument()
  })

  it('closes only after the email is typed back', async () => {
    vi.mocked(closeCustomer).mockResolvedValue({ status: 'closed' })
    const user = userEvent.setup()
    renderPage()
    const dialog = await openJane(user)

    await user.click(await within(dialog).findByRole('button', { name: 'Close account' }))
    const confirm = await screen.findByRole('dialog', { name: 'Close customer account' })
    const button = within(confirm).getByRole('button', { name: 'Close account' })
    expect(button).toBeDisabled()
    await user.type(within(confirm).getByLabelText(/Type the customer's email/), 'Jane@Example.com')
    await user.click(button)

    expect(closeCustomer).toHaveBeenCalledWith(7)
    expect(screen.queryByText('Jane Doe')).not.toBeInTheDocument()
  })

  it('edits contact details with normalised values', async () => {
    vi.mocked(updateCustomer).mockResolvedValue({ ...JANE_DETAIL, phone_number: '4155550199', applications: undefined })
    const user = userEvent.setup()
    renderPage()
    const dialog = await openJane(user)

    await user.click(await within(dialog).findByRole('button', { name: 'Edit details' }))
    const form = await screen.findByRole('dialog', { name: 'Edit customer details' })
    const phone = within(form).getByLabelText('Phone')
    await user.clear(phone)
    await user.type(phone, '(415) 555-0199')
    const zip = within(form).getByLabelText('ZIP code')
    await user.clear(zip)
    await user.type(zip, '941')
    await user.click(within(form).getByRole('button', { name: 'Save changes' }))
    expect(within(form).getByText('Enter a 5-digit ZIP code.')).toBeInTheDocument()
    expect(updateCustomer).not.toHaveBeenCalled()

    await user.type(zip, '10')
    await user.click(within(form).getByRole('button', { name: 'Save changes' }))
    expect(updateCustomer).toHaveBeenCalledWith(7, { phone_number: '4155550199', zipcode: '94110' }) // only what was edited
  })

  it('edits around legacy values the admin did not touch', async () => {
    vi.mocked(getCustomer).mockResolvedValue({ ...JANE_DETAIL, state: 'California', zipcode: '94102-1234' })
    vi.mocked(updateCustomer).mockResolvedValue({ ...JANE_DETAIL, phone_number: '4155550123' })
    const user = userEvent.setup()
    renderPage()
    const dialog = await openJane(user)
    await within(dialog).findByText('Alpha CU') // detail (with legacy values) loaded

    await user.click(within(dialog).getByRole('button', { name: 'Edit details' }))
    const form = await screen.findByRole('dialog', { name: 'Edit customer details' })
    const phone = within(form).getByLabelText('Phone')
    await user.clear(phone)
    await user.type(phone, '415-555-0123')
    await user.click(within(form).getByRole('button', { name: 'Save changes' }))

    expect(updateCustomer).toHaveBeenCalledWith(7, { phone_number: '4155550123' })
  })

  it('retries a failed load when Search is pressed again', async () => {
    vi.mocked(listCustomers)
      .mockRejectedValueOnce(new Error('offline'))
      .mockResolvedValue({ customers: [JANE], total: 1 })
    const user = userEvent.setup()
    renderPage()

    expect(await screen.findByText(/Couldn.t load customers/)).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Search' }))

    expect(await screen.findByText('Jane Doe')).toBeInTheDocument()
  })

  it('appears in the admin sidebar', async () => {
    renderPage()
    expect(await screen.findByRole('link', { name: /Customers/ })).toHaveAttribute('href', '/admin/customers')
  })
})
