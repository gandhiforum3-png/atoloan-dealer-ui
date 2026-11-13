import { useEffect, useState } from 'react'
import { closeCustomer, listCustomers, setCustomerStatus } from '../../api/customers'
import ConfirmModal from '../../components/ConfirmModal'
import LoadMore from '../../components/LoadMore'
import { customerName, formatDate, friendlyError } from '../../utils/format'
import CustomerDetailModal from './CustomerDetailModal'
import CustomerEditModal from './CustomerEditModal'
import CustomerStatusBadge from './CustomerStatusBadge'
import '../Dealers.css'
import './Admin.css'

const PAGE_SIZE = 25

function AdminCustomers() {
  const [searchInput, setSearchInput] = useState('')
  const [search, setSearch] = useState('') // applied on submit, not per keystroke
  const [attempt, setAttempt] = useState(0) // a resubmitted search re-fetches (retry after an error)
  const [page, setPage] = useState({ key: null, customers: [], total: 0, error: null })
  const key = `${attempt}|${search}`
  const [loadingMore, setLoadingMore] = useState(false)
  const [modal, setModal] = useState(null) // { type: 'detail' | 'edit' | 'status' | 'close', customer }
  const [confirmEmail, setConfirmEmail] = useState('')

  useEffect(() => {
    let cancelled = false
    listCustomers({ search, limit: PAGE_SIZE, offset: 0 })
      .then((data) => !cancelled && setPage({ key, customers: data.customers, total: data.total, error: null }))
      .catch((err) => !cancelled && setPage({ key, customers: [], total: 0, error: friendlyError(err) }))
    return () => {
      cancelled = true
    }
  }, [search, key])

  async function loadMore() {
    setLoadingMore(true)
    try {
      const data = await listCustomers({ search, limit: PAGE_SIZE, offset: page.customers.length })
      setPage((prev) => ({ ...prev, customers: [...prev.customers, ...data.customers], total: data.total }))
    } catch (err) {
      setPage((prev) => ({ ...prev, error: friendlyError(err) }))
    } finally {
      setLoadingMore(false)
    }
  }

  function patchRow(id, changes) {
    setPage((prev) => ({ ...prev, customers: prev.customers.map((c) => (c.id === id ? { ...c, ...changes } : c)) }))
  }

  function removeRow(id) {
    setPage((prev) => ({ ...prev, customers: prev.customers.filter((c) => c.id !== id), total: prev.total - 1 }))
  }

  const close = () => {
    setModal(null)
    setConfirmEmail('')
  }
  const loading = page.key !== key
  const target = modal?.customer

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Customers</h1>
          <p>Customer accounts on the Atoloans site: sign-in activity, applications, and account support.</p>
        </div>
      </div>

      <div className="card dealers-card">
        <form
          className="admin-toolbar"
          role="search"
          onSubmit={(event) => {
            event.preventDefault()
            setSearch(searchInput.trim())
            setAttempt((n) => n + 1)
          }}
        >
          <label className="visually-hidden" htmlFor="customer-search">
            Search customers
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
              if (!event.target.value) setSearch('')
            }}
          />
          <button type="submit" className="btn btn-secondary">
            Search
          </button>
        </form>

        {loading ? (
          <p className="qr-code-note">Loading customers…</p>
        ) : page.error && page.customers.length === 0 ? (
          <div className="empty-state">
            <h3>Couldn&apos;t load customers</h3>
            <p>{page.error}</p>
          </div>
        ) : page.customers.length === 0 ? (
          <div className="empty-state">
            <h3>{search ? 'No matching customers' : 'No customer accounts yet'}</h3>
            <p>{search ? 'Try a different name, email or phone.' : 'Accounts appear here after a customer first signs in.'}</p>
          </div>
        ) : (
          <>
            <div className="applications-table-wrap">
              <table className="applications-table dealers-table">
                <thead>
                  <tr>
                    <th scope="col">Customer</th>
                    <th scope="col">Status</th>
                    <th scope="col">Joined</th>
                    <th scope="col">Last sign-in</th>
                    <th scope="col">Applications</th>
                    <th scope="col">
                      <span className="visually-hidden">Actions</span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {page.customers.map((customer) => (
                    <tr key={customer.id} className="dealers-row">
                      <td>
                        <p className="applications-name">{customerName(customer)}</p>
                        <p className="applications-subtext">{customer.email}</p>
                      </td>
                      <td>
                        <CustomerStatusBadge status={customer.status} />
                      </td>
                      <td>{formatDate(customer.created_at)}</td>
                      <td>{formatDate(customer.last_login_at)}</td>
                      <td>{customer.applications}</td>
                      <td>
                        <button
                          type="button"
                          className="btn btn-secondary"
                          aria-label={`View ${customerName(customer)}`}
                          onClick={() => setModal({ type: 'detail', customer })}
                        >
                          View
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <LoadMore
              shown={page.customers.length}
              total={page.total}
              hasMore={page.customers.length < page.total}
              loading={loadingMore}
              onLoadMore={loadMore}
              noun="customers"
            />
          </>
        )}
      </div>

      {modal?.type === 'detail' && (
        <CustomerDetailModal
          customer={target}
          onClose={close}
          onEdit={(customer) => setModal({ type: 'edit', customer })}
          onToggleStatus={(customer) => setModal({ type: 'status', customer })}
          onCloseAccount={(customer) => setModal({ type: 'close', customer })}
        />
      )}
      {modal?.type === 'edit' && (
        <CustomerEditModal
          customer={target}
          onClose={close}
          onSaved={(saved) => {
            patchRow(target.id, { first_name: saved.first_name, last_name: saved.last_name, phone_number: saved.phone_number })
            close()
          }}
        />
      )}
      {modal?.type === 'status' && (
        <ConfirmModal
          title={target.status === 'disabled' ? 'Enable customer' : 'Disable customer'}
          confirmLabel={target.status === 'disabled' ? 'Enable' : 'Disable'}
          busyLabel="Saving…"
          tone={target.status === 'disabled' ? 'primary' : 'danger'}
          onClose={close}
          onConfirm={async () => {
            const next = target.status === 'disabled' ? 'active' : 'disabled'
            await setCustomerStatus(target.id, next)
            patchRow(target.id, { status: next, ...(next === 'disabled' ? { active_sessions: 0 } : {}) })
            close()
          }}
        >
          {target.status === 'disabled' ? (
            <>
              <strong>{target.email}</strong> will be able to sign in again with an emailed code.
            </>
          ) : (
            <>
              <strong>{target.email}</strong> is signed out everywhere now and can&apos;t sign in until re-enabled. Their
              applications are untouched.
            </>
          )}
        </ConfirmModal>
      )}
      {modal?.type === 'close' && (
        <ConfirmModal
          title="Close customer account"
          confirmLabel="Close account"
          busyLabel="Closing…"
          tone="danger"
          canConfirm={confirmEmail.trim().toLowerCase() === target.email}
          onClose={close}
          onConfirm={async () => {
            await closeCustomer(target.id)
            removeRow(target.id)
            close()
          }}
        >
          <p>
            Deletes the sign-in and contact details for <strong>{target.email}</strong> and signs them out everywhere.
            Application and credit-check records are kept for the required retention period. This can&apos;t be undone.
          </p>
          <label className="field-label" htmlFor="close-confirm-email">
            Type the customer&apos;s email to confirm
          </label>
          <input
            id="close-confirm-email"
            className="field-input"
            autoComplete="off"
            value={confirmEmail}
            onChange={(event) => setConfirmEmail(event.target.value)}
          />
        </ConfirmModal>
      )}
    </div>
  )
}

export default AdminCustomers
