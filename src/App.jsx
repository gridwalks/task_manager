import { AuthProvider, useAuth } from './hooks/useAuth'
import LoginPage from './pages/LoginPage'
import BoardPage from './pages/BoardPage'
import './index.css'

function AppInner() {
  const { session } = useAuth()
  if (session === undefined) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#F8F7F4' }}>
        <div className="spinner" style={{ width: 24, height: 24, borderWidth: 2 }} />
      </div>
    )
  }
  return session ? <BoardPage /> : <LoginPage />
}

export default function App() {
  return (
    <AuthProvider>
      <AppInner />
    </AuthProvider>
  )
}
