import { useRef, useState } from 'react'
import { Upload, Loader, CheckCircle2, AlertCircle } from 'lucide-react'
import { csvToObjects } from '../../lib/csv'
import { mapAmazonRow } from '../../lib/libraryImport'

export default function LibraryImport({ onImport }) {
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
      const mapped = raw.map(mapAmazonRow).filter(Boolean)
      if (!mapped.length) throw new Error('No valid rows found in this file.')

      setState('importing')
      setProgress({ done: 0, total: mapped.length })
      const { imported } = await onImport(mapped, (done, tot) => setProgress({ done, total: tot }))
      setResult({ imported, skipped: raw.length - mapped.length })
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
          borderRadius: 'var(--radius)', padding: '12px 16px', cursor: busy ? 'default' : 'pointer',
          display: 'flex', flexDirection: 'column', gap: 6,
          background: dragOver ? '#EEEEFF' : 'var(--surface-2)',
          transition: 'all 0.15s',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
          {busy ? (
            <>
              <Loader size={14} color="var(--accent)" style={{ animation: 'spin 0.7s linear infinite' }} />
              <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                {state === 'parsing' ? 'Reading file…' : `Importing ${progress.done.toLocaleString()} / ${progress.total.toLocaleString()}…`}
              </span>
            </>
          ) : state === 'done' ? (
            <>
              <CheckCircle2 size={14} color="#27500A" />
              <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                Imported {result.imported.toLocaleString()} book{result.imported !== 1 ? 's' : ''}
                {result.skipped ? ` · skipped ${result.skipped} row(s)` : ''} · click to import another file
              </span>
            </>
          ) : state === 'error' ? (
            <>
              <AlertCircle size={14} color="#A32D2D" />
              <span style={{ fontSize: 12, color: '#A32D2D' }}>{error} · click to try again</span>
            </>
          ) : (
            <>
              <Upload size={14} color="var(--text-muted)" />
              <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                Drop your Amazon library CSV here or <span style={{ color: 'var(--accent)', textDecoration: 'underline' }}>browse</span>
              </span>
            </>
          )}
        </div>

        {state === 'importing' && (
          <div style={{ height: 3, borderRadius: 2, background: 'var(--border)', overflow: 'hidden' }}>
            <div style={{ height: '100%', width: `${pct}%`, background: 'var(--accent)', transition: 'width 0.2s' }} />
          </div>
        )}
      </div>

      <input ref={inputRef} type="file" accept=".csv,text/csv" style={{ display: 'none' }}
        onChange={e => { handleFile(e.target.files[0]); e.target.value = '' }} />
    </div>
  )
}
