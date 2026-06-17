import { useState } from 'react'
import { X, Trash2 } from 'lucide-react'
import { DEFAULT_EXPENSE_CATEGORIES, CURRENCIES, STATUS_META } from '../../lib/expenseUtils'

const todayISO = () => new Date().toISOString().split('T')[0]

const EMPTY = {
  date: todayISO(), vendor: '', amount: '', currency: 'USD',
  category: '', description: '', notes: '', status: 'draft',
}

export default function ExpenseForm({ expense, categories, onSave, onDelete, onClose }) {
  const isNew = !expense?.id
  const [form, setForm] = useState(isNew ? EMPTY : {
    date: expense.date || todayISO(),
    vendor: expense.vendor || '',
    amount: expense.amount || '',
    currency: expense.currency || 'USD',
    category: expense.category || '',
    description: expense.description || '',
    notes: expense.notes || '',
    status: expense.status || 'draft',
  })
  const [saving, setSaving] = useState(false)
  const [errors, setErrors] = useState({})

  const cats = categories?.length ? categories : DEFAULT_EXPENSE_CATEGORIES

  const set = (field, value) => {
    setForm(f => ({ ...f, [field]: value }))
    if (errors[field]) setErrors(e => ({ ...e, [field]: null }))
  }

  const validate = () => {
    const e = {}
    if (!form.vendor.trim()) e.vendor = 'Vendor is required'
    if (!form.amount || isNaN(Number(form.amount)) || Number(form.amount) <= 0) e.amount = 'Valid amount required'
    if (!form.date) e.date = 'Date is required'
    return e
  }

  const handleSave = async () => {
    const e = validate()
    if (Object.keys(e).length) { setErrors(e); return }
    setSaving(true)
    try {
      await onSave({ ...form, amount: Number(form.amount) })
      onClose()
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!window.confirm('Delete this expense? This cannot be undone.')) return
    await onDelete(expense.id)
    onClose()
  }

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.3)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 100, padding: 16,
    }} onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={{
        background: 'var(--surface)', border: '0.5px solid var(--border-mid)',
        borderRadius: 'var(--radius-lg)', width: 460, maxHeight: '90vh',
        overflowY: 'auto', display: 'flex', flexDirection: 'column',
      }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '14px 16px', borderBottom: '0.5px solid var(--border)' }}>
          <span style={{ fontSize: 14, fontWeight: 500, color: 'var(--text-primary)' }}>
            {isNew ? 'Add expense' : 'Edit expense'}
          </span>
          <button onClick={onClose} style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', display: 'flex' }}>
            <X size={16} />
          </button>
        </div>

        {/* Body */}
        <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: 14 }}>
          {/* Date */}
          <div>
            <label className="field-lbl">Date</label>
            <input type="date" value={form.date} onChange={e => set('date', e.target.value)}
              className="field-inp" style={errors.date ? { borderColor: '#A32D2D' } : {}} />
            {errors.date && <div style={{ fontSize: 10, color: '#A32D2D', marginTop: 3 }}>{errors.date}</div>}
          </div>

          {/* Vendor */}
          <div>
            <label className="field-lbl">Vendor / Merchant</label>
            <input value={form.vendor} onChange={e => set('vendor', e.target.value)}
              placeholder="e.g. Delta Airlines, AWS, Starbucks"
              className="field-inp" style={errors.vendor ? { borderColor: '#A32D2D' } : {}} />
            {errors.vendor && <div style={{ fontSize: 10, color: '#A32D2D', marginTop: 3 }}>{errors.vendor}</div>}
          </div>

          {/* Amount + Currency */}
          <div className="field-grid">
            <div>
              <label className="field-lbl">Amount</label>
              <input type="number" min="0" step="0.01" value={form.amount}
                onChange={e => set('amount', e.target.value)}
                placeholder="0.00" className="field-inp"
                style={errors.amount ? { borderColor: '#A32D2D' } : {}} />
              {errors.amount && <div style={{ fontSize: 10, color: '#A32D2D', marginTop: 3 }}>{errors.amount}</div>}
            </div>
            <div>
              <label className="field-lbl">Currency</label>
              <select value={form.currency} onChange={e => set('currency', e.target.value)} className="field-sel">
                {CURRENCIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </div>

          {/* Category */}
          <div>
            <label className="field-lbl">Category</label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
              {cats.map(cat => {
                const on = form.category === cat.id
                return (
                  <button key={cat.id} onClick={() => set('category', on ? '' : cat.id)}
                    style={{
                      fontSize: 11, padding: '3px 10px', borderRadius: 20, cursor: 'pointer',
                      fontFamily: 'var(--font)', border: `0.5px solid ${on ? cat.color + '88' : 'var(--border-mid)'}`,
                      background: on ? cat.bg : 'transparent',
                      color: on ? cat.color : 'var(--text-muted)',
                      fontWeight: on ? 500 : 400, transition: 'all 0.1s',
                    }}>
                    {cat.label}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="field-lbl">Description</label>
            <input value={form.description} onChange={e => set('description', e.target.value)}
              placeholder="Brief description of the expense"
              className="field-inp" />
          </div>

          {/* Notes */}
          <div>
            <label className="field-lbl">Notes</label>
            <textarea value={form.notes} onChange={e => set('notes', e.target.value)}
              placeholder="Additional notes…"
              className="notes-area" style={{ minHeight: 56 }} />
          </div>

          {/* Status */}
          <div>
            <label className="field-lbl">Status</label>
            <div style={{ display: 'flex', gap: 5 }}>
              {Object.entries(STATUS_META).map(([id, meta]) => {
                const on = form.status === id
                return (
                  <button key={id} onClick={() => set('status', id)}
                    style={{
                      fontSize: 11, padding: '3px 10px', borderRadius: 20, cursor: 'pointer',
                      fontFamily: 'var(--font)', border: `0.5px solid ${on ? meta.text + '66' : 'var(--border-mid)'}`,
                      background: on ? meta.bg : 'transparent',
                      color: on ? meta.text : 'var(--text-muted)',
                      fontWeight: on ? 500 : 400, transition: 'all 0.1s',
                    }}>
                    {meta.label}
                  </button>
                )
              })}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', borderTop: '0.5px solid var(--border)' }}>
          <div>
            {!isNew && (
              <button onClick={handleDelete} className="btn btn-danger btn-sm" style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <Trash2 size={12} /> Delete
              </button>
            )}
          </div>
          <div style={{ display: 'flex', gap: 6 }}>
            <button onClick={onClose} className="btn btn-sm">Cancel</button>
            <button onClick={handleSave} disabled={saving} className="btn btn-primary btn-sm">
              {saving ? 'Saving…' : isNew ? 'Add expense' : 'Save'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
