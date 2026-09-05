import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from './useAuth'
import { todayISO } from '../lib/journalUtils'

export const REVIEW_STATUSES = [
  { id: 'draft',  label: 'Draft',  bg: '#FAEEDA', text: '#633806' },
  { id: 'ready',  label: 'Ready',  bg: '#E6F1FB', text: '#0C447C' },
  { id: 'posted', label: 'Posted', bg: '#EAF3DE', text: '#27500A' },
]

export function useBookReviews() {
  const { user } = useAuth()
  const [reviews, setReviews] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetchReviews = useCallback(async () => {
    if (!user) return
    setLoading(true)
    const { data, error } = await supabase
      .from('book_reviews')
      .select('*')
      .eq('user_id', user.id)
      .order('review_date', { ascending: false })
      .order('created_at', { ascending: false })
    if (error) setError(error.message)
    else setReviews(data || [])
    setLoading(false)
  }, [user])

  useEffect(() => {
    fetchReviews()
    if (!user) return
    const channel = supabase
      .channel('review-changes')
      .on('postgres_changes', {
        event: '*', schema: 'public', table: 'book_reviews',
        filter: `user_id=eq.${user.id}`
      }, fetchReviews)
      .subscribe()
    return () => supabase.removeChannel(channel)
  }, [fetchReviews, user])

  const addReview = useCallback(async (review) => {
    const { data, error } = await supabase
      .from('book_reviews')
      .insert({ ...review, user_id: user.id })
      .select()
      .single()
    if (error) throw error
    setReviews(prev => [data, ...prev])
    return data
  }, [user])

  const updateReview = useCallback(async (id, updates) => {
    const { data, error } = await supabase
      .from('book_reviews')
      .update(updates)
      .eq('id', id)
      .eq('user_id', user.id)
      .select()
      .single()
    if (error) throw error
    setReviews(prev => prev.map(r => r.id === id ? data : r))
    return data
  }, [user])

  const deleteReview = useCallback(async (id) => {
    const { error } = await supabase
      .from('book_reviews')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id)
    if (error) throw error
    setReviews(prev => prev.filter(r => r.id !== id))
  }, [user])

  // Imports rows from a script CSV, matching against existing reviews by
  // title+author so curated fields (status, rating, cover) are preserved
  // on re-import — only script/notes/series_position get overwritten.
  const importReviews = useCallback(async (rows, onProgress) => {
    if (!user) return { inserted: 0, updated: 0 }

    const { data: existing, error: fetchErr } = await supabase
      .from('book_reviews')
      .select('id, title, author')
      .eq('user_id', user.id)
    if (fetchErr) throw fetchErr

    const key = (t, a) => `${(t || '').trim().toLowerCase()}|${(a || '').trim().toLowerCase()}`
    const existingMap = new Map((existing || []).map(r => [key(r.title, r.author), r.id]))

    const toInsert = []
    const toUpdate = []
    rows.forEach(r => {
      const id = existingMap.get(key(r.title, r.author))
      if (id) {
        toUpdate.push({ id, user_id: user.id, script: r.script, notes: r.notes, series_position: r.series_position })
      } else {
        toInsert.push({
          ...r, user_id: user.id, review_date: todayISO(), status: 'draft', rating: null,
        })
      }
    })

    let done = 0
    const total = rows.length
    if (toInsert.length) {
      const { error } = await supabase.from('book_reviews').insert(toInsert)
      if (error) throw error
      done += toInsert.length
      onProgress?.(done, total)
    }
    if (toUpdate.length) {
      const { error } = await supabase.from('book_reviews').upsert(toUpdate, { onConflict: 'id' })
      if (error) throw error
      done += toUpdate.length
      onProgress?.(done, total)
    }

    await fetchReviews()
    return { inserted: toInsert.length, updated: toUpdate.length }
  }, [user, fetchReviews])

  return { reviews, loading, error, addReview, updateReview, deleteReview, importReviews, refetch: fetchReviews }
}
