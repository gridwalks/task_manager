import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from './useAuth'

const DEFAULT_CONFIG = {
  boardName: 'taskboard',
  accent: '#4F52D9',
  tags: [
    { id: 'qms', label: 'QMS', bg: '#EEF0FF', text: '#3C3FB8' },
    { id: 'atr', label: 'ATR', bg: '#E6F4EE', text: '#1A6B42' },
    { id: 'book', label: 'Book', bg: '#FEF3E2', text: '#7A4E10' },
    { id: 'chuck', label: 'CHUCK', bg: '#F3E8FB', text: '#5E2989' },
    { id: 'infra', label: 'Infra', bg: '#FCE8E8', text: '#8C2020' },
  ],
  assignees: [
    { id: 'CG', name: 'Chris Gent', initials: 'CG', bg: '#EEF0FF', text: '#3C3FB8' },
    { id: 'MR', name: 'M. Rodriguez', initials: 'MR', bg: '#E6F4EE', text: '#1A6B42' },
    { id: 'JP', name: 'J. Park', initials: 'JP', bg: '#FEF3E2', text: '#7A4E10' },
    { id: 'SL', name: 'S. Lee', initials: 'SL', bg: '#F3E8FB', text: '#5E2989' },
  ],
  columns: [
    { id: 'todo', label: 'To do', color: '#A0A5B8' },
    { id: 'doing', label: 'In progress', color: '#4F52D9' },
    { id: 'review', label: 'In review', color: '#C17A2B' },
    { id: 'done', label: 'Done', color: '#2E8A5B' },
  ],
}

export function useConfig() {
  const { user } = useAuth()
  const [config, setConfigState] = useState(DEFAULT_CONFIG)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) return
    supabase
      .from('board_config')
      .select('config')
      .eq('user_id', user.id)
      .maybeSingle()
      .then(({ data }) => {
        if (data?.config) setConfigState({ ...DEFAULT_CONFIG, ...data.config })
        setLoading(false)
      })
  }, [user])

  const saveConfig = useCallback(async (updates) => {
    const next = { ...config, ...updates }
    setConfigState(next)
    await supabase.from('board_config').upsert({ user_id: user.id, config: next }, { onConflict: 'user_id' })
  }, [config, user])

  return { config, saveConfig, loading }
}
