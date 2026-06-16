import { useCallback } from 'react'
import { useConfig } from './useConfig'

export const DEFAULT_JOURNAL_TAGS = [
  { id: 'atr',        label: 'ATR Copilot',     bg: '#EEEEFF', text: '#3C3FB8' },
  { id: 'gxp',        label: 'GxP / Regulatory', bg: '#E6F4EE', text: '#1A6B42' },
  { id: 'book',       label: 'Book',             bg: '#FEF3E2', text: '#7A4E10' },
  { id: 'chuck',      label: 'CHUCK',            bg: '#F3E8FB', text: '#5E2989' },
  { id: 'personal',   label: 'Personal',         bg: '#FCE8E8', text: '#8C2020' },
]

export const ENTRY_TYPES = [
  { id: 'reflection', label: 'Reflection', bg: '#EEEDFE', text: '#3C3489' },
  { id: 'decision',   label: 'Decision',   bg: '#E6F1FB', text: '#0C447C' },
  { id: 'meeting',    label: 'Meeting',    bg: '#E1F5EE', text: '#085041' },
  { id: 'idea',       label: 'Idea',       bg: '#FAEEDA', text: '#633806' },
  { id: 'win',        label: 'Win',        bg: '#EAF3DE', text: '#27500A' },
]

export function useJournalConfig() {
  const { config, saveConfig } = useConfig()

  const journalTags = config.journalTags || DEFAULT_JOURNAL_TAGS

  const saveJournalTags = useCallback(async (tags) => {
    await saveConfig({ journalTags: tags })
  }, [saveConfig])

  return { journalTags, saveJournalTags }
}
