import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from './useAuth'

export function useExpenses() {
  const { user } = useAuth()
  const [expenses, setExpenses] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetchExpenses = useCallback(async () => {
    if (!user) return
    setLoading(true)
    const { data, error } = await supabase
      .from('expenses')
      .select('*')
      .eq('user_id', user.id)
      .order('date', { ascending: false })
      .order('created_at', { ascending: false })
    if (error) setError(error.message)
    else setExpenses(data || [])
    setLoading(false)
  }, [user])

  useEffect(() => { fetchExpenses() }, [fetchExpenses])

  const addExpense = useCallback(async (expense) => {
    const { data, error } = await supabase
      .from('expenses')
      .insert({ ...expense, user_id: user.id })
      .select()
      .single()
    if (error) throw error
    setExpenses(prev => [data, ...prev])
    return data
  }, [user])

  const updateExpense = useCallback(async (id, updates) => {
    const { data, error } = await supabase
      .from('expenses')
      .update(updates)
      .eq('id', id)
      .eq('user_id', user.id)
      .select()
      .single()
    if (error) throw error
    setExpenses(prev => prev.map(e => e.id === id ? data : e))
    return data
  }, [user])

  const deleteExpense = useCallback(async (id) => {
    const { error } = await supabase
      .from('expenses')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id)
    if (error) throw error
    setExpenses(prev => prev.filter(e => e.id !== id))
  }, [user])

  return { expenses, loading, error, addExpense, updateExpense, deleteExpense, refetch: fetchExpenses }
}
