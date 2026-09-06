import { supabase } from './supabase'

function stripSeriesSuffix(title) {
  return title.replace(/\s*\([^)]*\)\s*$/, '').trim()
}

// Looks up the Amazon link already captured for this book in the user's
// imported Library (RLS scopes this to the current user automatically).
// Tries an exact title match first, then a prefix match against the
// series-suffix-stripped title — Amazon listings often embed series info
// in parentheses ("… (Dungeon Crawler Carl Book 6)") that a manually
// typed review title may omit.
export async function findLibraryLink(title) {
  const t = title?.trim()
  if (!t) return null

  const { data: exact } = await supabase
    .from('library_books')
    .select('link')
    .ilike('title', t)
    .limit(1)
  if (exact?.length) return exact[0].link || null

  const base = stripSeriesSuffix(t)
  if (base && base !== t) {
    const { data: prefix } = await supabase
      .from('library_books')
      .select('link')
      .ilike('title', `${base}%`)
      .limit(1)
    if (prefix?.length) return prefix[0].link || null
  }

  return null
}
