import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import { Sidebar } from '@/layouts/Sidebar'
import { TopNav } from '@/layouts/TopNav'

export function AppLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    /* bg-[#F5F7FA] matches --clr-bg token */
    <div className="flex min-h-screen bg-[#F5F7FA]">
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* ── Main column ── */}
      <div className="flex min-w-0 flex-1 flex-col">
        <TopNav onMenuClick={() => setSidebarOpen(true)} />

        {/* Page content — 24px padding on all sides, centred, max-width capped */}
        <main className="flex-1 px-6 py-6">
          <div className="mx-auto w-full max-w-[1600px]">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  )
}
