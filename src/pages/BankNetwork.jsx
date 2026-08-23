import { useEffect, useState } from 'react'
import { getBanks, getMyBankNetwork, saveMyBankNetwork } from '../api/banks'
import { uploadRateSheet } from '../api/rateSheets'
import { ApiError } from '../api/client'
import './BankNetwork.css'

function friendlyError(err) {
  return err instanceof ApiError ? err.message : 'Unable to reach the server. Is the backend running?'
}

function RateSheetUpload() {
  const [file, setFile] = useState(null)
  const [uploading, setUploading] = useState(false)
  const [result, setResult] = useState(null)
  const [error, setError] = useState(null)

  const handleFileChange = (event) => {
    setFile(event.target.files?.[0] ?? null)
    setResult(null)
    setError(null)
  }

  const handleUpload = async (event) => {
    event.preventDefault()
    if (!file) return

    setUploading(true)
    setError(null)
    setResult(null)

    try {
      setResult(await uploadRateSheet(file))
    } catch (err) {
      setError(friendlyError(err))
    } finally {
      setUploading(false)
    }
  }

  const loanProgramCount = result?.rate_sheet?.loan_programs?.length ?? 0

  return (
    <div className="card rate-sheet-card">
      <h2>Upload Rate Sheet</h2>
      <p className="rate-sheet-intro">
        Upload a bank&apos;s rate sheet PDF to preview its parsed rates and terms.
      </p>

      <form onSubmit={handleUpload}>
        <label className="field-label" htmlFor="rate-sheet-file">
          Rate Sheet (PDF)
        </label>
        <input
          id="rate-sheet-file"
          className="field-input"
          type="file"
          accept="application/pdf"
          onChange={handleFileChange}
        />

        {error && (
          <p className="login-error" role="alert">
            {error}
          </p>
        )}

        <button type="submit" className="btn btn-primary" disabled={!file || uploading}>
          <i className="fa-solid fa-file-arrow-up" aria-hidden="true"></i>
          {uploading ? 'Parsing…' : 'Upload & Parse'}
        </button>

        {uploading && (
          <p className="rate-sheet-note">Parsing rate sheet — this can take up to a minute…</p>
        )}

        {result && (
          <div className="rate-sheet-result">
            {result.rate_sheet ? (
              <>
                <p className="rate-sheet-result-title">
                  <i className="fa-solid fa-circle-check" aria-hidden="true"></i>
                  Parsed {result.rate_sheet.credit_union_info?.name || result.filename}
                </p>
                {result.validation && (
                  <p className="rate-sheet-result-detail">
                    Validation: {result.validation.is_valid ? 'looks good' : 'flagged for review'}
                    {result.validation.similarity && ` · ${result.validation.similarity} text match`}
                  </p>
                )}
                <p className="rate-sheet-result-detail">
                  {loanProgramCount} loan program{loanProgramCount === 1 ? '' : 's'} detected.
                </p>
              </>
            ) : (
              <p className="rate-sheet-result-title rate-sheet-result-title--failed">
                <i className="fa-solid fa-triangle-exclamation" aria-hidden="true"></i>
                {result.parse_error || 'The rate sheet could not be parsed.'}
              </p>
            )}
          </div>
        )}

        <p className="rate-sheet-note">
          This is a preview only — nothing is saved to your bank network yet.
        </p>
      </form>
    </div>
  )
}

function BankNetwork() {
  const [banks, setBanks] = useState([])
  const [selectedIds, setSelectedIds] = useState(new Set())
  const [savedIds, setSavedIds] = useState(new Set())
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)
  const [saveError, setSaveError] = useState(null)

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

      <RateSheetUpload />
    </div>
  )
}

export default BankNetwork
