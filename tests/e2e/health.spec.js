import { test, expect } from '@playwright/test'

test('root redirects to the login page', async ({ page }) => {
  await page.goto('/')
  await expect(page.getByRole('heading', { name: 'Welcome Back' })).toBeVisible()
})

test('signing in navigates to the dashboard', async ({ page }) => {
  await page.goto('/login')
  await page.getByPlaceholder('manager@westsideauto.com').fill('manager@westsideauto.com')
  await page.getByPlaceholder('••••••••••••').fill('password123')
  await page.getByRole('button', { name: 'Sign In to Dashboard' }).click()
  await expect(page.getByRole('heading', { name: 'Hello, Andrew' })).toBeVisible()
})

test('soft pull page renders the applicant form', async ({ page }) => {
  await page.goto('/soft-pull')
  await expect(page.getByRole('heading', { name: 'Run Soft Pull' })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Run Soft Pull Inquiry' })).toBeDisabled()
})
