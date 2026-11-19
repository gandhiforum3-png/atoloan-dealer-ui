import { useState } from 'react'
import Modal from './Modal'
import { friendlyError } from '../utils/format'

// Confirmation dialog for consequential admin actions. `canConfirm` lets a
// caller require something extra first (e.g. typing the account's email).
function ConfirmModal({ title, children, confirmLabel, busyLabel, tone = 'dark', canConfirm = true, onConfirm, onClose }) {
  const [error, setError] = useState(null)
  const [saving, setSaving] = useState(false)

  async function handleConfirm() {
    setSaving(true)
    setError(null)
    try {
      await onConfirm()
    } catch (err) {
      setError(friendlyError(err))
      setSaving(false)
    }
  }

  return (
    <Modal title={title} onClose={onClose}>
      {error && (
        <div className="modal-error" role="alert">
          {error}
        </div>
      )}
      <div className="dealers-modal-copy">{children}</div>
      <div className="modal-actions">
        <button type="button" className="btn btn-secondary" onClick={onClose}>
          Cancel
        </button>
        <button type="button" className={`btn btn-${tone}`} onClick={handleConfirm} disabled={saving || !canConfirm}>
          {saving ? busyLabel : confirmLabel}
        </button>
      </div>
    </Modal>
  )
}

export default ConfirmModal
