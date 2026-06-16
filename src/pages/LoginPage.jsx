import { Auth } from '@supabase/auth-ui-react'
import { ThemeSupa } from '@supabase/auth-ui-shared'
import { supabase } from '../lib/supabase'

export default function LoginPage() {
  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: '#F8F7F4',
    }}>
      <div style={{
        width: 380,
        background: '#fff',
        border: '0.5px solid rgba(0,0,0,0.12)',
        borderRadius: 12,
        padding: '32px 28px',
      }}>
        <div style={{ marginBottom: 24, textAlign: 'center' }}>
          <h1 style={{ fontSize: 20, fontWeight: 500, letterSpacing: '-0.3px', color: '#1C1F26' }}>
            task<span style={{ color: '#4F52D9' }}>board</span>
          </h1>
          <p style={{ fontSize: 13, color: '#6B7280', marginTop: 6 }}>
            Sign in to your workspace
          </p>
        </div>
        <Auth
          supabaseClient={supabase}
          appearance={{
            theme: ThemeSupa,
            variables: {
              default: {
                colors: {
                  brand: '#4F52D9',
                  brandAccent: '#3C3FB8',
                },
                radii: {
                  borderRadiusButton: '8px',
                  inputBorderRadius: '8px',
                },
                fontSizes: {
                  baseBodySize: '13px',
                  baseInputSize: '13px',
                },
              },
            },
          }}
          providers={['google', 'github']}
          redirectTo={window.location.origin}
        />
      </div>
    </div>
  )
}
