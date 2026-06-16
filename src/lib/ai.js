// Calls Anthropic via a Netlify serverless function so the API key never
// reaches the browser.
export async function getTaskSuggestions(tasks, tags) {
  const res = await fetch('/.netlify/functions/suggest', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ tasks, tags }),
  })
  if (!res.ok) throw new Error('Suggestion request failed')
  return res.json()
}
