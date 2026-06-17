function stripHtml(html) {
  return html ? html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim() : ''
}

export function wordCount(text) {
  const plain = stripHtml(text)
  if (!plain) return 0
  return plain.split(/\s+/).filter(Boolean).length
}

export function readTime(text) {
  const wc = wordCount(text)
  const mins = Math.round(wc / 200)
  if (mins < 1) return '< 1 min'
  return `${mins} min`
}

export function wordCountLabel(text) {
  const wc = wordCount(text)
  const rt = readTime(text)
  return `${wc} word${wc !== 1 ? 's' : ''} · ${rt} read`
}

export function formatEntryDate(dateStr) {
  if (!dateStr) return ''
  const d = new Date(dateStr + 'T12:00:00')
  return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
}

export function formatEntryDateLong(dateStr) {
  if (!dateStr) return ''
  const d = new Date(dateStr + 'T12:00:00')
  return d.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })
}

export function todayISO() {
  return new Date().toISOString().split('T')[0]
}

export function groupEntriesByMonth(entries) {
  const groups = {}
  entries.forEach(e => {
    const key = e.entry_date ? e.entry_date.slice(0, 7) : 'unknown'
    if (!groups[key]) groups[key] = []
    groups[key].push(e)
  })
  return Object.entries(groups).sort((a, b) => b[0].localeCompare(a[0]))
}

export function formatMonthKey(key) {
  if (key === 'unknown') return 'Unknown date'
  const [y, m] = key.split('-')
  return new Date(parseInt(y), parseInt(m) - 1, 1)
    .toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
}
