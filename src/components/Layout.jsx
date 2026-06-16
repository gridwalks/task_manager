import { useState } from 'react'
import Sidebar from './Sidebar'
import SettingsModal from './board/SettingsModal'
import AISuggestPanel from './board/AISuggestPanel'
import { useConfig } from '../hooks/useConfig'
import { useTasks } from '../hooks/useTasks'

export default function Layout({ children }) {
  const { config, saveConfig } = useConfig()
  const { tasks, addTask } = useTasks()
  const [showSettings, setShowSettings] = useState(false)
  const [showAI, setShowAI] = useState(false)

  return (
    <div className="app-shell">
      <Sidebar onAI={() => setShowAI(v => !v)} onSettings={() => setShowSettings(true)} />

      <div className="shell-content">
        {showAI && (
          <AISuggestPanel
            tasks={tasks}
            config={config}
            onAdd={addTask}
            onDismiss={() => setShowAI(false)}
          />
        )}
        {children}
      </div>

      {showSettings && (
        <SettingsModal config={config} onSave={saveConfig} onClose={() => setShowSettings(false)} />
      )}
    </div>
  )
}
