import { useState } from 'react'
import { uploadRateSheet, confirmRateSheet } from '../api/rateSheets'
import { ApiError } from '../api/client'
import RateSheetReview from './RateSheetReview'
import './RateSheetUploadCard.css'

function friendlyError(err) {
  return err instanceof ApiError ? err.message : 'Unable to reach the server. Is the backend running?'
}

function RateSheetUploadCard({ onApproved }) {
  const [file, setFile] = useState(null)
  const [uploading, setUploading] = useState(false)
  const [result, setResult] = useState(null)
  const [error, setError] = useState(null)
  const [approving, setApproving] = useState(false)
  const [approveError, setApproveError] = useState(null)
  const [approved, setApproved] = useState(null)

  const reset = () => {
    setFile(null)
    setResult(null)
    setError(null)
    setApproveError(null)
    setApproved(null)
  }

  const handleFileChange = (event) => {
    setFile(event.target.files?.[0] ?? null)
    setResult(null)
    setError(null)
    setApproveError(null)
    setApproved(null)
  }

  const handleUpload = async (event) => {
    event.preventDefault()
    if (!file) return

    setUploading(true)
    setError(null)
    setResult(null)
    setApproved(null)

    try {
      setResult(await uploadRateSheet(file))
    } catch (err) {
      setError(friendlyError(err))
    } finally {
      setUploading(false)
    }
  }

  const handleApprove = async () => {
    if (!result?.rate_sheet) return

    setApproving(true)
    setApproveError(null)

    try {
      const data = await confirmRateSheet(result.rate_sheet)
      setApproved(data)
      onApproved?.()
    } catch (err) {
      setApproveError(friendlyError(err))
    } finally {
      setApproving(false)
    }
  }

  const loanProgramCount = result?.rate_sheet?.loan_programs?.length ?? 0

  return (
    <div className="card rate-sheet-card">
      <h2>Upload Rate Sheet</h2>
      <p className="rate-sheet-intro">
        Upload a bank&apos;s rate sheet PDF, review what was extracted, then approve it to add the
        bank to your network.
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
      </form>

      {result && (
        <div className="rate-sheet-result">
          {result.rate_sheet ? (
            approved ? (
              <p className="rate-sheet-result-title">
                <i className="fa-solid fa-circle-check" aria-hidden="true"></i>
                {approved.bank_name} added to your bank network.
                {approved.approval_status === 'pending' &&
                  ' Atoloan will review the rates before customers can be matched to this lender.'}
              </p>
            ) : (
              <>
                <p className="rate-sheet-result-title">
                  <i className="fa-solid fa-circle-check" aria-hidden="true"></i>
                  Parsed {result.rate_sheet.credit_union_info?.name || result.filename} — review before
                  approving
                </p>
                <p className="rate-sheet-result-detail">
                  {loanProgramCount} loan program{loanProgramCount === 1 ? '' : 's'} detected.
                </p>

                <RateSheetReview rateSheet={result.rate_sheet} />

                {approveError && (
                  <p className="login-error" role="alert">
                    {approveError}
                  </p>
                )}

                <div className="rate-sheet-actions">
                  <button
                    type="button"
                    className="btn btn-primary"
                    onClick={handleApprove}
                    disabled={approving}
                  >
                    <i className="fa-solid fa-check" aria-hidden="true"></i>
                    {approving ? 'Adding to Network…' : 'Approve & Add to Network'}
                  </button>
                  <button type="button" className="btn btn-secondary" onClick={reset} disabled={approving}>
                    Discard
                  </button>
                </div>
              </>
            )
          ) : (
            <p className="rate-sheet-result-title rate-sheet-result-title--failed">
              <i className="fa-solid fa-triangle-exclamation" aria-hidden="true"></i>
              {result.parse_error || 'The rate sheet could not be parsed.'}
            </p>
          )}
        </div>
      )}

      <p className="rate-sheet-note">
        Uploading only parses the PDF for review — nothing is saved until you approve it.
      </p>
    </div>
  )
}

export default RateSheetUploadCard
