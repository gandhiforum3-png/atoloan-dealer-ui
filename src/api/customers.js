import { apiFetch } from './client'

// Accounts are addressed by numeric id — emails never go in URLs (access logs)
const customerPath = (id) => `/admin/customers/${encodeURIComponent(id)}`

// `search` matches any part of a customer's name, email or phone
export function listCustomers({ search, limit = 25, offset = 0 } = {}) {
  const params = new URLSearchParams({ limit, offset })
  if (search) params.set('q', search)
  return apiFetch(`/admin/customers?${params}`)
}

export function getCustomer(id) {
  return apiFetch(customerPath(id))
}

export function updateCustomer(id, fields) {
  return apiFetch(customerPath(id), { method: 'PATCH', body: JSON.stringify(fields) })
}

export function setCustomerStatus(id, status) {
  return apiFetch(`${customerPath(id)}/status`, { method: 'POST', body: JSON.stringify({ status }) })
}

export function closeCustomer(id) {
  return apiFetch(`${customerPath(id)}/close`, { method: 'POST' })
}
