import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import { Sidebar } from '@/layouts/Sidebar'
import { TopNav } from '@/layouts/TopNav'

export function AppLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <div className="app-shell flex min-h-screen bg-slate-100">
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="flex min-w-0 flex-1 flex-col">
        <TopNav onMenuClick={() => setSidebarOpen(true)} />
        <main className="flex-1 px-4 py-5 sm:px-6 lg:px-8 lg:py-7">
          <div className="app-main app-page">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  )
}
