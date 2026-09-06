import { supabase } from './supabase'

function stripSeriesSuffix(title) {
  return title.replace(/\s*\([^)]*\)\s*$/, '').trim()
}

async function matchByTitle(pattern) {
  const { data } = await supabase
    .from('library_books')
    .select('link')
    .ilike('title', pattern)
    .limit(1)
  return data?.[0]?.link || null
}

// Looks up the Amazon link already captured for this book in the user's
// imported Library (RLS scopes this to the current user automatically).
// A review's title is usually short and clean ("Web of Vows and
// Vengeance"), while Amazon's own catalog title is usually much longer
// ("Web of Vows and Vengeance: The Award-Winning BookTok ... (The
// Hirathean Path Book 1)") — so an exact match rarely hits. Tries, in
// order: exact match, the typed title as a prefix (covers the case
// above), then the typed title with any trailing "(Series Book N)"
// parenthetical stripped as a prefix (covers the reverse case, where the
// review title itself carries series info the Library title doesn't).
export async function findLibraryLink(title) {
  const t = title?.trim()
  if (!t) return null

  let link = await matchByTitle(t)
  if (link) return link

  link = await matchByTitle(`${t}%`)
  if (link) return link

  const base = stripSeriesSuffix(t)
  if (base && base !== t) {
    link = await matchByTitle(`${base}%`)
    if (link) return link
  }

  return null
}
