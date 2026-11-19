import { apiFetch } from './client'

export function listDealers(q) {
  const query = q ? `?q=${encodeURIComponent(q)}` : ''
  return apiFetch(`/admin/dealers${query}`)
}

export function createDealer(payload) {
  return apiFetch('/admin/dealers', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export function updateDealer(dealerId, payload) {
  return apiFetch(`/admin/dealers/${dealerId}`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  })
}

export function resetDealerPassword(dealerId) {
  return apiFetch(`/admin/dealers/${dealerId}/reset-password`, {
    method: 'POST',
  })
}
