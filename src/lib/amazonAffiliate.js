// Vite only exposes VITE_-prefixed env vars to browser code — this must be
// set as VITE_AMAZON_AFFILIATE_TAG (not a plain server-side var) and the
// site redeployed, since Vite bakes it in at build time.
const TAG = import.meta.env.VITE_AMAZON_AFFILIATE_TAG || ''

export function withAffiliateTag(url) {
  if (!url) return url
  if (!TAG) return url
  try {
    const u = new URL(url)
    u.searchParams.set('tag', TAG)
    return u.toString()
  } catch {
    return url
  }
}

export function amazonSearchUrl(title, author) {
  const q = [title, author].filter(Boolean).join(' ')
  const u = new URL('https://www.amazon.com/s')
  u.searchParams.set('k', q)
  if (TAG) u.searchParams.set('tag', TAG)
  return u.toString()
}
