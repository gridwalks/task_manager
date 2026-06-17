export const DEFAULT_EXPENSE_CATEGORIES = [
  { id: 'travel',      label: 'Travel',                color: '#4F52D9', bg: '#EEEEFF' },
  { id: 'software',    label: 'Software / SaaS',       color: '#0C447C', bg: '#E6F1FB' },
  { id: 'consulting',  label: 'Consulting',            color: '#C17A2B', bg: '#FEF3E2' },
  { id: 'office',      label: 'Office Supplies',       color: '#5E2989', bg: '#F3E8FB' },
  { id: 'training',    label: 'Training & Conferences',color: '#085041', bg: '#E1F5EE' },
  { id: 'meals',       label: 'Meals & Entertainment', color: '#8C2020', bg: '#FCE8E8' },
  { id: 'equipment',   label: 'Equipment',             color: '#27500A', bg: '#EAF3DE' },
  { id: 'other',       label: 'Other',                 color: '#4B5563', bg: '#F4F3F0' },
]

export const CURRENCIES = ['USD', 'EUR', 'GBP', 'CAD', 'AUD']

export const STATUS_META = {
  draft:     { label: 'Draft',     bg: '#F4F3F0', text: '#4B5563', dot: '#9CA3AF' },
  submitted: { label: 'Submitted', bg: '#FEF3E2', text: '#C17A2B', dot: '#C17A2B' },
  approved:  { label: 'Approved',  bg: '#EAF3DE', text: '#27500A', dot: '#2E8A5B' },
  rejected:  { label: 'Rejected',  bg: '#FCEBEB', text: '#791F1F', dot: '#A32D2D' },
}

export function formatCurrency(amount, currency = 'USD') {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(amount)
}

export function formatExpenseDate(dateStr) {
  if (!dateStr) return ''
  return new Date(dateStr + 'T12:00:00').toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
  })
}

export function sumExpenses(expenses) {
  return expenses.reduce((sum, e) => sum + Number(e.amount || 0), 0)
}

export function thisMonthExpenses(expenses) {
  const now = new Date()
  const ym = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
  return expenses.filter(e => (e.date || '').startsWith(ym))
}
