import { useEffect, useRef, useState } from 'react'
import { Paperclip, X, FileText, Upload, Loader } from 'lucide-react'
import { uploadAttachment, getSignedUrl, deleteAttachment, isImage, formatFileSize } from '../../lib/storage'
import { useAuth } from '../../hooks/useAuth'

const ACCEPT = 'image/jpeg,image/png,image/webp,image/gif,application/pdf'

function FilePreview({ attachment, onRemove }) {
  const [url, setUrl] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getSignedUrl(attachment.path)
      .then(setUrl)
      .finally(() => setLoading(false))
  }, [attachment.path])

  return (
    <div style={{
      position: 'relative', borderRadius: 'var(--radius)',
      border: '0.5px solid var(--border)', overflow: 'hidden',
      background: 'var(--surface-2)',
    }}>
      {/* Preview area */}
      <div style={{ width: 90, height: 72, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
        {loading ? (
          <Loader size={16} color="var(--text-muted)" style={{ animation: 'spin 0.7s linear infinite' }} />
        ) : isImage(attachment.type) && url ? (
          <img src={url} alt={attachment.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        ) : (
          <a href={url} target="_blank" rel="noopener noreferrer"
            style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, textDecoration: 'none', padding: 8 }}>
            <FileText size={24} color="var(--accent)" />
            <span style={{ fontSize: 9, color: 'var(--text-muted)', textAlign: 'center', wordBreak: 'break-all', lineHeight: 1.2 }}>
              {attachment.name.length > 12 ? attachment.name.slice(0, 10) + '…' : attachment.name}
            </span>
          </a>
        )}
      </div>

      {/* File info */}
      <div style={{ padding: '3px 6px', borderTop: '0.5px solid var(--border)', background: 'var(--surface)' }}>
        <div style={{ fontSize: 9, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {attachment.name.length > 14 ? attachment.name.slice(0, 12) + '…' : attachment.name}
        </div>
        <div style={{ fontSize: 8, color: 'var(--text-muted)' }}>{formatFileSize(attachment.size)}</div>
      </div>

      {/* Open link for images */}
      {isImage(attachment.type) && url && (
        <a href={url} target="_blank" rel="noopener noreferrer"
          style={{ position: 'absolute', inset: 0, top: 0, height: 72, display: 'block' }} />
      )}

      {/* Remove button */}
      <button onClick={() => onRemove(attachment)}
        style={{
          position: 'absolute', top: 4, right: 4, width: 18, height: 18, borderRadius: '50%',
          background: 'rgba(0,0,0,0.5)', border: 'none', cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff',
          zIndex: 1,
        }}>
        <X size={10} />
      </button>
    </div>
  )
}

export default function AttachmentZone({ attachments = [], onChange }) {
  const { user } = useAuth()
  const inputRef = useRef()
  const [uploading, setUploading] = useState(false)
  const [dragOver, setDragOver] = useState(false)
  const [error, setError] = useState(null)

  const handleFiles = async (files) => {
    const valid = Array.from(files).filter(f => f.size <= 10 * 1024 * 1024)
    const oversized = Array.from(files).filter(f => f.size > 10 * 1024 * 1024)
    if (oversized.length) setError(`${oversized.length} file(s) exceed 10 MB limit and were skipped.`)
    else setError(null)
    if (!valid.length) return

    setUploading(true)
    try {
      const uploaded = await Promise.all(valid.map(f => uploadAttachment(user.id, f)))
      onChange([...attachments, ...uploaded])
    } catch (e) {
      setError('Upload failed: ' + e.message)
    } finally {
      setUploading(false)
    }
  }

  const handleRemove = async (attachment) => {
    try { await deleteAttachment(attachment.path) } catch {}
    onChange(attachments.filter(a => a.path !== attachment.path))
  }

  const onDrop = (e) => {
    e.preventDefault(); setDragOver(false)
    handleFiles(e.dataTransfer.files)
  }

  return (
    <div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: attachments.length ? 10 : 0 }}>
        {attachments.map(att => (
          <FilePreview key={att.path} attachment={att} onRemove={handleRemove} />
        ))}
      </div>

      {/* Drop zone */}
      <div
        onDragOver={e => { e.preventDefault(); setDragOver(true) }}
        onDragLeave={() => setDragOver(false)}
        onDrop={onDrop}
        onClick={() => inputRef.current?.click()}
        style={{
          border: `1.5px dashed ${dragOver ? 'var(--accent)' : 'var(--border-mid)'}`,
          borderRadius: 'var(--radius)', padding: '12px 16px', cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
          background: dragOver ? '#EEEEFF' : 'var(--surface-2)',
          transition: 'all 0.15s',
        }}
      >
        {uploading ? (
          <>
            <Loader size={14} color="var(--accent)" style={{ animation: 'spin 0.7s linear infinite' }} />
            <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Uploading…</span>
          </>
        ) : (
          <>
            <Upload size={14} color="var(--text-muted)" />
            <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
              Drop files here or <span style={{ color: 'var(--accent)', textDecoration: 'underline' }}>browse</span>
            </span>
            <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>· JPG, PNG, PDF · max 10 MB</span>
          </>
        )}
      </div>

      {error && <div style={{ fontSize: 10, color: '#A32D2D', marginTop: 4 }}>{error}</div>}

      <input ref={inputRef} type="file" multiple accept={ACCEPT}
        style={{ display: 'none' }}
        onChange={e => { handleFiles(e.target.files); e.target.value = '' }} />
    </div>
  )
}
