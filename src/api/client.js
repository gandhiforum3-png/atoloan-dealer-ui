const API_BASE_URL = import.meta.env.VITE_API_URL ?? ''

export class ApiError extends Error {
  constructor(message, status) {
    super(message)
    this.name = 'ApiError'
    this.status = status
  }
}

export async function apiFetch(path, { headers, ...rest } = {}) {
  // Let the browser set the multipart boundary itself for FormData bodies —
  // forcing Content-Type: application/json here would break file uploads.
  const isFormData = typeof FormData !== 'undefined' && rest.body instanceof FormData

  const response = await fetch(`${API_BASE_URL}${path}`, {
    credentials: 'include',
    headers: isFormData ? { ...headers } : { 'Content-Type': 'application/json', ...headers },
    ...rest,
  })

  if (response.status === 204) return null

  const data = await response.json().catch(() => null)

  if (!response.ok) {
    const message = typeof data?.detail === 'string' ? data.detail : `Request failed (${response.status})`
    throw new ApiError(message, response.status)
  }

  return data
}
