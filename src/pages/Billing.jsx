import { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  cancelSubscription,
  getBillingHistory,
  getCurrentPlan,
  getPaymentMethods,
  getPlans,
  removePaymentMethod,
  setDefaultPaymentMethod,
} from '../api/billing'
import { ApiError } from '../api/client'
import StatusBadge from '../components/StatusBadge'
import './Billing.css'

const SUBSCRIPTION_STATUS_LABELS = {
  active: 'Active',
  past_due: 'Past Due',
  canceled: 'Canceled',
}

const PAYMENT_STATUS_LABELS = {
  succeeded: 'Paid',
  failed: 'Failed',
  refunded: 'Refunded',
}

const BRAND_ICONS = {
  visa: 'fa-cc-visa',
  mastercard: 'fa-cc-mastercard',
  amex: 'fa-cc-amex',
  discover: 'fa-cc-discover',
}

function friendlyError(err) {
  return err instanceof ApiError ? err.message : 'Unable to reach the server. Is the backend running?'
}

function formatCurrency(cents) {
  return (cents / 100).toLocaleString('en-US', { style: 'currency', currency: 'USD' })
}

function formatDate(value) {
  return new Date(value).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
}

function Billing() {
  const navigate = useNavigate()

  const [plan, setPlan] = useState(null)
  const [plans, setPlans] = useState([])
  const [paymentMethods, setPaymentMethods] = useState([])
  const [history, setHistory] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [actionError, setActionError] = useState(null)
  const [busyId, setBusyId] = useState(null)

  const loadAll = useCallback(async () => {
    const [currentPlan, planList, methods, payments] = await Promise.all([
      getCurrentPlan(),
      getPlans(),
      getPaymentMethods(),
      getBillingHistory(),
    ])
    setPlan(currentPlan)
    setPlans(planList)
    setPaymentMethods(methods)
    setHistory(payments)
  }, [])

  useEffect(() => {
    let cancelled = false

    Promise.all([getCurrentPlan(), getPlans(), getPaymentMethods(), getBillingHistory()])
      .then(([currentPlan, planList, methods, payments]) => {
        if (cancelled) return
        setPlan(currentPlan)
        setPlans(planList)
        setPaymentMethods(methods)
        setHistory(payments)
      })
      .catch((err) => {
        if (!cancelled) setError(friendlyError(err))
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [])

  const goToCheckout = (mode, prefillPlanId) => {
    navigate('/billing/checkout', { state: { mode, prefillPlanId } })
  }

  const handleSetDefault = async (paymentMethodId) => {
    setBusyId(paymentMethodId)
    setActionError(null)
    try {
      await setDefaultPaymentMethod(paymentMethodId)
      await loadAll()
    } catch (err) {
      setActionError(friendlyError(err))
    } finally {
      setBusyId(null)
    }
  }

  const handleRemove = async (paymentMethodId) => {
    setBusyId(paymentMethodId)
    setActionError(null)
    try {
      await removePaymentMethod(paymentMethodId)
      await loadAll()
    } catch (err) {
      setActionError(friendlyError(err))
    } finally {
      setBusyId(null)
    }
  }

  const handleCancelSubscription = async () => {
    setBusyId('cancel-subscription')
    setActionError(null)
    try {
      await cancelSubscription(false)
      await loadAll()
    } catch (err) {
      setActionError(friendlyError(err))
    } finally {
      setBusyId(null)
    }
  }

  if (loading) {
    return <p className="qr-code-note">Loading billing…</p>
  }

  if (error) {
    return (
      <div className="card empty-state" style={{ padding: 40 }}>
        <span className="empty-state-icon">
          <i className="fa-solid fa-triangle-exclamation" aria-hidden="true"></i>
        </span>
        <h3>Couldn&apos;t load billing</h3>
        <p>{error}</p>
      </div>
    )
  }

  const subscription = plan?.subscription
  const matchedPlan = subscription && plans.find((p) => p.id === subscription.plan_id)
  const priceCents =
    matchedPlan && (subscription.billing_cycle === 'annual' ? matchedPlan.annual_price_cents : matchedPlan.monthly_price_cents)

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Billing &amp; Subscription</h1>
          <p>Manage your dealership&apos;s plan, saved cards, and payment history.</p>
        </div>
      </div>

      {actionError && (
        <p className="login-error" role="alert" style={{ marginBottom: 16 }}>
          {actionError}
        </p>
      )}

      <div className="billing-dash-grid">
        <div className="card billing-card">
          <div className="billing-card-header">
            <h2>Current Plan</h2>
            {subscription && (
              <StatusBadge status={subscription.cancel_at_period_end ? 'Canceling' : SUBSCRIPTION_STATUS_LABELS[subscription.status] ?? subscription.status} />
            )}
          </div>

          {subscription ? (
            <>
              <div className="billing-plan-amount">
                <span className="billing-plan-name">{subscription.plan_name}</span>
                {priceCents != null && (
                  <span className="billing-amount">
                    {formatCurrency(priceCents)}
                    <small>/{subscription.billing_cycle === 'annual' ? 'yr' : 'mo'}</small>
                  </span>
                )}
              </div>
              <p className="billing-meta-line">
                {subscription.cancel_at_period_end ? 'Cancels' : 'Renews'} {formatDate(subscription.current_period_end)}
              </p>
              <div className="billing-card-actions">
                <button className="text-link billing-text-btn" onClick={() => goToCheckout('subscription', subscription.plan_id)}>
                  Change Plan
                </button>
                {!subscription.cancel_at_period_end && (
                  <button
                    className="text-link billing-text-btn billing-text-btn--danger"
                    onClick={handleCancelSubscription}
                    disabled={busyId === 'cancel-subscription'}
                  >
                    {busyId === 'cancel-subscription' ? 'Canceling…' : 'Cancel Subscription'}
                  </button>
                )}
              </div>
            </>
          ) : (
            <>
              <p className="billing-meta-line">You&apos;re on pay-as-you-go — {plan.credit_balance} soft-pull credit{plan.credit_balance === 1 ? '' : 's'} remaining.</p>
              <div className="billing-card-actions">
                <button className="btn btn-primary" onClick={() => goToCheckout('subscription')}>
                  Subscribe to a Plan
                </button>
                <button className="btn btn-secondary" onClick={() => goToCheckout('one_time')}>
                  Buy Credits
                </button>
              </div>
            </>
          )}
        </div>

        <div className="card billing-card">
          <div className="billing-card-header">
            <h2>Payment Methods</h2>
          </div>

          {paymentMethods.length === 0 ? (
            <p className="billing-meta-line">No cards saved yet.</p>
          ) : (
            <ul className="billing-pm-list">
              {paymentMethods.map((pm) => (
                <li key={pm.id} className="billing-pm-row">
                  <div className="billing-pm-main">
                    <i
                      className={BRAND_ICONS[pm.brand] ? `fa-brands ${BRAND_ICONS[pm.brand]}` : 'fa-solid fa-credit-card'}
                      aria-hidden="true"
                    ></i>
                    <div>
                      <p className="billing-pm-name">
                        {pm.brand.charAt(0).toUpperCase() + pm.brand.slice(1)} •••• {pm.last4}
                      </p>
                      <p className="billing-pm-sub">
                        Expires {String(pm.exp_month).padStart(2, '0')}/{String(pm.exp_year).slice(-2)}
                      </p>
                    </div>
                  </div>
                  <div className="billing-pm-actions">
                    {pm.is_default ? (
                      <span className="billing-tag">Default</span>
                    ) : (
                      <button
                        className="text-link billing-text-btn"
                        onClick={() => handleSetDefault(pm.id)}
                        disabled={busyId === pm.id}
                      >
                        Set Default
                      </button>
                    )}
                    <button
                      className="text-link billing-text-btn billing-text-btn--danger"
                      onClick={() => handleRemove(pm.id)}
                      disabled={busyId === pm.id}
                    >
                      Remove
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}

          <button className="btn btn-secondary btn-block" style={{ marginTop: 16 }} onClick={() => goToCheckout('add_card')}>
            <i className="fa-solid fa-plus" aria-hidden="true"></i>
            Add Payment Method
          </button>
        </div>
      </div>

      <div className="card billing-card billing-history-card">
        <div className="billing-card-header">
          <h2>Payment History</h2>
        </div>

        {history.length === 0 ? (
          <div className="empty-state">
            <span className="empty-state-icon">
              <i className="fa-solid fa-receipt" aria-hidden="true"></i>
            </span>
            <h3>No Payments Yet</h3>
            <p>Your subscription charges and credit purchases will appear here.</p>
          </div>
        ) : (
          <div className="billing-history-wrap">
            <table className="billing-history-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Description</th>
                  <th>Amount</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {history.map((payment) => (
                  <tr key={payment.id}>
                    <td>{formatDate(payment.created_at)}</td>
                    <td>{payment.description}</td>
                    <td className="billing-history-amount">{formatCurrency(payment.amount_cents)}</td>
                    <td>
                      <StatusBadge status={PAYMENT_STATUS_LABELS[payment.status] ?? payment.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}

export default Billing
