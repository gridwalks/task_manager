function escapeHtml(s) {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

// Converts a plain-text script (blank-line-separated beats, e.g.
// "[HOOK ...]\ndialogue line") into the same rich-text HTML the
// Tiptap editor produces, so imported scripts render identically
// to hand-written ones.
export function scriptTextToHtml(text) {
  if (!text) return ''
  const blocks = text.split(/\n\s*\n/).map(b => b.trim()).filter(Boolean)
  return blocks.map(b => `<p>${escapeHtml(b).replace(/\n/g, '<br>')}</p>`).join('')
}

// Maps a row from a "TikTok Book Review Scripts" CSV export
// (#, Title, Author, Series / Position, TikTok Script (Book Review),
// Word Count, Notes / Accuracy Flags) to the book_reviews schema.
export function mapReviewRow(row) {
  const title = row['Title']?.trim()
  if (!title) return null

  return {
    title,
    author: row['Author']?.trim() || null,
    series_position: row['Series / Position']?.trim() || null,
    script: scriptTextToHtml(row['TikTok Script (Book Review)'] || ''),
    notes: row['Notes / Accuracy Flags']?.trim() || '',
  }
}
