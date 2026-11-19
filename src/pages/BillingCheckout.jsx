import { useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import {
  addPaymentMethod,
  chargeOneTime,
  createSetupIntent,
  getCreditPacks,
  getPaymentMethods,
  getPlans,
  subscribe,
} from '../api/billing'
import { ApiError } from '../api/client'
import { useAuth } from '../context/useAuth'
import './BillingCheckout.css'

const MODE_TITLES = {
  subscription: 'Set up billing',
  one_time: 'Buy soft-pull credits',
  add_card: 'Add a payment method',
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

const EMPTY_CARD = { cardholderName: '', cardNumber: '', expMonth: '', expYear: '', cvc: '', billingZip: '' }

function BillingCheckout() {
  const navigate = useNavigate()
  const location = useLocation()
  const { user } = useAuth()

  const mode = location.state?.mode ?? 'subscription'
  const prefillPlanId = location.state?.prefillPlanId

  const [step, setStep] = useState(mode === 'add_card' ? 'payment' : 'plan')
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState(null)

  const [plans, setPlans] = useState([])
  const [creditPacks, setCreditPacks] = useState([])
  const [savedCards, setSavedCards] = useState([])

  const [billingCycle, setBillingCycle] = useState('monthly')
  const [selectedPlanId, setSelectedPlanId] = useState(prefillPlanId ?? 'multi-lot')
  const [selectedPackId, setSelectedPackId] = useState('pack-50')

  const [selectedPaymentMethodId, setSelectedPaymentMethodId] = useState(null)
  const [useNewCard, setUseNewCard] = useState(false)
  const [card, setCard] = useState(EMPTY_CARD)
  const [saveCard, setSaveCard] = useState(true)

  const [agree, setAgree] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState(null)
  const [result, setResult] = useState(null)

  useEffect(() => {
    let cancelled = false
    Promise.all([getPlans(), getCreditPacks(), getPaymentMethods()])
      .then(([planList, packList, cards]) => {
        if (cancelled) return
        setPlans(planList)
        setCreditPacks(packList)
        setSavedCards(cards)
        const defaultCard = cards.find((c) => c.is_default) ?? cards[0]
        if (defaultCard) {
          setSelectedPaymentMethodId(defaultCard.id)
        } else {
          setUseNewCard(true)
        }
      })
      .catch((err) => {
        if (!cancelled) setLoadError(friendlyError(err))
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [])

  const selectedPlan = plans.find((p) => p.id === selectedPlanId)
  const selectedPack = creditPacks.find((p) => p.id === selectedPackId)
  const selectedCard = savedCards.find((c) => c.id === selectedPaymentMethodId)

  const planPriceCents = selectedPlan && (billingCycle === 'annual' ? selectedPlan.annual_price_cents : selectedPlan.monthly_price_cents)

  const updateCardField = (field) => (event) => {
    setCard((prev) => ({ ...prev, [field]: event.target.value }))
  }

  const canSubmitCard =
    card.cardholderName.trim() &&
    card.cardNumber.replace(/\s/g, '').length >= 13 &&
    card.expMonth &&
    card.expYear &&
    card.cvc.trim().length >= 3

  const handlePaymentContinue = async (event) => {
    event.preventDefault()
    setSubmitError(null)

    if (!useNewCard && selectedPaymentMethodId) {
      if (mode === 'add_card') {
        navigate('/billing', { replace: true })
        return
      }
      setStep('review')
      return
    }

    setSubmitting(true)
    try {
      const intent = await createSetupIntent()
      const newCard = await addPaymentMethod(
        intent.id,
        {
          cardholder_name: card.cardholderName.trim(),
          card_number: card.cardNumber.trim(),
          exp_month: Number(card.expMonth),
          exp_year: Number(card.expYear),
          cvc: card.cvc.trim(),
          billing_zip: card.billingZip.trim() || null,
        },
        saveCard || savedCards.length === 0,
      )
      setSavedCards((prev) => [...prev, newCard])
      setSelectedPaymentMethodId(newCard.id)
      setUseNewCard(false)

      if (mode === 'add_card') {
        setResult({ kind: 'add_card', paymentMethod: newCard })
        setStep('success')
      } else {
        setStep('review')
      }
    } catch (err) {
      setSubmitError(friendlyError(err))
    } finally {
      setSubmitting(false)
    }
  }

  const handleConfirm = async () => {
    setSubmitError(null)
    setSubmitting(true)
    try {
      if (mode === 'subscription') {
        const subscription = await subscribe(selectedPlanId, billingCycle, selectedPaymentMethodId)
        setResult({ kind: 'subscription', subscription, amountCents: planPriceCents })
      } else {
        const payment = await chargeOneTime(selectedPackId, selectedPaymentMethodId)
        setResult({ kind: 'one_time', payment })
      }
      setStep('success')
    } catch (err) {
      setSubmitError(friendlyError(err))
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return <p className="qr-code-note">Loading…</p>
  }

  if (loadError) {
    return (
      <div className="card empty-state" style={{ padding: 40 }}>
        <span className="empty-state-icon">
          <i className="fa-solid fa-triangle-exclamation" aria-hidden="true"></i>
        </span>
        <h3>Couldn&apos;t load billing</h3>
        <p>{loadError}</p>
      </div>
    )
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>{MODE_TITLES[mode]}</h1>
          {mode === 'subscription' && <p>Choose how {user?.dealership_name ?? 'your dealership'} pays for Atoloan.</p>}
          {mode === 'one_time' && <p>Buy soft-pull credits using a saved card.</p>}
          {mode === 'add_card' && <p>Your card details go straight to our payment processor.</p>}
        </div>
      </div>

      {step === 'plan' && (
        <div className="card checkout-card">
          {mode === 'subscription' ? (
            <>
              <div className="checkout-cycle-row">
                <div className="segmented">
                  <button type="button" className={billingCycle === 'monthly' ? 'is-on' : ''} onClick={() => setBillingCycle('monthly')}>
                    Monthly
                  </button>
                  <button type="button" className={billingCycle === 'annual' ? 'is-on' : ''} onClick={() => setBillingCycle('annual')}>
                    Annual — save 15%
                  </button>
                </div>
              </div>

              <div className="checkout-plan-grid">
                {plans.map((plan) => (
                  <div key={plan.id} className={`checkout-plan-card${plan.id === selectedPlanId ? ' is-picked' : ''}`}>
                    {plan.id === 'multi-lot' && <span className="checkout-badge">Most dealers choose</span>}
                    <p className="checkout-plan-name">{plan.name}</p>
                    <p className="checkout-plan-price">
                      {plan.monthly_price_cents == null ? (
                        'Custom'
                      ) : (
                        <>
                          {formatCurrency(billingCycle === 'annual' ? plan.annual_price_cents : plan.monthly_price_cents)}
                          <small>/{billingCycle === 'annual' ? 'mo, billed yearly' : 'mo'}</small>
                        </>
                      )}
                    </p>
                    <ul className="checkout-plan-features">
                      {plan.features.map((feature) => (
                        <li key={feature}>
                          <i className="fa-solid fa-check" aria-hidden="true"></i>
                          {feature}
                        </li>
                      ))}
                    </ul>
                    <button
                      type="button"
                      className={`btn btn-block ${plan.id === selectedPlanId ? 'btn-primary' : 'btn-secondary'}`}
                      disabled={plan.monthly_price_cents == null}
                      onClick={() => setSelectedPlanId(plan.id)}
                    >
                      {plan.monthly_price_cents == null ? 'Contact sales' : plan.id === selectedPlanId ? 'Selected' : `Select ${plan.name}`}
                    </button>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="checkout-plan-grid">
              {creditPacks.map((pack) => (
                <div key={pack.id} className={`checkout-plan-card${pack.id === selectedPackId ? ' is-picked' : ''}`}>
                  {pack.id === 'pack-50' && <span className="checkout-badge">Best value</span>}
                  <p className="checkout-plan-name">{pack.name}</p>
                  <p className="checkout-plan-price">{formatCurrency(pack.price_cents)}</p>
                  <p className="checkout-plan-rate">{formatCurrency(pack.per_unit_cents)} / pull</p>
                  <button
                    type="button"
                    className={`btn btn-block ${pack.id === selectedPackId ? 'btn-primary' : 'btn-secondary'}`}
                    style={{ marginTop: 14 }}
                    onClick={() => setSelectedPackId(pack.id)}
                  >
                    {pack.id === selectedPackId ? 'Selected' : 'Select pack'}
                  </button>
                </div>
              ))}
            </div>
          )}

          <div className="checkout-btn-row">
            <button className="btn btn-primary" onClick={() => setStep('payment')}>
              Continue
            </button>
          </div>
        </div>
      )}

      {step === 'payment' && (
        <div className="card checkout-card">
          {savedCards.length > 0 && !useNewCard && (
            <div className="checkout-saved-cards">
              {savedCards.map((savedCard) => (
                <label key={savedCard.id} className="checkbox-label checkout-saved-card">
                  <input
                    type="radio"
                    name="saved-card"
                    checked={selectedPaymentMethodId === savedCard.id}
                    onChange={() => setSelectedPaymentMethodId(savedCard.id)}
                  />
                  {savedCard.brand.charAt(0).toUpperCase() + savedCard.brand.slice(1)} •••• {savedCard.last4}
                  {savedCard.is_default && <span className="billing-tag" style={{ marginLeft: 8 }}>Default</span>}
                </label>
              ))}
              <button type="button" className="text-link" onClick={() => setUseNewCard(true)}>
                Use a different card
              </button>
            </div>
          )}

          {(savedCards.length === 0 || useNewCard) && (
            <form onSubmit={handlePaymentContinue}>
              <div>
                <label className="field-label" htmlFor="cardholderName">
                  Cardholder Name
                </label>
                <input
                  id="cardholderName"
                  className="field-input"
                  placeholder="Marina Albrecht"
                  value={card.cardholderName}
                  onChange={updateCardField('cardholderName')}
                />
              </div>
              <div>
                <label className="field-label" htmlFor="cardNumber">
                  Card Number
                </label>
                <input
                  id="cardNumber"
                  className="field-input"
                  placeholder="4242 4242 4242 4242"
                  value={card.cardNumber}
                  onChange={updateCardField('cardNumber')}
                />
              </div>
              <div className="checkout-field-row">
                <div>
                  <label className="field-label" htmlFor="expMonth">
                    Exp. Month
                  </label>
                  <input
                    id="expMonth"
                    className="field-input"
                    placeholder="12"
                    inputMode="numeric"
                    value={card.expMonth}
                    onChange={updateCardField('expMonth')}
                  />
                </div>
                <div>
                  <label className="field-label" htmlFor="expYear">
                    Exp. Year
                  </label>
                  <input
                    id="expYear"
                    className="field-input"
                    placeholder="2029"
                    inputMode="numeric"
                    value={card.expYear}
                    onChange={updateCardField('expYear')}
                  />
                </div>
                <div>
                  <label className="field-label" htmlFor="cvc">
                    CVC
                  </label>
                  <input id="cvc" className="field-input" placeholder="123" inputMode="numeric" value={card.cvc} onChange={updateCardField('cvc')} />
                </div>
                <div>
                  <label className="field-label" htmlFor="billingZip">
                    Billing ZIP
                  </label>
                  <input id="billingZip" className="field-input" placeholder="94103" value={card.billingZip} onChange={updateCardField('billingZip')} />
                </div>
              </div>

              <label className="checkbox-label">
                <input type="checkbox" checked={saveCard} onChange={(event) => setSaveCard(event.target.checked)} />
                Save this card for future payments
              </label>

              <p className="checkout-trust-row">
                <i className="fa-solid fa-lock" aria-hidden="true"></i>
                256-bit encrypted · processed by Stripe · PCI DSS compliant
              </p>

              {savedCards.length > 0 && (
                <button type="button" className="text-link" onClick={() => setUseNewCard(false)} style={{ marginBottom: 18 }}>
                  Use a saved card instead
                </button>
              )}

              {submitError && (
                <p className="login-error" role="alert">
                  {submitError}
                </p>
              )}

              <div className="checkout-btn-row">
                {mode !== 'add_card' && (
                  <button type="button" className="btn btn-secondary" onClick={() => setStep('plan')}>
                    Back
                  </button>
                )}
                <button type="submit" className="btn btn-primary" disabled={!canSubmitCard || submitting}>
                  {submitting ? 'Saving…' : mode === 'add_card' ? 'Add Card' : 'Continue'}
                </button>
              </div>
            </form>
          )}

          {!useNewCard && savedCards.length > 0 && (
            <>
              {submitError && (
                <p className="login-error" role="alert">
                  {submitError}
                </p>
              )}
              <div className="checkout-btn-row">
                {mode !== 'add_card' && (
                  <button type="button" className="btn btn-secondary" onClick={() => setStep('plan')}>
                    Back
                  </button>
                )}
                <button type="button" className="btn btn-primary" onClick={handlePaymentContinue} disabled={submitting}>
                  Continue
                </button>
              </div>
            </>
          )}
        </div>
      )}

      {step === 'review' && (
        <div className="card checkout-card">
          <div className="checkout-review-box">
            {mode === 'subscription' ? (
              <>
                <div className="checkout-review-row">
                  <span>Plan</span>
                  <span>
                    {selectedPlan?.name} — {billingCycle === 'annual' ? 'Annual' : 'Monthly'}
                  </span>
                </div>
                <div className="checkout-review-row checkout-review-row--total">
                  <span>Total due today</span>
                  <span>{planPriceCents != null ? formatCurrency(planPriceCents) : '—'}</span>
                </div>
              </>
            ) : (
              <>
                <div className="checkout-review-row">
                  <span>Credit pack</span>
                  <span>{selectedPack?.name}</span>
                </div>
                <div className="checkout-review-row checkout-review-row--total">
                  <span>Total due today</span>
                  <span>{selectedPack ? formatCurrency(selectedPack.price_cents) : '—'}</span>
                </div>
              </>
            )}
          </div>

          {selectedCard && (
            <div className="checkout-pm-row">
              <i className="fa-solid fa-credit-card" aria-hidden="true"></i>
              <span>
                {selectedCard.brand.charAt(0).toUpperCase() + selectedCard.brand.slice(1)} •••• {selectedCard.last4}
              </span>
              <button type="button" className="text-link" style={{ marginLeft: 'auto' }} onClick={() => setStep('payment')}>
                Change
              </button>
            </div>
          )}

          <label className="checkbox-label" style={{ marginTop: 20 }}>
            <input type="checkbox" checked={agree} onChange={(event) => setAgree(event.target.checked)} />
            {mode === 'subscription'
              ? `I authorize Atoloan to charge this card ${planPriceCents != null ? formatCurrency(planPriceCents) : 'the plan price'} today, and again each ${billingCycle === 'annual' ? 'year' : 'month'} until I cancel.`
              : `I authorize Atoloan to charge this card ${selectedPack ? formatCurrency(selectedPack.price_cents) : ''} today.`}
          </label>

          {submitError && (
            <p className="login-error" role="alert">
              {submitError}
            </p>
          )}

          <div className="checkout-btn-row">
            <button type="button" className="btn btn-secondary" onClick={() => setStep('payment')}>
              Back
            </button>
            <button type="button" className="btn btn-primary" disabled={!agree || submitting} onClick={handleConfirm}>
              {submitting ? 'Processing…' : 'Confirm & Pay'}
            </button>
          </div>
        </div>
      )}

      {step === 'success' && (
        <div className="checkout-success">
          <div className="checkout-check-circle">
            <i className="fa-solid fa-check" aria-hidden="true"></i>
          </div>
          <h2>You&apos;re all set</h2>

          {result?.kind === 'subscription' && (
            <>
              <p className="checkout-lede">
                {result.subscription.plan_name} is now active for {user?.dealership_name ?? 'your dealership'}.
              </p>
              <div className="checkout-receipt">
                <div className="checkout-receipt-row">
                  <span>Amount paid</span>
                  <strong>{result.amountCents != null ? formatCurrency(result.amountCents) : '—'}</strong>
                </div>
                <div className="checkout-receipt-row">
                  <span>Date</span>
                  <strong>{formatDate(result.subscription.current_period_start)}</strong>
                </div>
                <div className="checkout-receipt-row">
                  <span>Next charge</span>
                  <strong>{formatDate(result.subscription.current_period_end)}</strong>
                </div>
              </div>
            </>
          )}

          {result?.kind === 'one_time' && (
            <>
              <p className="checkout-lede">{selectedPack?.credits} credits added to your account.</p>
              <div className="checkout-receipt">
                <div className="checkout-receipt-row">
                  <span>Amount paid</span>
                  <strong>{formatCurrency(result.payment.amount_cents)}</strong>
                </div>
                <div className="checkout-receipt-row">
                  <span>Date</span>
                  <strong>{formatDate(result.payment.created_at)}</strong>
                </div>
              </div>
            </>
          )}

          {result?.kind === 'add_card' && (
            <p className="checkout-lede">
              {result.paymentMethod.brand.charAt(0).toUpperCase() + result.paymentMethod.brand.slice(1)} •••• {result.paymentMethod.last4} saved.
            </p>
          )}

          <div className="checkout-btn-row" style={{ justifyContent: 'center' }}>
            <button className="btn btn-primary" onClick={() => navigate('/billing', { replace: true })}>
              Go to Billing
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default BillingCheckout
