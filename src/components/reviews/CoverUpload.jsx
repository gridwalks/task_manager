import { useEffect, useRef, useState } from 'react'
import { ImagePlus, X, Loader } from 'lucide-react'
import { uploadCover, getCoverUrl, deleteCover } from '../../lib/storage'
import { useAuth } from '../../hooks/useAuth'

const ACCEPT = 'image/jpeg,image/png,image/webp,image/gif'
const MAX_SIZE = 5 * 1024 * 1024

export default function CoverUpload({ coverPath, onChange, width = 96 }) {
  const { user } = useAuth()
  const inputRef = useRef()
  const [url, setUrl] = useState(null)
  const [uploading, setUploading] = useState(false)
  const [dragOver, setDragOver] = useState(false)
  const [error, setError] = useState(null)

  const height = Math.round(width * 1.5)

  useEffect(() => {
    let cancelled = false
    setUrl(null)
    if (coverPath) {
      getCoverUrl(coverPath)
        .then(u => { if (!cancelled) setUrl(u) })
        .catch(() => { if (!cancelled) setUrl(null) })
    }
    return () => { cancelled = true }
  }, [coverPath])

  const handleFile = async (file) => {
    if (!file) return
    if (!file.type.startsWith('image/')) { setError('Covers must be an image.'); return }
    if (file.size > MAX_SIZE) { setError('Cover exceeds the 5 MB limit.'); return }
    setError(null)
    setUploading(true)
    try {
      const uploaded = await uploadCover(user.id, file)
      if (coverPath) { try { await deleteCover(coverPath) } catch { /* old file may be gone */ } }
      onChange(uploaded.path)
    } catch (e) {
      setError('Upload failed: ' + e.message)
    } finally {
      setUploading(false)
    }
  }

  const handleRemove = async (e) => {
    e.stopPropagation()
    if (coverPath) { try { await deleteCover(coverPath) } catch { /* old file may be gone */ } }
    onChange(null)
  }

  return (
    <div style={{ flexShrink: 0 }}>
      <div
        onDragOver={e => { e.preventDefault(); setDragOver(true) }}
        onDragLeave={() => setDragOver(false)}
        onDrop={e => { e.preventDefault(); setDragOver(false); handleFile(e.dataTransfer.files[0]) }}
        onClick={() => inputRef.current?.click()}
        role="button"
        tabIndex={0}
        onKeyDown={e => e.key === 'Enter' && inputRef.current?.click()}
        aria-label={coverPath ? 'Replace book cover' : 'Add book cover'}
        title={coverPath ? 'Click to replace cover' : 'Add a book cover'}
        style={{
          position: 'relative', width, height,
          border: `1.5px ${coverPath ? 'solid var(--border)' : `dashed ${dragOver ? 'var(--accent)' : 'var(--border-mid)'}`}`,
          borderRadius: 'var(--radius)', overflow: 'hidden', cursor: 'pointer',
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          gap: 5, background: dragOver ? '#EEEEFF' : 'var(--surface-2)',
          transition: 'all 0.15s',
        }}
      >
        {uploading ? (
          <Loader size={16} color="var(--accent)" style={{ animation: 'spin 0.7s linear infinite' }} />
        ) : coverPath && url ? (
          <img src={url} alt="Book cover" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        ) : coverPath ? (
          <Loader size={14} color="var(--text-muted)" style={{ animation: 'spin 0.7s linear infinite' }} />
        ) : (
          <>
            <ImagePlus size={16} color="var(--text-muted)" />
            <span style={{ fontSize: 9, color: 'var(--text-muted)', textAlign: 'center', lineHeight: 1.3, padding: '0 6px' }}>
              Add cover
            </span>
          </>
        )}

        {coverPath && !uploading && (
          <button onClick={handleRemove} aria-label="Remove cover"
            style={{
              position: 'absolute', top: 4, right: 4, width: 18, height: 18, borderRadius: '50%',
              background: 'rgba(0,0,0,0.55)', border: 'none', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff',
            }}>
            <X size={10} />
          </button>
        )}
      </div>

      {error && <div style={{ fontSize: 9, color: '#A32D2D', marginTop: 4, maxWidth: width }}>{error}</div>}

      <input ref={inputRef} type="file" accept={ACCEPT}
        style={{ display: 'none' }}
        onChange={e => { handleFile(e.target.files[0]); e.target.value = '' }} />
    </div>
  )
}

export function CoverThumb({ coverPath, width = 34 }) {
  const [url, setUrl] = useState(null)
  const height = Math.round(width * 1.5)

  useEffect(() => {
    let cancelled = false
    setUrl(null)
    if (coverPath) {
      getCoverUrl(coverPath)
        .then(u => { if (!cancelled) setUrl(u) })
        .catch(() => { if (!cancelled) setUrl(null) })
    }
    return () => { cancelled = true }
  }, [coverPath])

  if (!coverPath) return null
  return (
    <div style={{
      width, height, flexShrink: 0, borderRadius: 3, overflow: 'hidden',
      border: '0.5px solid var(--border)', background: 'var(--surface-2)',
    }}>
      {url && <img src={url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />}
    </div>
  )
}
