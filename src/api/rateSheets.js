import { apiFetch } from './client'

export function uploadRateSheet(file) {
  const formData = new FormData()
  formData.append('file', file)
  return apiFetch('/rate-sheets/upload', {
    method: 'POST',
    body: formData,
  })
}

export function confirmRateSheet(rateSheet) {
  return apiFetch('/rate-sheets/confirm', {
    method: 'POST',
    body: JSON.stringify({ rate_sheet: rateSheet }),
  })
}
