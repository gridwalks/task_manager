import { supabase } from './supabase'

const BUCKET = 'expense-attachments'
const COVER_BUCKET = 'book-covers'

async function uploadTo(bucket, userId, file) {
  const ext = file.name.split('.').pop()
  const path = `${userId}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`

  const { error } = await supabase.storage.from(bucket).upload(path, file, {
    cacheControl: '3600',
    upsert: false,
  })
  if (error) throw error

  return { path, name: file.name, size: file.size, type: file.type }
}

// Signed URLs are cached until shortly before expiry so lists of
// thumbnails don't re-request a URL on every render.
const signedUrlCache = new Map()

async function signedUrlFor(bucket, path, expiresIn = 3600) {
  const key = `${bucket}/${path}`
  const hit = signedUrlCache.get(key)
  if (hit && hit.expiry > Date.now()) return hit.url

  const { data, error } = await supabase.storage
    .from(bucket)
    .createSignedUrl(path, expiresIn)
  if (error) throw error

  signedUrlCache.set(key, { url: data.signedUrl, expiry: Date.now() + (expiresIn - 60) * 1000 })
  return data.signedUrl
}

export async function uploadAttachment(userId, file) {
  return uploadTo(BUCKET, userId, file)
}

export async function getSignedUrl(path, expiresIn = 3600) {
  return signedUrlFor(BUCKET, path, expiresIn)
}

export async function deleteAttachment(path) {
  const { error } = await supabase.storage.from(BUCKET).remove([path])
  if (error) throw error
}

export async function uploadCover(userId, file) {
  return uploadTo(COVER_BUCKET, userId, file)
}

export async function getCoverUrl(path, expiresIn = 3600) {
  return signedUrlFor(COVER_BUCKET, path, expiresIn)
}

export async function deleteCover(path) {
  const { error } = await supabase.storage.from(COVER_BUCKET).remove([path])
  if (error) throw error
}

export function isImage(type) {
  return type?.startsWith('image/')
}

export function formatFileSize(bytes) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / 1048576).toFixed(1)} MB`
}
