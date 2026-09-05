import { Search, ExternalLink, PenLine } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useLibrary, PAGE_SIZE } from '../hooks/useLibrary'
import LibraryImport from '../components/library/LibraryImport'

const OWNERSHIP_OPTIONS = ['all', 'Purchase', 'KindleUnlimited', 'Sample', 'Prime', 'AudiblePlus', 'AudibleComplimentaryOriginal', 'KOLL', 'Subscription']
const FORMAT_OPTIONS = ['all', 'Kindle eBook', 'Audible Audiobook', 'Paperback', 'Hardcover', 'Board Book']

function formatDate(d) {
  if (!d) return ''
  return new Date(d + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

export default function LibraryPage() {
  const {
    books, total, page, setPage, loading,
    search, setSearch, ownershipFilter, setOwnershipFilter, formatFilter, setFormatFilter,
    importRows,
  } = useLibrary()
  const navigate = useNavigate()

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE))

  const startReview = (book) => {
    navigate('/reviews', {
      state: {
        prefill: {
          title: book.title,
          author: book.first_author || '',
          series_position: book.series
            ? `${book.series}${book.series_position ? ' #' + book.series_position : ''}`
            : '',
        },
      },
    })
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0, background: 'var(--bg)', overflow: 'hidden' }}>
      <div style={{ padding: '14px 20px', borderBottom: '0.5px solid var(--border)', background: 'var(--surface)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
          <span style={{ fontSize: 15, fontWeight: 500, color: 'var(--text-primary)' }}>My Library</span>
          <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{total.toLocaleString()} book{total !== 1 ? 's' : ''}</span>
        </div>
        <LibraryImport onImport={importRows} />
      </div>

      <div style={{ padding: '10px 20px', borderBottom: '0.5px solid var(--border)', display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center', background: 'var(--surface)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '5px 10px', border: '0.5px solid var(--border-mid)', borderRadius: 'var(--radius)', background: 'var(--surface-2)', minWidth: 220 }}>
          <Search size={12} color="var(--text-muted)" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search title, author, series…"
            style={{ flex: 1, border: 'none', outline: 'none', background: 'transparent', fontSize: 12, fontFamily: 'var(--font)', color: 'var(--text-primary)' }}
          />
        </div>
        <select value={ownershipFilter} onChange={e => setOwnershipFilter(e.target.value)} style={selectStyle}>
          {OWNERSHIP_OPTIONS.map(o => <option key={o} value={o}>{o === 'all' ? 'All ownership' : o}</option>)}
        </select>
        <select value={formatFilter} onChange={e => setFormatFilter(e.target.value)} style={selectStyle}>
          {FORMAT_OPTIONS.map(f => <option key={f} value={f}>{f === 'all' ? 'All formats' : f}</option>)}
        </select>
      </div>

      <div style={{ flex: 1, overflowY: 'auto' }}>
        {loading && <div style={{ padding: 30, textAlign: 'center', fontSize: 12, color: 'var(--text-muted)' }}>Loading…</div>}
        {!loading && books.length === 0 && (
          <div style={{ padding: 30, textAlign: 'center', fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.6 }}>
            {total === 0 ? 'No books yet. Import your Amazon library CSV above.' : 'No books match your filters.'}
          </div>
        )}
        {books.map(book => (
          <div key={book.id} style={{
            display: 'flex', alignItems: 'center', gap: 12, padding: '10px 20px',
            borderBottom: '0.5px solid var(--border)',
          }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {book.title}
              </div>
              <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {book.first_author}
                {book.series && ` · ${book.series}${book.series_position ? ' #' + book.series_position : ''}`}
              </div>
            </div>
            <div style={{ display: 'flex', gap: 4, flexShrink: 0 }}>
              {book.ownership && <Badge>{book.ownership}</Badge>}
              {book.format && <Badge muted>{book.format}</Badge>}
            </div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', width: 90, textAlign: 'right', flexShrink: 0 }}>
              {formatDate(book.acquired_date)}
            </div>
            <div style={{ display: 'flex', gap: 4, flexShrink: 0 }}>
              <button onClick={() => startReview(book)} title="Start a book review" style={iconBtnStyle}>
                <PenLine size={13} />
              </button>
              {book.link && (
                <a href={book.link} target="_blank" rel="noopener noreferrer" title="Open on Amazon" style={iconBtnStyle}>
                  <ExternalLink size={13} />
                </a>
              )}
            </div>
          </div>
        ))}
      </div>

      {totalPages > 1 && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, padding: '10px', borderTop: '0.5px solid var(--border)', background: 'var(--surface)' }}>
          <button disabled={page === 0} onClick={() => setPage(p => p - 1)} style={pagerBtn(page === 0)}>Prev</button>
          <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>Page {page + 1} of {totalPages}</span>
          <button disabled={page >= totalPages - 1} onClick={() => setPage(p => p + 1)} style={pagerBtn(page >= totalPages - 1)}>Next</button>
        </div>
      )}
    </div>
  )
}

const selectStyle = {
  fontSize: 12, padding: '5px 8px', border: '0.5px solid var(--border-mid)',
  borderRadius: 'var(--radius)', background: 'var(--surface-2)', color: 'var(--text-secondary)',
  fontFamily: 'var(--font)', cursor: 'pointer',
}

const iconBtnStyle = {
  display: 'flex', alignItems: 'center', justifyContent: 'center', width: 24, height: 24,
  border: '0.5px solid var(--border)', borderRadius: 'var(--radius)', background: 'var(--surface-2)',
  color: 'var(--text-secondary)', cursor: 'pointer', textDecoration: 'none',
}

function pagerBtn(disabled) {
  return {
    fontSize: 11, padding: '4px 10px', border: '0.5px solid var(--border-mid)', borderRadius: 'var(--radius)',
    background: disabled ? 'var(--surface-2)' : 'var(--surface)', color: disabled ? 'var(--text-muted)' : 'var(--text-secondary)',
    cursor: disabled ? 'default' : 'pointer', fontFamily: 'var(--font)', opacity: disabled ? 0.5 : 1,
  }
}

function Badge({ children, muted }) {
  return (
    <span style={{
      fontSize: 9, padding: '2px 7px', borderRadius: 10,
      background: muted ? 'var(--surface-2)' : '#E6F1FB', color: muted ? 'var(--text-muted)' : '#0C447C',
      border: muted ? '0.5px solid var(--border)' : 'none', whiteSpace: 'nowrap',
    }}>
      {children}
    </span>
  )
}
