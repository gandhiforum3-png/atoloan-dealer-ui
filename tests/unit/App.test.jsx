import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import App from '../../src/App'
import { AuthProvider } from '../../src/context/AuthContext'
import { getCurrentUser } from '../../src/api/auth'

vi.mock('../../src/api/auth', () => ({
  getCurrentUser: vi.fn(),
  login: vi.fn(),
  logout: vi.fn(),
}))

const MOCK_USER = {
  dealer_id: 'DLR-000004',
  email: 'manager@westsideauto.com',
  name: 'Andrew Miller',
  dealership_name: 'Westside Auto Group',
}

function renderApp(initialEntries) {
  return render(
    <MemoryRouter initialEntries={initialEntries}>
      <AuthProvider>
        <App />
      </AuthProvider>
    </MemoryRouter>
  )
}

describe('App', () => {
  beforeEach(() => {
    vi.mocked(getCurrentUser).mockReset()
  })

  it('redirects the root route to the login page', async () => {
    vi.mocked(getCurrentUser).mockRejectedValue(new Error('not authenticated'))
    renderApp(['/'])
    expect(await screen.findByText('Welcome Back')).toBeInTheDocument()
  })

  it('redirects a protected route to login when signed out', async () => {
    vi.mocked(getCurrentUser).mockRejectedValue(new Error('not authenticated'))
    renderApp(['/dashboard'])
    expect(await screen.findByText('Welcome Back')).toBeInTheDocument()
  })

  it('renders the dashboard for an authenticated session', async () => {
    vi.mocked(getCurrentUser).mockResolvedValue(MOCK_USER)
    renderApp(['/dashboard'])
    expect(await screen.findByText('Hello, Andrew')).toBeInTheDocument()
  })

  it('renders the soft pull form for an authenticated session', async () => {
    vi.mocked(getCurrentUser).mockResolvedValue(MOCK_USER)
    renderApp(['/soft-pull'])
    expect(await screen.findByText('Run Soft Pull')).toBeInTheDocument()
  })
})
