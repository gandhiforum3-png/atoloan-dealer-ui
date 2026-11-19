import { useCallback } from 'react'
import { getMyApplications } from '../api/applications'
import ApplicationsTable from '../components/ApplicationsTable'
import LoadMore from '../components/LoadMore'
import usePagedApplications from '../hooks/usePagedApplications'
import './Applications.css'

function Applications() {
  const fetchPage = useCallback((page) => getMyApplications(page), [])
  const { applications, total, status, error, loadingMore, loadMore, hasMore } = usePagedApplications(fetchPage)

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Applications</h1>
          <p>Every financing application submitted through your dealership&apos;s soft pull tab.</p>
        </div>
      </div>

      <div className="card applications-card">
        {status === 'loading' ? (
          <p className="qr-code-note">Loading applications…</p>
        ) : status === 'error' ? (
          <div className="empty-state">
            <span className="empty-state-icon">
              <i className="fa-solid fa-triangle-exclamation" aria-hidden="true"></i>
            </span>
            <h3>Couldn&apos;t load applications</h3>
            <p>{error}</p>
          </div>
        ) : applications.length === 0 ? (
          <div className="empty-state">
            <span className="empty-state-icon">
              <i className="fa-solid fa-file-lines" aria-hidden="true"></i>
            </span>
            <h3>No Applications Yet</h3>
            <p>Applications submitted from the Soft Pull tab will show up here.</p>
          </div>
        ) : (
          <>
            <ApplicationsTable applications={applications} />
            <LoadMore
              shown={applications.length}
              total={total}
              hasMore={hasMore}
              loading={loadingMore}
              onLoadMore={loadMore}
            />
          </>
        )}
      </div>
    </div>
  )
}

export default Applications
