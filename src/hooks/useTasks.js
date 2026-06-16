import { createContext, useCallback, useContext, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from './useAuth'

const TasksContext = createContext(null)

export function TasksProvider({ children }) {
  const { user } = useAuth()
  const [tasks, setTasks] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetch = useCallback(async () => {
    if (!user) return
    setLoading(true)
    const { data, error } = await supabase
      .from('tasks')
      .select('*')
      .eq('user_id', user.id)
      .order('position', { ascending: true })
    if (error) setError(error.message)
    else setTasks(data)
    setLoading(false)
  }, [user])

  useEffect(() => {
    fetch()
    if (!user) return
    const channel = supabase
      .channel('tasks-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tasks', filter: `user_id=eq.${user.id}` }, fetch)
      .subscribe()
    return () => supabase.removeChannel(channel)
  }, [fetch, user])

  const addTask = useCallback(async (task) => {
    const maxPos = tasks.filter(t => t.status === task.status).reduce((m, t) => Math.max(m, t.position ?? 0), 0)
    const { data, error } = await supabase
      .from('tasks')
      .insert({ ...task, user_id: user.id, position: maxPos + 1 })
      .select()
      .single()
    if (error) throw error
    setTasks(prev => [...prev, data])
    return data
  }, [tasks, user])

  const updateTask = useCallback(async (id, updates) => {
    const { data, error } = await supabase
      .from('tasks')
      .update(updates)
      .eq('id', id)
      .eq('user_id', user.id)
      .select()
      .single()
    if (error) throw error
    setTasks(prev => prev.map(t => t.id === id ? data : t))
    return data
  }, [user])

  const deleteTask = useCallback(async (id) => {
    const { error } = await supabase
      .from('tasks')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id)
    if (error) throw error
    setTasks(prev => prev.filter(t => t.id !== id))
  }, [user])

  const moveTask = useCallback(async (id, newStatus, newPosition) => {
    await updateTask(id, { status: newStatus, position: newPosition })
    setTasks(prev => prev.map(t => t.id === id ? { ...t, status: newStatus, position: newPosition } : t))
  }, [updateTask])

  return (
    <TasksContext.Provider value={{ tasks, loading, error, addTask, updateTask, deleteTask, moveTask, refetch: fetch }}>
      {children}
    </TasksContext.Provider>
  )
}

export function useTasks() {
  return useContext(TasksContext)
}
