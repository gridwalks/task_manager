import { NavLink, useNavigate } from 'react-router-dom'
import { LayoutDashboard, Kanban, BarChart2, FileText, BookOpen, Receipt, ShieldCheck, Settings, LogOut, Sparkles } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'
import { useProfile } from '../hooks/useProfile'

const NAV = [
  { to: '/',          icon: Kanban,          label: 'Board' },
  { to: '/journal',   icon: BookOpen,        label: 'Journal' },
  { to: '/expenses',  icon: Receipt,         label: 'Expenses' },
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/reports',   icon: BarChart2,       label: 'Reports' },
  { to: '/docs',      icon: FileText,        label: 'Docs' },
]

export default function Sidebar({ onAI, onSettings, pendingCount = 0 }) {
  const { user } = useAuth()
  const { isAdmin } = useProfile()
  const navigate = useNavigate()

  const initials = user?.email?.slice(0, 2).toUpperCase() ?? '??'

  return (
    <aside className="sidebar">
      <div className="sidebar-brand">
        <img src="/logo.png" alt="AcceleraQA" style={{ width: '100%', maxWidth: 148, height: 'auto', display: 'block' }} />
      </div>

      <nav className="sidebar-nav">
        {NAV.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) => `sidebar-link${isActive ? ' sidebar-link-active' : ''}`}
          >
            <Icon size={16} />
            <span>{label}</span>
          </NavLink>
        ))}

        {isAdmin && (
          <>
            <div className="sidebar-section-divider" />
            <NavLink
              to="/admin"
              className={({ isActive }) => `sidebar-link${isActive ? ' sidebar-link-active' : ''}`}
            >
              <ShieldCheck size={16} />
              <span>Admin</span>
              {pendingCount > 0 && (
                <span className="sidebar-badge">{pendingCount}</span>
              )}
            </NavLink>
          </>
        )}
      </nav>

      <div className="sidebar-bottom">
        <button className="sidebar-link" onClick={onAI} title="AI Suggest">
          <Sparkles size={16} />
          <span>AI Suggest</span>
        </button>
        <button className="sidebar-link" onClick={onSettings} title="Settings">
          <Settings size={16} />
          <span>Settings</span>
        </button>
        <button
          className="sidebar-link sidebar-link-danger"
          onClick={() => supabase.auth.signOut().then(() => navigate('/'))}
          title="Sign out"
        >
          <LogOut size={16} />
          <span>Sign out</span>
        </button>
        <div className="sidebar-avatar" title={user?.email}>{initials}</div>
      </div>
    </aside>
  )
}
