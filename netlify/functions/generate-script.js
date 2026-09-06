// netlify/functions/generate-script.js
// Runs server-side — ANTHROPIC_API_KEY is never exposed to the browser.

export default async (req) => {
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 })
  }

  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) {
    return new Response(JSON.stringify({ error: 'API key not configured' }), {
      status: 500, headers: { 'Content-Type': 'application/json' },
    })
  }

  let body
  try { body = await req.json() } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON' }), { status: 400 })
  }

  const { title = '', author = '', seriesPosition = '', reviewText = '' } = body

  if (!reviewText.trim()) {
    return new Response(JSON.stringify({ error: 'reviewText is required' }), { status: 400 })
  }

  const bookLine = [title, author && `by ${author}`, seriesPosition && `(${seriesPosition})`]
    .filter(Boolean).join(' ')

  const prompt = `You are a BookTok creator writing a TikTok video script for a book review, in the same style as viral book review TikToks: punchy, casual, dramatic where it fits, spoiler-light unless the review clearly wants spoilers. Build the script entirely from the reviewer's own written review below — don't invent plot details that aren't in it.

Book: ${bookLine || '(untitled)'}

Reviewer's written review:
"""
${reviewText}
"""

Write the script as a sequence of short beats. Each beat is a bracketed camera/delivery cue on its own line (for example: [HOOK - hold the book up to camera], [cut - walking, casual], [cut - leaning in], [beat], [serious for a sec], [final beat - clutching book], [end card]), followed immediately by 1-2 lines of spoken dialogue on the next line(s). Separate each beat from the next with a single blank line. Start with a HOOK beat that grabs attention in the first line, and end with an END CARD beat with a short call to action.

Return ONLY the script text in that exact format — no title, no explanation, no markdown, no surrounding quotation marks.`

  try {
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-6',
        max_tokens: 1024,
        messages: [{ role: 'user', content: prompt }],
      }),
    })

    const data = await res.json()
    const script = (data.content || []).map(b => b.text || '').join('').trim()

    if (!script) {
      return new Response(JSON.stringify({ error: 'Claude returned an empty script' }), {
        status: 502, headers: { 'Content-Type': 'application/json' },
      })
    }

    return new Response(JSON.stringify({ script }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    })
  } catch (err) {
    return new Response(JSON.stringify({ error: 'Claude API error', detail: err.message }), {
      status: 500, headers: { 'Content-Type': 'application/json' },
    })
  }
}

export const config = { path: '/api/generate-script' }
