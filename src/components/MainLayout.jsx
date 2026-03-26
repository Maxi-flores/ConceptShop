import { useState } from 'react'
import { useTheme } from '../context/ThemeContext'
import Sidebar from './layout/Sidebar'
import TopBar from './layout/TopBar'

export default function MainLayout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const { isDark } = useTheme()

  return (
    <div className={`min-h-screen flex ${isDark ? 'bg-surface-darker' : 'bg-gray-50'}`}>
      <Sidebar isOpen={sidebarOpen} onToggle={() => setSidebarOpen(!sidebarOpen)} />

      <div className="flex-1 flex flex-col">
        <TopBar />
        <main className="flex-1 overflow-y-auto p-6">{children}</main>
      </div>
    </div>
  )
}
