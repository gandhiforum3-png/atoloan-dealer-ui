import { ApiError } from '../api/client'

export function friendlyError(err) {
  return err instanceof ApiError ? err.message : 'Unable to reach the server. Is the backend running?'
}

export function formatDate(value) {
  return value ? new Date(value).toLocaleDateString(undefined, { dateStyle: 'medium' }) : '—'
}

export function formatDateTime(value) {
  return value ? new Date(value).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' }) : '—'
}

export const currencyFormatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 0,
})

export function customerName(customer) {
  return `${customer.first_name || ''} ${customer.last_name || ''}`.trim() || customer.email
}
