import { apiFetch } from './client'

// → { applications: [...], total }
export function getMyApplications({ limit = 50, offset = 0 } = {}) {
  return apiFetch(`/applications?limit=${limit}&offset=${offset}`)
}

// → { total, matched, unmatched, last_7_days } over all of the dealer's applications
export function getMyApplicationsSummary() {
  return apiFetch('/applications/summary')
}
