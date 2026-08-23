import { apiFetch, ApiError } from './client'

export async function getMyQrCode() {
  try {
    return await apiFetch('/qr-codes/me')
  } catch (err) {
    if (err instanceof ApiError && err.status === 404) return null
    throw err
  }
}

export function generateQrCode(label) {
  return apiFetch('/qr-codes', {
    method: 'POST',
    body: JSON.stringify({ label }),
  })
}

export function updateQrCodeLabel(label) {
  return apiFetch('/qr-codes/me', {
    method: 'PATCH',
    body: JSON.stringify({ label }),
  })
}
