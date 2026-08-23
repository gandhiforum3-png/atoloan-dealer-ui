import { apiFetch } from './client'

export function submitSoftPull(payload) {
  return apiFetch('/soft-pull', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}
