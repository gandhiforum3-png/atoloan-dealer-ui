import { useEffect, useState } from 'react'
import { getMyQrCode, generateQrCode, updateQrCodeLabel } from '../api/qrCodes'
import { ApiError } from '../api/client'
import './QRCode.css'

function friendlyError(err) {
  return err instanceof ApiError ? err.message : 'Unable to reach the server. Is the backend running?'
}

function QRCode() {
  const [record, setRecord] = useState(null)
  const [labelDraft, setLabelDraft] = useState('Showroom QR')
  const [loading, setLoading] = useState(true)
  const [actionState, setActionState] = useState('idle') // idle | generating | updating | regenerating
  const [error, setError] = useState(null)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    let cancelled = false

    getMyQrCode()
      .then((data) => {
        if (cancelled) return
        if (data) {
          setRecord(data)
          setLabelDraft(data.label)
        }
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

  const handleGenerate = async () => {
    setActionState('generating')
    setError(null)
    try {
      const data = await generateQrCode(labelDraft.trim() || 'Showroom QR')
      setRecord(data)
      setLabelDraft(data.label)
    } catch (err) {
      setError(friendlyError(err))
    } finally {
      setActionState('idle')
    }
  }

  const handleUpdateLabel = async () => {
    if (!record) return
    setActionState('updating')
    setError(null)
    try {
      const data = await updateQrCodeLabel(labelDraft.trim() || record.label)
      setRecord(data)
      setLabelDraft(data.label)
    } catch (err) {
      setError(friendlyError(err))
    } finally {
      setActionState('idle')
    }
  }

  const handleGenerateNew = async () => {
    if (!record) return
    setActionState('regenerating')
    setError(null)
    try {
      const data = await generateQrCode(record.label)
      setRecord(data)
      setLabelDraft(data.label)
    } catch (err) {
      setError(friendlyError(err))
    } finally {
      setActionState('idle')
    }
  }

  const handleCopy = async () => {
    if (!record) return
    await navigator.clipboard.writeText(record.url)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  const busy = actionState !== 'idle'

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>QR Code</h1>
          <p>Generate a showroom QR code that lets walk-in buyers start a secure soft-pull application instantly.</p>
        </div>
      </div>

      <div className="qr-code-grid">
        <div className="card qr-code-form">
          <h2>{record ? 'Manage Code' : 'Generate a Code'}</h2>

          {loading ? (
            <p className="qr-code-note">Loading…</p>
          ) : (
            <>
              <label className="field-label" htmlFor="qr-label">
                Label
              </label>
              <input
                id="qr-label"
                className="field-input"
                placeholder="e.g. Showroom Entrance"
                value={labelDraft}
                onChange={(event) => setLabelDraft(event.target.value)}
              />

              {error && (
                <p className="login-error" role="alert">
                  {error}
                </p>
              )}

              <div className="qr-code-actions">
                {!record ? (
                  <button type="button" className="btn btn-primary btn-block" onClick={handleGenerate} disabled={busy}>
                    <i className="fa-solid fa-qrcode" aria-hidden="true"></i>
                    {actionState === 'generating' ? 'Generating…' : 'Generate QR Code'}
                  </button>
                ) : (
                  <>
                    <button
                      type="button"
                      className="btn btn-primary btn-block"
                      onClick={handleUpdateLabel}
                      disabled={busy}
                    >
                      <i className="fa-solid fa-pen" aria-hidden="true"></i>
                      {actionState === 'updating' ? 'Updating…' : 'Update QR Code'}
                    </button>
                    <button
                      type="button"
                      className="btn btn-secondary btn-block"
                      onClick={handleGenerateNew}
                      disabled={busy}
                    >
                      <i className="fa-solid fa-rotate" aria-hidden="true"></i>
                      {actionState === 'regenerating' ? 'Generating…' : 'Generate New Code'}
                    </button>
                    <p className="qr-code-warning">
                      Generating a new code replaces the link below — any printed or shared copies of the
                      previous code will stop working.
                    </p>
                  </>
                )}
              </div>

              {record && (
                <div className="qr-code-meta">
                  <p className="field-label">Destination Link</p>
                  <div className="qr-code-link-row">
                    <code>{record.url}</code>
                    <button type="button" className="btn btn-secondary qr-code-copy" onClick={handleCopy}>
                      {copied ? 'Copied' : 'Copy'}
                    </button>
                  </div>
                  <p className="qr-code-updated">
                    Last updated {new Date(record.updated_at).toLocaleString()}
                  </p>
                </div>
              )}
            </>
          )}
        </div>

        <div className="card qr-code-preview">
          {record ? (
            <>
              <img src={record.image_data_url} alt={`QR code for ${record.label}`} className="qr-code-image" />
              <p className="qr-code-image-label">{record.label}</p>
              <a
                href={record.image_data_url}
                download={`${record.dealer_id}-qr-code.png`}
                className="btn btn-dark btn-block"
              >
                <i className="fa-solid fa-download" aria-hidden="true"></i>
                Download PNG
              </a>
            </>
          ) : (
            <div className="empty-state">
              <span className="empty-state-icon">
                <i className="fa-solid fa-qrcode" aria-hidden="true"></i>
              </span>
              <h3>No QR Code Yet</h3>
              <p>Generate a code to preview and download it here.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default QRCode
