import { useRef, useState } from 'react'
import { Upload, Loader, CheckCircle2, AlertCircle } from 'lucide-react'
import { csvToObjects } from '../../lib/csv'
import { mapReviewRow } from '../../lib/reviewImport'

export default function ReviewImport({ onImport }) {
  const inputRef = useRef()
  const [state, setState] = useState('idle') // idle | parsing | importing | done | error
  const [progress, setProgress] = useState({ done: 0, total: 0 })
  const [result, setResult] = useState(null)
  const [error, setError] = useState(null)
  const [dragOver, setDragOver] = useState(false)

  const busy = state === 'parsing' || state === 'importing'

  const handleFile = async (file) => {
    if (!file || busy) return
    if (!file.name.toLowerCase().endsWith('.csv')) {
      setError('Please choose a .csv file.')
      setState('error')
      return
    }
    setError(null)
    setState('parsing')
    try {
      const text = await file.text()
      const raw = csvToObjects(text)
      const mapped = raw.map(mapReviewRow).filter(Boolean)
      if (!mapped.length) throw new Error('No valid rows found in this file.')

      setState('importing')
      setProgress({ done: 0, total: mapped.length })
      const { inserted, updated } = await onImport(mapped, (done, tot) => setProgress({ done, total: tot }))
      setResult({ inserted, updated, skipped: raw.length - mapped.length })
      setState('done')
    } catch (e) {
      setError(e.message)
      setState('error')
    }
  }

  const pct = progress.total ? Math.round((progress.done / progress.total) * 100) : 0

  return (
    <div>
      <div
        onDragOver={e => { e.preventDefault(); if (!busy) setDragOver(true) }}
        onDragLeave={() => setDragOver(false)}
        onDrop={e => { e.preventDefault(); setDragOver(false); handleFile(e.dataTransfer.files[0]) }}
        onClick={() => inputRef.current?.click()}
        style={{
          border: `1.5px dashed ${dragOver ? 'var(--accent)' : 'var(--border-mid)'}`,
          borderRadius: 'var(--radius)', padding: '6px 8px', cursor: busy ? 'default' : 'pointer',
          display: 'flex', flexDirection: 'column', gap: 4,
          background: dragOver ? '#EEEEFF' : 'var(--surface-2)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          {busy ? (
            <>
              <Loader size={11} color="var(--accent)" style={{ animation: 'spin 0.7s linear infinite' }} />
              <span style={{ fontSize: 10, color: 'var(--text-secondary)' }}>
                {state === 'parsing' ? 'Reading file…' : `Importing ${progress.done} / ${progress.total}…`}
              </span>
            </>
          ) : state === 'done' ? (
            <>
              <CheckCircle2 size={11} color="#27500A" />
              <span style={{ fontSize: 10, color: 'var(--text-secondary)' }}>
                {result.inserted} new, {result.updated} updated
                {result.skipped ? `, ${result.skipped} skipped` : ''} · click to import another
              </span>
            </>
          ) : state === 'error' ? (
            <>
              <AlertCircle size={11} color="#A32D2D" />
              <span style={{ fontSize: 10, color: '#A32D2D' }}>{error} · click to try again</span>
            </>
          ) : (
            <>
              <Upload size={11} color="var(--text-muted)" />
              <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>Import scripts from CSV…</span>
            </>
          )}
        </div>

        {state === 'importing' && (
          <div style={{ height: 2, borderRadius: 2, background: 'var(--border)', overflow: 'hidden' }}>
            <div style={{ height: '100%', width: `${pct}%`, background: 'var(--accent)', transition: 'width 0.2s' }} />
          </div>
        )}
      </div>

      <input ref={inputRef} type="file" accept=".csv,text/csv" style={{ display: 'none' }}
        onChange={e => { handleFile(e.target.files[0]); e.target.value = '' }} />
    </div>
  )
}
