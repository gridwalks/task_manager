// Minimal RFC4180-ish CSV parser: handles quoted fields, embedded
// commas/newlines, and "" escaped quotes.
export function parseCSV(text) {
  const rows = []
  let row = []
  let field = ''
  let inQuotes = false
  let i = 0
  const len = text.length
  while (i < len) {
    const c = text[i]
    if (inQuotes) {
      if (c === '"') {
        if (text[i + 1] === '"') { field += '"'; i += 2; continue }
        inQuotes = false; i++; continue
      }
      field += c; i++; continue
    }
    if (c === '"') { inQuotes = true; i++; continue }
    if (c === ',') { row.push(field); field = ''; i++; continue }
    if (c === '\r') { i++; continue }
    if (c === '\n') { row.push(field); rows.push(row); row = []; field = ''; i++; continue }
    field += c; i++
  }
  if (field.length || row.length) { row.push(field); rows.push(row) }
  return rows
}

export function csvToObjects(text) {
  const rows = parseCSV(text.replace(/^﻿/, ''))
  if (!rows.length) return []
  const header = rows[0]
  return rows.slice(1)
    .filter(r => r.length > 1 || (r[0] ?? '') !== '')
    .map(r => Object.fromEntries(header.map((h, i) => [h, r[i] ?? ''])))
}
