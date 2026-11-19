import { apiFetch } from './client'

export function getPlans() {
  return apiFetch('/billing/plans')
}

export function getCreditPacks() {
  return apiFetch('/billing/credit-packs')
}

export function getCurrentPlan() {
  return apiFetch('/billing/plan')
}

export function createSetupIntent() {
  return apiFetch('/billing/setup-intents', { method: 'POST' })
}

export function addPaymentMethod(setupIntentId, card, setDefault) {
  return apiFetch('/billing/payment-methods', {
    method: 'POST',
    body: JSON.stringify({ setup_intent_id: setupIntentId, card, set_default: setDefault }),
  })
}

export function getPaymentMethods() {
  return apiFetch('/billing/payment-methods')
}

export function setDefaultPaymentMethod(paymentMethodId) {
  return apiFetch(`/billing/payment-methods/${paymentMethodId}/default`, { method: 'POST' })
}

export function removePaymentMethod(paymentMethodId) {
  return apiFetch(`/billing/payment-methods/${paymentMethodId}`, { method: 'DELETE' })
}

export function subscribe(planId, billingCycle, paymentMethodId) {
  return apiFetch('/billing/subscriptions', {
    method: 'POST',
    body: JSON.stringify({ plan_id: planId, billing_cycle: billingCycle, payment_method_id: paymentMethodId }),
  })
}

export function cancelSubscription(cancelImmediately = false) {
  return apiFetch('/billing/subscriptions/cancel', {
    method: 'POST',
    body: JSON.stringify({ cancel_immediately: cancelImmediately }),
  })
}

export function chargeOneTime(creditPackId, paymentMethodId) {
  return apiFetch('/billing/charges', {
    method: 'POST',
    body: JSON.stringify({ credit_pack_id: creditPackId, payment_method_id: paymentMethodId }),
  })
}

export function getBillingHistory() {
  return apiFetch('/billing/history')
}
