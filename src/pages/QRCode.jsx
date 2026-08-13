import { useEffect, useState } from 'react'
import QRCodeLib from 'qrcode'
import { currentUser } from '../data/currentUser'
import './QRCode.css'

const DEALER_SLUG = currentUser.org
  .toLowerCase()
  .replace(/[^a-z0-9]+/g, '-')
  .replace(/(^-|-$)/g, '')

function createToken() {
  return Math.random().toString(36).slice(2, 10)
}

// Placeholder intake URL — point this at the real soft-pull landing page once it exists.
function buildUrl(token) {
  return `https://apply.atoloans.com/${DEALER_SLUG}?code=${token}`
}

function QRCode() {
  const [record, setRecord] = useState(null) // { label, token, url, updatedAt }
  const [labelDraft, setLabelDraft] = useState('Showroom QR')
  const [imageUrl, setImageUrl] = useState(null)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    if (!record) return

    let cancelled = false
    QRCodeLib.toDataURL(record.url, {
      width: 320,
      margin: 1,
      color: { dark: '#0b1120', light: '#ffffff' },
    }).then((dataUrl) => {
      if (!cancelled) setImageUrl(dataUrl)
    })

    return () => {
      cancelled = true
    }
  }, [record])

  const handleGenerate = () => {
    const token = createToken()
    setRecord({
      label: labelDraft.trim() || 'Showroom QR',
      token,
      url: buildUrl(token),
      updatedAt: new Date(),
    })
  }

  const handleUpdateLabel = () => {
    if (!record) return
    setRecord((prev) => ({ ...prev, label: labelDraft.trim() || prev.label, updatedAt: new Date() }))
  }

  const handleGenerateNew = () => {
    if (!record) return
    const token = createToken()
    setRecord((prev) => ({ ...prev, token, url: buildUrl(token), updatedAt: new Date() }))
  }

  const handleCopy = async () => {
    if (!record) return
    await navigator.clipboard.writeText(record.url)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

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

          <div className="qr-code-actions">
            {!record ? (
              <button type="button" className="btn btn-primary btn-block" onClick={handleGenerate}>
                <i className="fa-solid fa-qrcode" aria-hidden="true"></i>
                Generate QR Code
              </button>
            ) : (
              <>
                <button type="button" className="btn btn-primary btn-block" onClick={handleUpdateLabel}>
                  <i className="fa-solid fa-pen" aria-hidden="true"></i>
                  Update QR Code
                </button>
                <button type="button" className="btn btn-secondary btn-block" onClick={handleGenerateNew}>
                  <i className="fa-solid fa-rotate" aria-hidden="true"></i>
                  Generate New Code
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
              <p className="qr-code-updated">Last updated {record.updatedAt.toLocaleString()}</p>
            </div>
          )}

          <p className="qr-code-note">
            This code isn&apos;t saved to your dealer account yet — it only lives in this browser tab
            and resets on reload.
          </p>
        </div>

        <div className="card qr-code-preview">
          {imageUrl ? (
            <>
              <img src={imageUrl} alt={`QR code for ${record.label}`} className="qr-code-image" />
              <p className="qr-code-image-label">{record.label}</p>
              <a href={imageUrl} download={`${DEALER_SLUG}-qr-code.png`} className="btn btn-dark btn-block">
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
