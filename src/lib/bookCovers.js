// Looks up a book cover via the Open Library API — free, no API key,
// no meaningful rate limit, CORS-enabled for browser use. (Google Books'
// keyless quota is shared across all anonymous callers and gets
// exhausted unpredictably, so it's not reliable enough for this.)
export async function findBookCoverUrl(title, author) {
  const t = title?.trim()
  if (!t) return null

  const params = new URLSearchParams({ title: t, limit: '1', fields: 'cover_i' })
  if (author?.trim()) params.set('author', author.trim())

  try {
    const res = await fetch(`https://openlibrary.org/search.json?${params}`)
    if (!res.ok) return null
    const data = await res.json()
    const coverId = data.docs?.[0]?.cover_i
    if (!coverId) return null
    return `https://covers.openlibrary.org/b/id/${coverId}-L.jpg`
  } catch {
    return null
  }
}
