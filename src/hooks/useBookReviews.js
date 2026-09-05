import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from './useAuth'

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

  return { reviews, loading, error, addReview, updateReview, deleteReview, refetch: fetchReviews }
}
