import { ShieldOff, LogOut } from 'lucide-react'
import { supabase } from '../lib/supabase'

export default function SuspendedPage() {
  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: '#F8F7F4', padding: 24,
    }}>
      <div style={{
        background: '#fff', border: '0.5px solid rgba(0,0,0,0.12)',
        borderRadius: 16, padding: '40px 36px', maxWidth: 400, width: '100%', textAlign: 'center',
      }}>
        <div style={{
          width: 52, height: 52, borderRadius: '50%',
          background: '#FCEBEB', display: 'flex', alignItems: 'center',
          justifyContent: 'center', margin: '0 auto 20px',
        }}>
          <ShieldOff size={24} color="#A32D2D" />
        </div>
        <h1 style={{ fontSize: 18, fontWeight: 500, color: '#1C1F26', marginBottom: 10 }}>
          Account suspended
        </h1>
        <p style={{ fontSize: 13, color: '#6B7280', lineHeight: 1.6, marginBottom: 28 }}>
          Your account has been suspended. Please contact an administrator if you believe this is a mistake.
        </p>
        <button
          onClick={() => supabase.auth.signOut()}
          style={{
            display: 'inline-flex', alignItems: 'center', gap: 6,
            padding: '7px 16px', border: '0.5px solid rgba(0,0,0,0.15)',
            borderRadius: 8, background: 'transparent', fontSize: 12,
            color: '#6B7280', cursor: 'pointer', fontFamily: 'inherit',
          }}
        >
          <LogOut size={13} /> Sign out
        </button>
      </div>
    </div>
  )
}
