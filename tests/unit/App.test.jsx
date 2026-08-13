import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import App from '../../src/App'

describe('App', () => {
  it('redirects the root route to the login page', () => {
    render(
      <MemoryRouter initialEntries={['/']}>
        <App />
      </MemoryRouter>
    )
    expect(screen.getByText('Welcome Back')).toBeInTheDocument()
  })

  it('renders the dashboard for an authenticated route', () => {
    render(
      <MemoryRouter initialEntries={['/dashboard']}>
        <App />
      </MemoryRouter>
    )
    expect(screen.getByText('Hello, Andrew')).toBeInTheDocument()
  })

  it('renders the soft pull form', () => {
    render(
      <MemoryRouter initialEntries={['/soft-pull']}>
        <App />
      </MemoryRouter>
    )
    expect(screen.getByText('Run Soft Pull')).toBeInTheDocument()
  })
})
