import { useCallback, useEffect, useState } from 'react'
import { getAllApplicationsSummary, listAllApplications } from '../../api/admin'
import { listDealers } from '../../api/dealers'
import ApplicationsTable from '../../components/ApplicationsTable'
import LoadMore from '../../components/LoadMore'
import StatCard from '../../components/StatCard'
import usePagedApplications from '../../hooks/usePagedApplications'
import '../Applications.css'
import './Admin.css'

function AdminApplications() {
  const [dealerId, setDealerId] = useState('')
  const [dealers, setDealers] = useState([])
  const [searchInput, setSearchInput] = useState('')
  const [search, setSearch] = useState('') // applied on submit, not per keystroke
  const [summaryResult, setSummaryResult] = useState({ filter: null, data: null })
  const filter = `${dealerId}|${search}`

  useEffect(() => {
    // The filter is a convenience — the page still works if this fails
    listDealers()
      .then(setDealers)
      .catch(() => setDealers([]))
  }, [])

  useEffect(() => {
    let cancelled = false
    getAllApplicationsSummary({ dealerId, search })
      .then((data) => !cancelled && setSummaryResult({ filter, data }))
      .catch(() => !cancelled && setSummaryResult({ filter, data: null }))
    return () => {
      cancelled = true
    }
  }, [dealerId, search, filter])

  const fetchPage = useCallback((page) => listAllApplications({ ...page, dealerId, search }), [dealerId, search])
  const { applications, total, status, error, loadingMore, loadMore, hasMore } = usePagedApplications(fetchPage)

  // Only show counts that belong to the current filter
  const summary = summaryResult.filter === filter ? summaryResult.data : null
  const stats = [
    { label: 'Total Applications', value: summary?.total },
    { label: 'Matched to a Lender', value: summary?.matched },
    { label: 'No Match Yet', value: summary?.unmatched },
    { label: 'Last 7 Days', value: summary?.last_7_days },
  ]

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>All Applications</h1>
          <p>Every soft-pull application across all dealerships and the customer site. Search to find a customer and their history.</p>
        </div>
      </div>

      <div className="admin-stats-grid">
        {stats.map((stat) => (
          <StatCard key={stat.label} label={stat.label} value={stat.value ?? '—'} />
        ))}
      </div>

      <div className="card applications-card">
        <form
          className="admin-toolbar"
          role="search"
          onSubmit={(event) => {
            event.preventDefault()
            setSearch(searchInput.trim())
          }}
        >
          <label className="field-label admin-toolbar-label" htmlFor="customer-search">
            Customer
          </label>
          <input
            id="customer-search"
            type="search"
            className="field-input admin-toolbar-select"
            placeholder="Name, email or phone"
            maxLength={100}
            value={searchInput}
            onChange={(event) => {
              setSearchInput(event.target.value)
              if (!event.target.value) setSearch('') // clearing the box shows everyone again
            }}
          />
          <button type="submit" className="btn btn-secondary">
            Search
          </button>
          <label className="field-label admin-toolbar-label" htmlFor="dealer-filter">
            Dealership
          </label>
          <select
            id="dealer-filter"
            className="field-input admin-toolbar-select"
            value={dealerId}
            onChange={(event) => setDealerId(event.target.value)}
          >
            <option value="">All dealerships</option>
            {dealers.map((dealer) => (
              <option key={dealer.dealer_id} value={dealer.dealer_id}>
                {dealer.dealership_name} ({dealer.dealer_id})
              </option>
            ))}
          </select>
        </form>

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
            <h3>No applications</h3>
            <p>
              {search
                ? `No customer matches “${search}”.`
                : dealerId
                  ? 'This dealership has no applications yet.'
                  : 'No applications have been submitted yet.'}
            </p>
          </div>
        ) : (
          <>
            <ApplicationsTable applications={applications} showDealer />
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

export default AdminApplications
