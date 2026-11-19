import { Fragment, useState } from 'react'
import { currencyFormatter, formatDateTime } from '../utils/format'
import '../pages/Applications.css'

function Fact({ label, children }) {
  return (
    <div>
      <p className="rsr-fact-label">{label}</p>
      <p className="rsr-fact-value">{children || '—'}</p>
    </div>
  )
}

function SourceCell({ application }) {
  if (application.dealer_id) {
    return (
      <>
        <p className="applications-name">{application.dealership_name || application.dealer_id}</p>
        <p className="applications-subtext">{application.dealer_id}</p>
      </>
    )
  }
  return <span className="applications-subtext">Customer site</span>
}

// Shared by the dealer's own Applications page and the admin all-dealers view.
function ApplicationsTable({ applications, showDealer = false }) {
  const [expandedId, setExpandedId] = useState(null)
  const columns = showDealer ? 6 : 5

  return (
    <div className="applications-table-wrap">
      <table className="applications-table">
        <thead>
          <tr>
            <th scope="col">Applicant</th>
            {showDealer && <th scope="col">Source</th>}
            <th scope="col">Submitted</th>
            <th scope="col">Credit</th>
            <th scope="col">Best Match</th>
            <th scope="col">
              <span className="visually-hidden">Details</span>
            </th>
          </tr>
        </thead>
        <tbody>
          {applications.map((application) => {
            const expanded = expandedId === application.id
            const detailId = `application-detail-${application.id}`
            const toggle = () => setExpandedId(expanded ? null : application.id)
            return (
              <Fragment key={application.id}>
                <tr className={`applications-row${expanded ? ' applications-row--expanded' : ''}`} onClick={toggle}>
                  <td>
                    <p className="applications-name">
                      {application.first_name} {application.last_name}
                    </p>
                    <p className="applications-subtext">{application.email}</p>
                  </td>
                  {showDealer && (
                    <td>
                      <SourceCell application={application} />
                    </td>
                  )}
                  <td>{formatDateTime(application.created_at)}</td>
                  <td>
                    {application.prequal_score ?? '—'}
                    {application.prequal_tier && (
                      <span className="applications-subtext"> · {application.prequal_tier}</span>
                    )}
                  </td>
                  <td>
                    {application.bank_name ? (
                      <>
                        <p className="applications-name">{application.bank_name}</p>
                        <p className="applications-subtext">
                          {[application.interest_rate, application.term_in_months && `${application.term_in_months} mo`]
                            .filter(Boolean)
                            .join(' · ')}
                        </p>
                      </>
                    ) : (
                      <span className="applications-subtext">No match</span>
                    )}
                  </td>
                  <td className="applications-chevron">
                    {/* The real control; the row click above is a mouse convenience */}
                    <button
                      type="button"
                      className="applications-toggle"
                      aria-expanded={expanded}
                      aria-controls={detailId}
                      aria-label={`${expanded ? 'Hide' : 'Show'} details for ${application.first_name} ${application.last_name}`}
                      onClick={(event) => {
                        event.stopPropagation()
                        toggle()
                      }}
                    >
                      <i className={`fa-solid fa-chevron-${expanded ? 'up' : 'down'}`} aria-hidden="true"></i>
                    </button>
                  </td>
                </tr>
                {expanded && (
                  <tr className="applications-detail-row" id={detailId}>
                    <td colSpan={columns}>
                      <div className="applications-detail">
                        <div className="rsr-fact-grid">
                          <Fact label="Phone">{application.phone_number}</Fact>
                          <Fact label="Address">
                            {[application.address, application.city, application.state, application.zipcode]
                              .filter(Boolean)
                              .join(', ')}
                          </Fact>
                          <Fact label="Down Payment">
                            {application.down_payment ? currencyFormatter.format(application.down_payment) : null}
                          </Fact>
                          <Fact label="Prequal Result">{application.prequal_result_description}</Fact>
                          <Fact label="Program">
                            {[application.program_name, application.tier_name].filter(Boolean).join(' · ')}
                          </Fact>
                          <Fact label="Consent Recorded">{application.consent_at && formatDateTime(application.consent_at)}</Fact>
                        </div>
                      </div>
                    </td>
                  </tr>
                )}
              </Fragment>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

export default ApplicationsTable
