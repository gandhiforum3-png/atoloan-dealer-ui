import './RateSheetReview.css'

const dash = (value) => (value === null || value === undefined || value === '' ? '—' : value)

function CreditUnionInfoSection({ info }) {
  if (!info) return null
  const contact = info.contact || {}

  return (
    <section className="rsr-section">
      <h3 className="rsr-section-title">Credit Union</h3>
      <div className="rsr-fact-grid">
        <div>
          <p className="rsr-fact-label">Effective Date</p>
          <p className="rsr-fact-value">{dash(info.effective_date)}</p>
        </div>
        <div>
          <p className="rsr-fact-label">Max DTI</p>
          <p className="rsr-fact-value">{dash(info.maximum_debt_to_income_ratio)}</p>
        </div>
        <div>
          <p className="rsr-fact-label">Phone</p>
          <p className="rsr-fact-value">{dash(contact.phone)}</p>
        </div>
        <div>
          <p className="rsr-fact-label">Website</p>
          <p className="rsr-fact-value">{dash(contact.website)}</p>
        </div>
      </div>
      {info.membership_eligibility && (
        <p className="rsr-note">
          <strong>Membership:</strong> {info.membership_eligibility}
        </p>
      )}
    </section>
  )
}

function TermOptionRow({ term }) {
  return (
    <li className="rsr-term-row">
      <span>{dash(term.term_in_months)} mo</span>
      <span>{dash(term.rate)}</span>
      <span>
        {term.min_loan_amount || term.max_loan_amount
          ? `$${(term.min_loan_amount ?? 0).toLocaleString()} – $${(term.max_loan_amount ?? 0).toLocaleString()}`
          : '—'}
      </span>
    </li>
  )
}

function LoanTierCard({ tier }) {
  const terms = tier.term_options || []
  return (
    <div className="rsr-tier">
      <p className="rsr-tier-name">
        {dash(tier.tier_name)}
        {tier.credit_score_range && <span className="rsr-tier-score"> · {tier.credit_score_range}</span>}
      </p>
      {terms.length > 0 ? (
        <ul className="rsr-term-list">
          <li className="rsr-term-row rsr-term-row--header">
            <span>Term</span>
            <span>Rate</span>
            <span>Loan Amount</span>
          </li>
          {terms.map((term, i) => (
            <TermOptionRow key={i} term={term} />
          ))}
        </ul>
      ) : (
        <p className="rsr-note">No term options extracted.</p>
      )}
    </div>
  )
}

function LoanProgramCard({ program }) {
  const ltv = program.ltv_details || {}
  const tiers = program.loan_tiers || []

  return (
    <div className="rsr-program">
      <div className="rsr-program-header">
        <p className="rsr-program-name">{dash(program.program_name)}</p>
        {program.vehicle_type && <span className="rsr-badge">{program.vehicle_type}</span>}
      </div>
      <div className="rsr-fact-grid">
        <div>
          <p className="rsr-fact-label">Model Years</p>
          <p className="rsr-fact-value">{dash(program.model_year_range)}</p>
        </div>
        <div>
          <p className="rsr-fact-label">Mileage Limit</p>
          <p className="rsr-fact-value">{dash(program.mileage_limit)}</p>
        </div>
        <div>
          <p className="rsr-fact-label">Base LTV</p>
          <p className="rsr-fact-value">{dash(ltv.base_ltv)}</p>
        </div>
        <div>
          <p className="rsr-fact-label">Max LTV</p>
          <p className="rsr-fact-value">{dash(ltv.max_ltv)}</p>
        </div>
      </div>
      {tiers.length > 0 && (
        <div className="rsr-tier-list">
          {tiers.map((tier, i) => (
            <LoanTierCard key={i} tier={tier} />
          ))}
        </div>
      )}
    </div>
  )
}

function LoanProgramsSection({ programs }) {
  if (!programs || programs.length === 0) return null
  return (
    <section className="rsr-section">
      <h3 className="rsr-section-title">
        Loan Programs <span className="rsr-count">({programs.length})</span>
      </h3>
      {programs.map((program, i) => (
        <LoanProgramCard key={i} program={program} />
      ))}
    </section>
  )
}

function RatePolicySection({ policy }) {
  if (!policy) return null
  const discounts = policy.available_discounts || []
  const fees = policy.fees || []
  if (!policy.base_discount && discounts.length === 0 && fees.length === 0) return null

  return (
    <section className="rsr-section">
      <h3 className="rsr-section-title">Rate Policy</h3>
      {policy.base_discount && (
        <p className="rsr-note">
          <strong>Base Discount:</strong> {policy.base_discount}
        </p>
      )}
      {discounts.length > 0 && (
        <ul className="rsr-bullet-list">
          {discounts.map((discount, i) => (
            <li key={i}>
              {discount.description || 'Discount'}
              {discount.value && ` — ${discount.value}${discount.value_type === 'percentage' ? '%' : ''}`}
            </li>
          ))}
        </ul>
      )}
      {fees.length > 0 && (
        <>
          <p className="rsr-fact-label rsr-fact-label--spaced">Fees</p>
          <ul className="rsr-bullet-list">
            {fees.map((fee, i) => (
              <li key={i}>
                {fee.type || 'Fee'}
                {fee.value && ` — ${fee.value}`}
              </li>
            ))}
          </ul>
        </>
      )}
    </section>
  )
}

function GuidelinesSection({ guidelines }) {
  if (!guidelines) return null
  const hasContent =
    guidelines.income_requirements ||
    guidelines.debt_ratio_limits ||
    (guidelines.documentation_required || []).length > 0
  if (!hasContent) return null

  return (
    <section className="rsr-section">
      <h3 className="rsr-section-title">Guidelines</h3>
      <div className="rsr-fact-grid">
        <div>
          <p className="rsr-fact-label">Income Requirements</p>
          <p className="rsr-fact-value">{dash(guidelines.income_requirements)}</p>
        </div>
        <div>
          <p className="rsr-fact-label">Debt Ratio Limits</p>
          <p className="rsr-fact-value">{dash(guidelines.debt_ratio_limits)}</p>
        </div>
      </div>
      {guidelines.documentation_required?.length > 0 && (
        <ul className="rsr-bullet-list">
          {guidelines.documentation_required.map((doc, i) => (
            <li key={i}>{doc}</li>
          ))}
        </ul>
      )}
    </section>
  )
}

function RateSheetReview({ rateSheet }) {
  return (
    <div className="rate-sheet-review">
      <CreditUnionInfoSection info={rateSheet.credit_union_info} />
      <LoanProgramsSection programs={rateSheet.loan_programs} />
      <RatePolicySection policy={rateSheet.rate_policy} />
      <GuidelinesSection guidelines={rateSheet.guidelines} />
    </div>
  )
}

export default RateSheetReview
