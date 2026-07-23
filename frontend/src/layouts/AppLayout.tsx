import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import { Sidebar } from '@/layouts/Sidebar'
import { TopNav } from '@/layouts/TopNav'

export function AppLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    /*
     * Root shell:
     *   - Full viewport height, no horizontal overflow.
     *   - On desktop (lg+): sidebar is STATIC in the flex row — it takes
     *     its own space so main content is never hidden behind it.
     *   - On mobile: sidebar is FIXED/drawer — overlay appears, content
     *     is not shifted.
     *
     * Key decisions:
     *   - `overflow-hidden` on root prevents any sidebar-caused x-scroll.
     *   - Sidebar uses `shrink-0` so it never gets squeezed by flex.
     *   - Main column uses `min-w-0` + `flex-1` to fill remaining space.
     *   - `overflow-y-auto` on main allows page-level scrolling.
     */
    <div className="flex h-screen overflow-hidden bg-[#F4F6F9]">

      {/* ── Sidebar (static on desktop, fixed drawer on mobile) ── */}
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* ── Main column — never overlaps sidebar on desktop ── */}
      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">

        {/* Sticky top nav */}
        <TopNav onMenuClick={() => setSidebarOpen(true)} />

        {/* Scrollable page content */}
        <main className="flex-1 overflow-y-auto">
          <div className="mx-auto w-full max-w-[1440px] px-5 py-6 sm:px-6 lg:px-8">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  )
}
