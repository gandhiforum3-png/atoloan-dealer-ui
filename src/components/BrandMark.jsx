import './BrandMark.css'

function BrandMark({ variant = 'sidebar' }) {
  return (
    <div className={`brand-mark brand-mark--${variant}`}>
      <span className="brand-mark-icon">
        <i className="fa-solid fa-heart-pulse" aria-hidden="true"></i>
      </span>
      <span className="brand-mark-name">Atoloan Dealer Hub</span>
    </div>
  )
}

export default BrandMark
