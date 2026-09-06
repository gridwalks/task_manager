import { supabase } from './supabase'

// Looks up the Amazon link already captured for this book in the user's
// imported Library (RLS scopes this to the current user automatically).
export async function findLibraryLink(title) {
  if (!title?.trim()) return null
  const { data, error } = await supabase
    .from('library_books')
    .select('link')
    .ilike('title', title.trim())
    .limit(1)
  if (error || !data?.length) return null
  return data[0].link || null
}
