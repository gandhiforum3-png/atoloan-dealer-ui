import { apiFetch } from './client'

export function uploadRateSheet(file) {
  const formData = new FormData()
  formData.append('file', file)
  return apiFetch('/rate-sheets/upload', {
    method: 'POST',
    body: formData,
  })
}
