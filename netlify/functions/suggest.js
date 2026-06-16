// netlify/functions/suggest.js
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

  const { tasks = [], tags = [] } = body
  const existing = tasks.map(t => `- ${t.title} [${t.tag}, ${t.status}]`).join('\n')
  const tagList = tags.map(t => t.id).join(', ')

  const prompt = `You are a project assistant for a pharmaceutical technology compliance professional managing GxP, eClinical, and regulatory work.

Current tasks:
${existing || '(none yet)'}

Available tags: ${tagList}

Suggest exactly 3 new specific tasks that fill obvious workflow gaps. Return ONLY a JSON array with no markdown or preamble:
[{"title":"...","tag":"...","priority":"high|med|low"},...]`

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
        max_tokens: 600,
        messages: [{ role: 'user', content: prompt }],
      }),
    })

    const data = await res.json()
    const raw = data.content?.map(b => b.text || '').join('').replace(/```json|```/g, '').trim()
    const suggestions = JSON.parse(raw)

    return new Response(JSON.stringify({ suggestions }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    })
  } catch (err) {
    return new Response(JSON.stringify({ error: 'Claude API error', detail: err.message }), {
      status: 500, headers: { 'Content-Type': 'application/json' },
    })
  }
}

export const config = { path: '/api/suggest' }
