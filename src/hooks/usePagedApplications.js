import { useCallback, useEffect, useState } from 'react'
import { friendlyError } from '../utils/format'

const PAGE_SIZE = 25

// Loads { applications, total } pages from `fetchPage({ limit, offset })`.
// Starts over from the first page whenever fetchPage changes (e.g. a new filter);
// results are tagged with the fetchPage they came from, so stale ones read as loading.
export default function usePagedApplications(fetchPage) {
  const [result, setResult] = useState({ source: null, applications: [], total: 0, error: null })
  const [loadingMore, setLoadingMore] = useState(false)

  useEffect(() => {
    let cancelled = false
    fetchPage({ limit: PAGE_SIZE, offset: 0 })
      .then((page) => {
        if (!cancelled) setResult({ source: fetchPage, applications: page.applications, total: page.total, error: null })
      })
      .catch((err) => {
        if (!cancelled) setResult({ source: fetchPage, applications: [], total: 0, error: friendlyError(err) })
      })
    return () => {
      cancelled = true
    }
  }, [fetchPage])

  const loadMore = useCallback(async () => {
    setLoadingMore(true)
    try {
      const page = await fetchPage({ limit: PAGE_SIZE, offset: result.applications.length })
      setResult((prev) => ({ ...prev, applications: [...prev.applications, ...page.applications], total: page.total }))
    } catch (err) {
      setResult((prev) => ({ ...prev, error: friendlyError(err) }))
    } finally {
      setLoadingMore(false)
    }
  }, [fetchPage, result.applications.length])

  const current = result.source === fetchPage
  const status = !current ? 'loading' : result.error && result.applications.length === 0 ? 'error' : 'ready'
  return {
    applications: current ? result.applications : [],
    total: current ? result.total : 0,
    status,
    error: result.error,
    loadingMore,
    loadMore,
    hasMore: current && result.applications.length < result.total,
  }
}
