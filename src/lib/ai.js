// Calls Anthropic via a Netlify edge function so the API key never
// reaches the browser. These are edge functions (declared via
// `config.path` in netlify/functions/*.js), so they're invoked at
// their custom path, not the usual /.netlify/functions/<name> URL.
export async function getTaskSuggestions(tasks, tags) {
  const res = await fetch('/api/suggest', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ tasks, tags }),
  })
  if (!res.ok) throw new Error('Suggestion request failed')
  return res.json()
}

// Turns a written book review into a TikTok video script via Claude.
export async function generateTikTokScript({ title, author, seriesPosition, reviewText }) {
  const res = await fetch('/api/generate-script', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ title, author, seriesPosition, reviewText }),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.error || 'Script generation failed')
  }
  const data = await res.json()
  return data.script
}
