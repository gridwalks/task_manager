function toInt(v) {
  const n = parseInt(v, 10)
  return Number.isFinite(n) ? n : null
}

function toDate(v) {
  if (!v) return null
  const [m, d, y] = v.split('/')
  if (!m || !d || !y) return null
  return `${y.padStart(4, '0')}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`
}

function toArray(v, sep) {
  if (!v) return []
  return v.split(sep).map(s => s.trim()).filter(Boolean)
}

// Maps a row from an "Amazon Books" CSV export to the library_books schema.
export function mapAmazonRow(row) {
  const asin = row['ISBN / ASIN (Amazon ID)']?.trim()
  const title = row['Title']?.trim()
  if (!asin || !title) return null

  return {
    asin,
    title,
    link: row['Link']?.trim() || null,
    acquired_date: toDate(row['Acquired Date']?.trim()),
    ownership: row['Ownership']?.trim() || null,
    source: row['Source']?.trim() || null,
    format: row['Format']?.trim() || null,
    origin: row['Origin']?.trim() || null,
    pages: toInt(row['Pages']),
    listening_length: row['Listening Length']?.trim() || null,
    genres: toArray(row['Genres'], '|'),
    series_position: toInt(row['Series Position']),
    series: row['Series']?.trim() || null,
    first_author: row['First Author']?.trim() || null,
    all_authors: toArray(row['All Authors'], ','),
  }
}
