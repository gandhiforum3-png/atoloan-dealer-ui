function LoadMore({ shown, total, hasMore, loading, onLoadMore, noun = 'applications' }) {
  if (total === 0) return null
  return (
    <div className="load-more">
      <p className="load-more-count" aria-live="polite">
        Showing {shown} of {total} {noun}
      </p>
      {hasMore && (
        <button type="button" className="btn btn-secondary" onClick={onLoadMore} disabled={loading}>
          {loading ? 'Loading…' : 'Load more'}
        </button>
      )}
    </div>
  )
}

export default LoadMore
