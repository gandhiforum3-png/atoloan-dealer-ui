import { apiFetch } from './client'

export function getMyApplications() {
  return apiFetch('/applications')
}
