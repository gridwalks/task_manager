import { useEffect, useState, useMemo } from 'react'
import {
  CheckCircle, XCircle, ShieldOff, ShieldCheck, Shield, Users,
  Clock, UserCheck, Search, ChevronDown,
} from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'

const STATUS_META = {
  pending:   { label: 'Pending',   bg: '#FEF3E2', text: '#C17A2B', dot: '#C17A2B' },
  active:    { label: 'Active',    bg: '#EAF3DE', text: '#27500A', dot: '#2E8A5B' },
  suspended: { label: 'Suspended', bg: '#FCEBEB', text: '#791F1F', dot: '#A32D2D' },
}

const ROLE_META = {
  admin: { label: 'Admin', bg: '#EEEEFF', text: '#3C3FB8' },
  user:  { label: 'User',  bg: '#F4F3F0', text: '#4B5563' },
}

function StatusBadge({ status }) {
  const m = STATUS_META[status] || STATUS_META.pending
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 5,
      fontSize: 11, padding: '2px 8px', borderRadius: 10,
      background: m.bg, color: m.text, fontWeight: 500,
    }}>
      <span style={{ width: 6, height: 6, borderRadius: '50%', background: m.dot }} />
      {m.label}
    </span>
  )
}

function RoleBadge({ role }) {
  const m = ROLE_META[role] || ROLE_META.user
  return (
    <span style={{
      fontSize: 11, padding: '2px 8px', borderRadius: 10,
      background: m.bg, color: m.text, fontWeight: 500,
    }}>
      {m.label}
    </span>
  )
}

export default function AdminPage() {
  const { user: currentUser } = useAuth()
  const [profiles, setProfiles] = useState([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState('pending')
  const [search, setSearch] = useState('')
  const [acting, setActing] = useState(null)

  const fetchProfiles = async () => {
    setLoading(true)
    const { data } = await supabase
      .from('user_profiles')
      .select('*')
      .order('created_at', { ascending: false })
    setProfiles(data || [])
    setLoading(false)
  }

  useEffect(() => { fetchProfiles() }, [])

  const counts = useMemo(() => ({
    pending:   profiles.filter(p => p.status === 'pending').length,
    active:    profiles.filter(p => p.status === 'active').length,
    suspended: profiles.filter(p => p.status === 'suspended').length,
    all:       profiles.length,
  }), [profiles])

  const filtered = useMemo(() => {
    let list = tab === 'all' ? profiles : profiles.filter(p => p.status === tab)
    if (search.trim()) {
      const q = search.toLowerCase()
      list = list.filter(p =>
        (p.email || '').toLowerCase().includes(q) ||
        (p.full_name || '').toLowerCase().includes(q)
      )
    }
    return list
  }, [profiles, tab, search])

  const act = async (id, updates) => {
    setActing(id)
    const payload = { ...updates }
    if (updates.status === 'active' && !updates.approved_at) {
      payload.approved_at = new Date().toISOString()
      payload.approved_by = currentUser.id
    }
    await supabase.from('user_profiles').update(payload).eq('id', id)
    setProfiles(prev => prev.map(p => p.id === id ? { ...p, ...payload } : p))
    setActing(null)
  }

  const TABS = [
    { id: 'pending',   label: 'Pending',   count: counts.pending },
    { id: 'active',    label: 'Active',    count: counts.active },
    { id: 'suspended', label: 'Suspended', count: counts.suspended },
    { id: 'all',       label: 'All users', count: counts.all },
  ]

  return (
    <div style={{ flex: 1, overflowY: 'auto', padding: '24px 28px' }}>
      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 18, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 4 }}>
          Admin Center
        </h1>
        <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>
          Manage user access and account status
        </p>
      </div>

      {/* Stat cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10, marginBottom: 24 }}>
        {[
          { label: 'Total users',  value: counts.all,       icon: Users,     bg: '#F4F3F0', color: '#4B5563' },
          { label: 'Pending',      value: counts.pending,   icon: Clock,     bg: '#FEF3E2', color: '#C17A2B' },
          { label: 'Active',       value: counts.active,    icon: UserCheck, bg: '#EAF3DE', color: '#27500A' },
          { label: 'Suspended',    value: counts.suspended, icon: ShieldOff, bg: '#FCEBEB', color: '#791F1F' },
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
              <div style={{ fontSize: 22, fontWeight: 600, color: 'var(--text-primary)', lineHeight: 1 }}>{value}</div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>{label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Filter bar */}
      <div style={{
        background: 'var(--surface)', border: '0.5px solid var(--border)',
        borderRadius: 'var(--radius-lg)', overflow: 'hidden',
      }}>
        <div style={{
          display: 'flex', alignItems: 'center', gap: 0,
          borderBottom: '0.5px solid var(--border)', padding: '0 16px',
        }}>
          {TABS.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)} style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '10px 14px', border: 'none', background: 'transparent',
              fontSize: 12, cursor: 'pointer', fontFamily: 'var(--font)',
              color: tab === t.id ? 'var(--accent)' : 'var(--text-secondary)',
              borderBottom: `2px solid ${tab === t.id ? 'var(--accent)' : 'transparent'}`,
              marginBottom: -1, fontWeight: tab === t.id ? 500 : 400,
              transition: 'all 0.1s',
            }}>
              {t.label}
              <span style={{
                fontSize: 10, padding: '1px 6px', borderRadius: 8,
                background: tab === t.id ? '#EEEEFF' : 'var(--surface-2)',
                color: tab === t.id ? 'var(--accent)' : 'var(--text-muted)',
                border: '0.5px solid var(--border)',
              }}>
                {t.count}
              </span>
            </button>
          ))}

          <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 6, padding: '6px 0' }}>
            <div style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '5px 10px', border: '0.5px solid var(--border)',
              borderRadius: 'var(--radius)', background: 'var(--surface-2)',
            }}>
              <Search size={12} color="var(--text-muted)" />
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search users…"
                style={{
                  border: 'none', outline: 'none', background: 'transparent',
                  fontSize: 12, fontFamily: 'var(--font)', color: 'var(--text-primary)', width: 160,
                }}
              />
            </div>
          </div>
        </div>

        {/* User table */}
        <div>
          {/* Table header */}
          <div style={{
            display: 'grid', gridTemplateColumns: '1fr 140px 100px 180px',
            padding: '8px 16px', borderBottom: '0.5px solid var(--border)',
            background: 'var(--surface-2)',
          }}>
            {['User', 'Role', 'Status', 'Actions'].map(h => (
              <div key={h} style={{ fontSize: 10, fontWeight: 500, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                {h}
              </div>
            ))}
          </div>

          {loading && (
            <div style={{ padding: 32, textAlign: 'center', fontSize: 13, color: 'var(--text-muted)' }}>
              <div className="spinner" style={{ margin: '0 auto 8px' }} /> Loading…
            </div>
          )}

          {!loading && filtered.length === 0 && (
            <div style={{ padding: 40, textAlign: 'center', fontSize: 13, color: 'var(--text-muted)' }}>
              {tab === 'pending' ? 'No pending approvals.' : 'No users found.'}
            </div>
          )}

          {filtered.map((profile, i) => {
            const isSelf = profile.id === currentUser?.id
            const busy = acting === profile.id
            return (
              <div key={profile.id} style={{
                display: 'grid', gridTemplateColumns: '1fr 140px 100px 180px',
                padding: '12px 16px', alignItems: 'center',
                borderBottom: i < filtered.length - 1 ? '0.5px solid var(--border)' : 'none',
                background: busy ? 'var(--surface-2)' : 'transparent',
                transition: 'background 0.1s',
              }}>
                {/* User info */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{
                    width: 32, height: 32, borderRadius: '50%',
                    background: 'var(--accent)', color: '#fff',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 11, fontWeight: 600, flexShrink: 0,
                  }}>
                    {(profile.email || '?').slice(0, 2).toUpperCase()}
                  </div>
                  <div>
                    {profile.full_name && (
                      <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-primary)' }}>
                        {profile.full_name}
                      </div>
                    )}
                    <div style={{ fontSize: 12, color: profile.full_name ? 'var(--text-muted)' : 'var(--text-primary)' }}>
                      {profile.email || profile.id.slice(0, 12) + '…'}
                    </div>
                    <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 1 }}>
                      Joined {new Date(profile.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      {isSelf && <span style={{ marginLeft: 6, color: 'var(--accent)', fontWeight: 500 }}>· You</span>}
                    </div>
                  </div>
                </div>

                {/* Role */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <RoleBadge role={profile.role} />
                  {!isSelf && (
                    <button
                      disabled={busy}
                      onClick={() => act(profile.id, { role: profile.role === 'admin' ? 'user' : 'admin' })}
                      title={profile.role === 'admin' ? 'Demote to user' : 'Promote to admin'}
                      style={{
                        background: 'none', border: 'none', cursor: busy ? 'not-allowed' : 'pointer',
                        color: 'var(--text-muted)', padding: 2, borderRadius: 4,
                        display: 'flex', opacity: busy ? 0.4 : 1,
                      }}
                    >
                      {profile.role === 'admin' ? <Shield size={13} /> : <ShieldCheck size={13} />}
                    </button>
                  )}
                </div>

                {/* Status */}
                <StatusBadge status={profile.status} />

                {/* Actions */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                  {profile.status === 'pending' && (
                    <>
                      <ActionBtn
                        icon={<CheckCircle size={13} />}
                        label="Approve"
                        color="#2E8A5B" hoverBg="#EAF3DE"
                        disabled={busy}
                        onClick={() => act(profile.id, { status: 'active' })}
                      />
                      <ActionBtn
                        icon={<XCircle size={13} />}
                        label="Reject"
                        color="#A32D2D" hoverBg="#FCEBEB"
                        disabled={busy}
                        onClick={() => act(profile.id, { status: 'suspended' })}
                      />
                    </>
                  )}
                  {profile.status === 'active' && !isSelf && (
                    <ActionBtn
                      icon={<ShieldOff size={13} />}
                      label="Suspend"
                      color="#A32D2D" hoverBg="#FCEBEB"
                      disabled={busy}
                      onClick={() => act(profile.id, { status: 'suspended' })}
                    />
                  )}
                  {profile.status === 'suspended' && (
                    <ActionBtn
                      icon={<CheckCircle size={13} />}
                      label="Reactivate"
                      color="#2E8A5B" hoverBg="#EAF3DE"
                      disabled={busy}
                      onClick={() => act(profile.id, { status: 'active' })}
                    />
                  )}
                  {busy && <div className="spinner" style={{ width: 14, height: 14 }} />}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

function ActionBtn({ icon, label, color, hoverBg, onClick, disabled }) {
  const [hover, setHover] = useState(false)
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        display: 'inline-flex', alignItems: 'center', gap: 4,
        padding: '4px 9px', borderRadius: 'var(--radius)',
        border: `0.5px solid ${color}44`,
        background: hover ? hoverBg : 'transparent',
        color, fontSize: 11, cursor: disabled ? 'not-allowed' : 'pointer',
        fontFamily: 'var(--font)', opacity: disabled ? 0.5 : 1,
        transition: 'background 0.1s',
      }}
    >
      {icon} {label}
    </button>
  )
}
