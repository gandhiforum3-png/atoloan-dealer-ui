import { apiFetch } from './client'

export function getBanks() {
  return apiFetch('/banks')
}

export function getMyBankNetwork() {
  return apiFetch('/banks/network')
}

export function saveMyBankNetwork(bankIds) {
  return apiFetch('/banks/network', {
    method: 'POST',
    body: JSON.stringify({ bank_ids: bankIds }),
  })
}
