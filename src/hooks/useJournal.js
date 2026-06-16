import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from './useAuth'

export function useJournal() {
  const { user } = useAuth()
  const [entries, setEntries] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetchEntries = useCallback(async () => {
    if (!user) return
    setLoading(true)
    const { data, error } = await supabase
      .from('journal_entries')
      .select('*')
      .eq('user_id', user.id)
      .order('entry_date', { ascending: false })
      .order('created_at', { ascending: false })
    if (error) setError(error.message)
    else setEntries(data || [])
    setLoading(false)
  }, [user])

  useEffect(() => {
    fetchEntries()
    if (!user) return
    const channel = supabase
      .channel('journal-changes')
      .on('postgres_changes', {
        event: '*', schema: 'public', table: 'journal_entries',
        filter: `user_id=eq.${user.id}`
      }, fetchEntries)
      .subscribe()
    return () => supabase.removeChannel(channel)
  }, [fetchEntries, user])

  const addEntry = useCallback(async (entry) => {
    const { data, error } = await supabase
      .from('journal_entries')
      .insert({ ...entry, user_id: user.id })
      .select()
      .single()
    if (error) throw error
    setEntries(prev => [data, ...prev])
    return data
  }, [user])

  const updateEntry = useCallback(async (id, updates) => {
    const { data, error } = await supabase
      .from('journal_entries')
      .update(updates)
      .eq('id', id)
      .eq('user_id', user.id)
      .select()
      .single()
    if (error) throw error
    setEntries(prev => prev.map(e => e.id === id ? data : e))
    return data
  }, [user])

  const deleteEntry = useCallback(async (id) => {
    const { error } = await supabase
      .from('journal_entries')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id)
    if (error) throw error
    setEntries(prev => prev.filter(e => e.id !== id))
  }, [user])

  return { entries, loading, error, addEntry, updateEntry, deleteEntry, refetch: fetchEntries }
}
