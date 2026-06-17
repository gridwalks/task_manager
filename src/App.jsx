import { Routes, Route } from 'react-router-dom'
import { AuthProvider, useAuth } from './hooks/useAuth'
import { ProfileProvider, useProfile } from './hooks/useProfile'
import { TasksProvider } from './hooks/useTasks'
import { ConfigProvider } from './hooks/useConfig'
import Layout from './components/Layout'
import LoginPage from './pages/LoginPage'
import PendingPage from './pages/PendingPage'
import SuspendedPage from './pages/SuspendedPage'
import BoardPage from './pages/BoardPage'
import JournalPage from './pages/JournalPage'
import ExpensesPage from './pages/ExpensesPage'
import DashboardPage from './pages/DashboardPage'
import ReportsPage from './pages/ReportsPage'
import DocsPage from './pages/DocsPage'
import AdminPage from './pages/AdminPage'
import './index.css'

function AppInner() {
  const { session } = useAuth()
  const { profile, loading: profileLoading } = useProfile()

  // Auth loading
  if (session === undefined || (session && profileLoading)) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#F8F7F4' }}>
        <div className="spinner" style={{ width: 24, height: 24, borderWidth: 2 }} />
      </div>
    )
  }

  if (!session) return <LoginPage />

  // Profile status gate
  if (profile?.status === 'pending')   return <PendingPage />
  if (profile?.status === 'suspended') return <SuspendedPage />

  return (
    <ConfigProvider>
    <TasksProvider>
    <Layout>
      <Routes>
        <Route path="/"          element={<DashboardPage />} />
        <Route path="/board"     element={<BoardPage />} />
        <Route path="/journal"   element={<JournalPage />} />
        <Route path="/expenses"  element={<ExpensesPage />} />
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/reports"   element={<ReportsPage />} />
        <Route path="/docs"      element={<DocsPage />} />
        {profile?.role === 'admin' && (
          <Route path="/admin" element={<AdminPage />} />
        )}
      </Routes>
    </Layout>
    </TasksProvider>
    </ConfigProvider>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <ProfileProvider>
        <AppInner />
      </ProfileProvider>
    </AuthProvider>
  )
}
