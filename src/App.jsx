import { Routes, Route } from 'react-router-dom'
import { AuthProvider, useAuth } from './hooks/useAuth'
import { TasksProvider } from './hooks/useTasks'
import { ConfigProvider } from './hooks/useConfig'
import Layout from './components/Layout'
import LoginPage from './pages/LoginPage'
import BoardPage from './pages/BoardPage'
import JournalPage from './pages/JournalPage'
import DashboardPage from './pages/DashboardPage'
import ReportsPage from './pages/ReportsPage'
import DocsPage from './pages/DocsPage'
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

  if (!session) return <LoginPage />

  return (
    <ConfigProvider>
    <TasksProvider>
    <Layout>
      <Routes>
        <Route path="/" element={<BoardPage />} />
        <Route path="/journal" element={<JournalPage />} />
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/reports" element={<ReportsPage />} />
        <Route path="/docs" element={<DocsPage />} />
      </Routes>
    </Layout>
    </TasksProvider>
    </ConfigProvider>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <AppInner />
    </AuthProvider>
  )
}
