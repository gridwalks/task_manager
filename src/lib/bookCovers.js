// Looks up a book cover via the Open Library API — free, no API key,
// no meaningful rate limit, CORS-enabled for browser use. (Google Books'
// keyless quota is shared across all anonymous callers and gets
// exhausted unpredictably, so it's not reliable enough for this.)

// Prefer hardcover editions — publishers put their definitive cover art
// there, and a work's aggregate "cover_i" can otherwise point at an
// oddball edition (a large-print badge variant, a foreign printing,
// a reused image, etc). Only fall back to other formats if no hardcover
// edition has a cover at all.
const FORMAT_PRIORITY = ['hardcover', 'paperback', 'trade paperback', 'mass market paperback']

async function findBetterCoverId(workKey, fallbackId) {
  try {
    const res = await fetch(`https://openlibrary.org${workKey}/editions.json?limit=50`)
    if (!res.ok) return fallbackId
    const data = await res.json()
    const editions = (data.entries || []).filter(e => e.covers?.[0] > 0)

    for (const format of FORMAT_PRIORITY) {
      const matches = editions
        .filter(e => (e.physical_format || '').toLowerCase() === format)
        .sort((a, b) => (Date.parse(b.publish_date) || 0) - (Date.parse(a.publish_date) || 0))
      if (matches.length) return matches[0].covers[0]
    }
    return fallbackId
  } catch {
    return fallbackId
  }
}

export async function findBookCoverUrl(title, author) {
  const t = title?.trim()
  if (!t) return null

  const params = new URLSearchParams({ title: t, limit: '1', fields: 'key,cover_i' })
  if (author?.trim()) params.set('author', author.trim())

  let coverId
  try {
    const res = await fetch(`https://openlibrary.org/search.json?${params}`)
    if (!res.ok) return null
    const data = await res.json()
    const doc = data.docs?.[0]
    if (!doc) return null
    coverId = doc.key ? await findBetterCoverId(doc.key, doc.cover_i) : doc.cover_i
  } catch {
    return null
  }

  if (!coverId) return null
  return `https://covers.openlibrary.org/b/id/${coverId}-L.jpg`
}
