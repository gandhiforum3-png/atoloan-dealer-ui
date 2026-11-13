import { apiFetch } from './client'

export function listLenders() {
  return apiFetch('/admin/lenders')
}

export function getLender(bankId) {
  return apiFetch(`/admin/lenders/${bankId}`)
}

export function setLenderApproval(bankId, status) {
  return apiFetch(`/admin/lenders/${bankId}/approval`, {
    method: 'POST',
    body: JSON.stringify({ status }),
  })
}

export function rejectLender(bankId) {
  return apiFetch(`/admin/lenders/${bankId}`, { method: 'DELETE' })
}

function query(params) {
  const search = new URLSearchParams(Object.entries(params).filter(([, value]) => value !== undefined && value !== ''))
  return search.toString() ? `?${search}` : ''
}

// `search` finds a customer by any part of their name, email or phone
export function listAllApplications({ dealerId, search, limit, offset } = {}) {
  return apiFetch(`/admin/applications${query({ dealer_id: dealerId, q: search, limit, offset })}`)
}

export function getAllApplicationsSummary({ dealerId, search } = {}) {
  return apiFetch(`/admin/applications/summary${query({ dealer_id: dealerId, q: search })}`)
}
