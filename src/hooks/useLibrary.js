import { useCallback, useEffect, useRef, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from './useAuth'

export const PAGE_SIZE = 50
const IMPORT_BATCH = 300

export function useLibrary() {
  const { user } = useAuth()
  const [books, setBooks] = useState([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(0)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [ownershipFilter, setOwnershipFilter] = useState('all')
  const [formatFilter, setFormatFilter] = useState('all')
  const debounceRef = useRef(null)

  useEffect(() => {
    clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => setDebouncedSearch(search), 300)
    return () => clearTimeout(debounceRef.current)
  }, [search])

  useEffect(() => { setPage(0) }, [debouncedSearch, ownershipFilter, formatFilter])

  const fetchPage = useCallback(async () => {
    if (!user) return
    setLoading(true)
    let query = supabase
      .from('library_books')
      .select('*', { count: 'exact' })
      .eq('user_id', user.id)
      .order('acquired_date', { ascending: false, nullsFirst: false })
      .range(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE - 1)
    if (ownershipFilter !== 'all') query = query.eq('ownership', ownershipFilter)
    if (formatFilter !== 'all') query = query.eq('format', formatFilter)
    if (debouncedSearch) {
      const q = debouncedSearch.replace(/[%,]/g, '')
      query = query.or(`title.ilike.%${q}%,series.ilike.%${q}%,first_author.ilike.%${q}%`)
    }
    const { data, count, error } = await query
    if (!error) { setBooks(data || []); setTotal(count || 0) }
    setLoading(false)
  }, [user, page, ownershipFilter, formatFilter, debouncedSearch])

  useEffect(() => { fetchPage() }, [fetchPage])

  const importRows = useCallback(async (rows, onProgress) => {
    if (!user) return { imported: 0 }
    let done = 0
    for (let i = 0; i < rows.length; i += IMPORT_BATCH) {
      const batch = rows.slice(i, i + IMPORT_BATCH).map(r => ({ ...r, user_id: user.id }))
      const { error } = await supabase
        .from('library_books')
        .upsert(batch, { onConflict: 'user_id,asin' })
      if (error) throw error
      done += batch.length
      onProgress?.(done, rows.length)
    }
    await fetchPage()
    return { imported: done }
  }, [user, fetchPage])

  return {
    books, total, page, setPage, loading,
    search, setSearch, ownershipFilter, setOwnershipFilter, formatFilter, setFormatFilter,
    importRows,
  }
}
