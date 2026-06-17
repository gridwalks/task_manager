import { useMemo, useState } from 'react'
import { Plus, Search, Receipt, TrendingUp, Clock, CheckCircle } from 'lucide-react'
import { useExpenses } from '../hooks/useExpenses'
import { useConfig } from '../hooks/useConfig'
import ExpenseForm from '../components/expenses/ExpenseForm'
import {
  DEFAULT_EXPENSE_CATEGORIES, STATUS_META,
  formatCurrency, formatExpenseDate, sumExpenses, thisMonthExpenses,
} from '../lib/expenseUtils'

const TABS = [
  { id: 'all',       label: 'All' },
  { id: 'draft',     label: 'Draft' },
  { id: 'submitted', label: 'Submitted' },
  { id: 'approved',  label: 'Approved' },
  { id: 'rejected',  label: 'Rejected' },
]

function StatusBadge({ status }) {
  const m = STATUS_META[status] || STATUS_META.draft
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 10,
      padding: '2px 8px', borderRadius: 10, background: m.bg, color: m.text, fontWeight: 500,
    }}>
      <span style={{ width: 5, height: 5, borderRadius: '50%', background: m.dot }} />
      {m.label}
    </span>
  )
}

function CategoryBadge({ categoryId, categories }) {
  const cat = categories.find(c => c.id === categoryId)
  if (!cat) return <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>—</span>
  return (
    <span style={{
      fontSize: 10, padding: '2px 8px', borderRadius: 10,
      background: cat.bg, color: cat.color, fontWeight: 500,
    }}>
      {cat.label}
    </span>
  )
}

export default function ExpensesPage() {
  const { expenses, loading, addExpense, updateExpense, deleteExpense } = useExpenses()
  const { config } = useConfig()
  const categories = config.expenseCategories || DEFAULT_EXPENSE_CATEGORIES

  const [tab, setTab] = useState('all')
  const [search, setSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [editingExpense, setEditingExpense] = useState(null)
  const [showForm, setShowForm] = useState(false)

  const filtered = useMemo(() => {
    let list = tab === 'all' ? expenses : expenses.filter(e => e.status === tab)
    if (categoryFilter !== 'all') list = list.filter(e => e.category === categoryFilter)
    if (search.trim()) {
      const q = search.toLowerCase()
      list = list.filter(e =>
        (e.vendor || '').toLowerCase().includes(q) ||
        (e.description || '').toLowerCase().includes(q)
      )
    }
    return list
  }, [expenses, tab, search, categoryFilter])

  const stats = useMemo(() => {
    const monthExp = thisMonthExpenses(expenses)
    return {
      total:     sumExpenses(expenses),
      thisMonth: sumExpenses(monthExp),
      pending:   expenses.filter(e => e.status === 'submitted').length,
      approved:  sumExpenses(expenses.filter(e => e.status === 'approved')),
    }
  }, [expenses])

  const tabCounts = useMemo(() => {
    const counts = { all: expenses.length }
    TABS.slice(1).forEach(t => { counts[t.id] = expenses.filter(e => e.status === t.id).length })
    return counts
  }, [expenses])

  const handleSave = async (form) => {
    if (editingExpense?.id) await updateExpense(editingExpense.id, form)
    else await addExpense(form)
  }

  const openEdit = (expense) => { setEditingExpense(expense); setShowForm(true) }
  const openNew  = () => { setEditingExpense(null); setShowForm(true) }
  const closeForm = () => { setShowForm(false); setEditingExpense(null) }

  return (
    <div style={{ flex: 1, overflowY: 'auto', padding: '24px 28px' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 18, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 3 }}>Expenses</h1>
          <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>Track and manage company expenses</p>
        </div>
        <button onClick={openNew} className="btn btn-primary" style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 5 }}>
          <Plus size={13} /> Add expense
        </button>
      </div>

      {/* Stat cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10, marginBottom: 24 }}>
        {[
          { label: 'Total spend',    value: formatCurrency(stats.total),     icon: Receipt,     bg: '#EEEEFF', color: '#3C3FB8' },
          { label: 'This month',     value: formatCurrency(stats.thisMonth), icon: TrendingUp,  bg: '#E6F1FB', color: '#0C447C' },
          { label: 'Pending review', value: `${stats.pending} expense${stats.pending !== 1 ? 's' : ''}`, icon: Clock, bg: '#FEF3E2', color: '#C17A2B' },
          { label: 'Total approved', value: formatCurrency(stats.approved),  icon: CheckCircle, bg: '#EAF3DE', color: '#27500A' },
        ].map(({ label, value, icon: Icon, bg, color }) => (
          <div key={label} style={{
            background: 'var(--surface)', border: '0.5px solid var(--border)',
            borderRadius: 'var(--radius-lg)', padding: '14px 16px',
            display: 'flex', alignItems: 'center', gap: 12,
          }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Icon size={16} color={color} />
            </div>
            <div>
              <div style={{ fontSize: 16, fontWeight: 600, color: 'var(--text-primary)', lineHeight: 1.2 }}>{value}</div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>{label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Table card */}
      <div style={{ background: 'var(--surface)', border: '0.5px solid var(--border)', borderRadius: 'var(--radius-lg)', overflow: 'hidden' }}>
        {/* Toolbar */}
        <div style={{ display: 'flex', alignItems: 'center', borderBottom: '0.5px solid var(--border)', padding: '0 16px', gap: 0 }}>
          {/* Status tabs */}
          <div style={{ display: 'flex' }}>
            {TABS.map(t => (
              <button key={t.id} onClick={() => setTab(t.id)} style={{
                display: 'flex', alignItems: 'center', gap: 5, padding: '10px 12px',
                border: 'none', background: 'transparent', cursor: 'pointer',
                fontSize: 12, fontFamily: 'var(--font)',
                color: tab === t.id ? 'var(--accent)' : 'var(--text-secondary)',
                borderBottom: `2px solid ${tab === t.id ? 'var(--accent)' : 'transparent'}`,
                marginBottom: -1, fontWeight: tab === t.id ? 500 : 400, transition: 'all 0.1s',
              }}>
                {t.label}
                <span style={{
                  fontSize: 10, padding: '1px 5px', borderRadius: 8,
                  background: tab === t.id ? '#EEEEFF' : 'var(--surface-2)',
                  color: tab === t.id ? 'var(--accent)' : 'var(--text-muted)',
                  border: '0.5px solid var(--border)',
                }}>
                  {tabCounts[t.id] || 0}
                </span>
              </button>
            ))}
          </div>

          {/* Filters */}
          <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 6, padding: '6px 0' }}>
            <select value={categoryFilter} onChange={e => setCategoryFilter(e.target.value)}
              className="field-sel" style={{ width: 'auto', fontSize: 11, padding: '4px 7px' }}>
              <option value="all">All categories</option>
              {categories.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
            </select>
            <div style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '5px 9px', border: '0.5px solid var(--border)', borderRadius: 'var(--radius)', background: 'var(--surface-2)' }}>
              <Search size={12} color="var(--text-muted)" />
              <input value={search} onChange={e => setSearch(e.target.value)}
                placeholder="Search vendor, description…"
                style={{ border: 'none', outline: 'none', background: 'transparent', fontSize: 12, fontFamily: 'var(--font)', color: 'var(--text-primary)', width: 180 }} />
            </div>
          </div>
        </div>

        {/* Column headers */}
        <div style={{
          display: 'grid', gridTemplateColumns: '110px 1fr 160px 120px 100px 90px',
          padding: '8px 16px', background: 'var(--surface-2)', borderBottom: '0.5px solid var(--border)',
        }}>
          {['Date', 'Vendor & Description', 'Category', 'Amount', 'Status', ''].map(h => (
            <div key={h} style={{ fontSize: 10, fontWeight: 500, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{h}</div>
          ))}
        </div>

        {/* Rows */}
        {loading && (
          <div style={{ padding: 40, textAlign: 'center', fontSize: 13, color: 'var(--text-muted)' }}>
            <div className="spinner" style={{ margin: '0 auto 8px' }} /> Loading…
          </div>
        )}

        {!loading && filtered.length === 0 && (
          <div style={{ padding: 48, textAlign: 'center', color: 'var(--text-muted)' }}>
            <Receipt size={28} style={{ opacity: 0.25, marginBottom: 10 }} />
            <div style={{ fontSize: 13 }}>{search || tab !== 'all' || categoryFilter !== 'all' ? 'No expenses match your filters.' : 'No expenses yet. Click "Add expense" to get started.'}</div>
          </div>
        )}

        {filtered.map((expense, i) => (
          <div key={expense.id} style={{
            display: 'grid', gridTemplateColumns: '110px 1fr 160px 120px 100px 90px',
            padding: '11px 16px', alignItems: 'center',
            borderBottom: i < filtered.length - 1 ? '0.5px solid var(--border)' : 'none',
            transition: 'background 0.1s',
          }}
            onMouseEnter={e => e.currentTarget.style.background = 'var(--surface-2)'}
            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
          >
            <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{formatExpenseDate(expense.date)}</div>

            <div>
              <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-primary)' }}>{expense.vendor}</div>
              {expense.description && (
                <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {expense.description}
                </div>
              )}
            </div>

            <CategoryBadge categoryId={expense.category} categories={categories} />

            <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>
              {formatCurrency(expense.amount, expense.currency)}
            </div>

            <StatusBadge status={expense.status} />

            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button onClick={() => openEdit(expense)} className="btn btn-sm btn-ghost">Edit</button>
            </div>
          </div>
        ))}

        {/* Footer total */}
        {filtered.length > 0 && (
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'flex-end',
            padding: '10px 16px', borderTop: '0.5px solid var(--border)',
            background: 'var(--surface-2)', gap: 8,
          }}>
            <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{filtered.length} expense{filtered.length !== 1 ? 's' : ''} · Total:</span>
            <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>
              {formatCurrency(sumExpenses(filtered))}
            </span>
          </div>
        )}
      </div>

      {showForm && (
        <ExpenseForm
          expense={editingExpense}
          categories={categories}
          onSave={handleSave}
          onDelete={deleteExpense}
          onClose={closeForm}
        />
      )}
    </div>
  )
}
