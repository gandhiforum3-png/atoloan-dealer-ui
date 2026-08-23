import { test, expect } from '@playwright/test'

// These tests hit the real backend at VITE_API_URL, so the FastAPI server
// (atoloan-dealer-hub-backend) must be running with the dealer below seeded
// — see that repo's scripts/create_dealer_user.py. Override via env vars if
// your local seed data differs.
const TEST_EMAIL = process.env.E2E_DEALER_EMAIL || 'manager@westsideauto.com'
const TEST_PASSWORD = process.env.E2E_DEALER_PASSWORD || 'correct horse battery staple'

test('root redirects to the login page when signed out', async ({ page }) => {
  await page.goto('/')
  await expect(page.getByRole('heading', { name: 'Welcome Back' })).toBeVisible()
})

test('a protected route redirects to login when signed out', async ({ page }) => {
  await page.goto('/soft-pull')
  await expect(page.getByRole('heading', { name: 'Welcome Back' })).toBeVisible()
})

test('signing in with valid credentials reaches the dashboard', async ({ page }) => {
  await page.goto('/login')
  await page.getByPlaceholder('manager@westsideauto.com').fill(TEST_EMAIL)
  await page.getByPlaceholder('••••••••••••').fill(TEST_PASSWORD)
  await page.getByRole('button', { name: 'Sign In to Dashboard' }).click()
  await expect(page.getByRole('heading', { name: 'Hello, Andrew' })).toBeVisible()
})

test('signing in with an invalid password shows an error', async ({ page }) => {
  await page.goto('/login')
  await page.getByPlaceholder('manager@westsideauto.com').fill(TEST_EMAIL)
  await page.getByPlaceholder('••••••••••••').fill('definitely-wrong-password')
  await page.getByRole('button', { name: 'Sign In to Dashboard' }).click()
  await expect(page.getByRole('alert')).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Welcome Back' })).toBeVisible()
})

test('soft pull page renders the applicant form once signed in', async ({ page }) => {
  await page.goto('/login')
  await page.getByPlaceholder('manager@westsideauto.com').fill(TEST_EMAIL)
  await page.getByPlaceholder('••••••••••••').fill(TEST_PASSWORD)
  await page.getByRole('button', { name: 'Sign In to Dashboard' }).click()
  await expect(page.getByRole('heading', { name: 'Hello, Andrew' })).toBeVisible()

  await page.goto('/soft-pull')
  await expect(page.getByRole('heading', { name: 'Run Soft Pull' })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Run Soft Pull Inquiry' })).toBeDisabled()
})
