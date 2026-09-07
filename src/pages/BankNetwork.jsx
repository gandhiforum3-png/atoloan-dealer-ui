import { useEffect, useState, useCallback } from 'react'
import { getBanks, getMyBankNetwork, saveMyBankNetwork } from '../api/banks'
import { ApiError } from '../api/client'
import RateSheetUploadCard from '../components/RateSheetUploadCard'
import './BankNetwork.css'

function friendlyError(err) {
  return err instanceof ApiError ? err.message : 'Unable to reach the server. Is the backend running?'
}

function BankNetwork() {
  const [banks, setBanks] = useState([])
  const [selectedIds, setSelectedIds] = useState(new Set())
  const [savedIds, setSavedIds] = useState(new Set())
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)
  const [saveError, setSaveError] = useState(null)

  const loadBankData = useCallback(async () => {
    const [allBanks, network] = await Promise.all([getBanks(), getMyBankNetwork()])
    setBanks(allBanks)
    const ids = new Set(network.map((bank) => bank.id))
    setSelectedIds(ids)
    setSavedIds(ids)
  }, [])

  useEffect(() => {
    let cancelled = false

    Promise.all([getBanks(), getMyBankNetwork()])
      .then(([allBanks, network]) => {
        if (cancelled) return
        setBanks(allBanks)
        const ids = new Set(network.map((bank) => bank.id))
        setSelectedIds(ids)
        setSavedIds(ids)
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

  const toggleBank = (bankId) => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(bankId)) next.delete(bankId)
      else next.add(bankId)
      return next
    })
    setSaveError(null)
  }

  const hasChanges =
    selectedIds.size !== savedIds.size || [...selectedIds].some((id) => !savedIds.has(id))

  const handleSave = async (event) => {
    event.preventDefault()
    setSaving(true)
    setSaveError(null)
    try {
      const updated = await saveMyBankNetwork([...selectedIds])
      const ids = new Set(updated.map((bank) => bank.id))
      setSelectedIds(ids)
      setSavedIds(ids)
    } catch (err) {
      setSaveError(friendlyError(err))
    } finally {
      setSaving(false)
    }
  }

  // A newly-approved rate sheet adds a bank server-side — refetch so it
  // shows up (and is checked) in the list without a manual reload.
  const handleRateSheetApproved = () => {
    loadBankData().catch((err) => setError(friendlyError(err)))
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Bank Network</h1>
          <p>Select the banks and credit unions you want in this dealership&apos;s financing network.</p>
        </div>
      </div>

      <div className="card bank-network-card">
        {loading ? (
          <p className="qr-code-note">Loading banks…</p>
        ) : error ? (
          <div className="empty-state">
            <span className="empty-state-icon">
              <i className="fa-solid fa-triangle-exclamation" aria-hidden="true"></i>
            </span>
            <h3>Couldn&apos;t load banks</h3>
            <p>{error}</p>
          </div>
        ) : banks.length === 0 ? (
          <div className="empty-state">
            <span className="empty-state-icon">
              <i className="fa-solid fa-shield-halved" aria-hidden="true"></i>
            </span>
            <h3>No Banks Available</h3>
            <p>No bank or credit union partners were returned by the network.</p>
          </div>
        ) : (
          <form onSubmit={handleSave}>
            <p className="bank-network-summary">
              {selectedIds.size} bank{selectedIds.size === 1 ? '' : 's'} selected
              {hasChanges && ' (unsaved)'}
            </p>

            <ul className="bank-network-list">
              {banks.map((bank) => (
                <li key={bank.id}>
                  <label className="checkbox-label bank-network-option">
                    <input
                      type="checkbox"
                      checked={selectedIds.has(bank.id)}
                      onChange={() => toggleBank(bank.id)}
                    />
                    {bank.name}
                  </label>
                </li>
              ))}
            </ul>

            {saveError && (
              <p className="login-error" role="alert">
                {saveError}
              </p>
            )}

            <button type="submit" className="btn btn-primary" disabled={!hasChanges || saving}>
              <i className="fa-solid fa-link" aria-hidden="true"></i>
              {saving ? 'Saving…' : 'Save Network'}
            </button>

            <p className="bank-network-note">
              Selected banks are saved to your dealer profile and available across sessions.
            </p>
          </form>
        )}
      </div>

      <RateSheetUploadCard onApproved={handleRateSheetApproved} />
    </div>
  )
}

export default BankNetwork
