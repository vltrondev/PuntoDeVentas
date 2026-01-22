
import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import { Menu } from 'lucide-react'
import AdminSidebar from '../components/AdminSidebar'

import { useAuth } from '../hooks/useAuth'

export default function AdminLayout() {
  const { loading } = useAuth()
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  return (
    <div className="flex h-[calc(100vh-4rem)] relative">
      <button
        className="md:hidden absolute top-4 left-4 z-20 p-2 bg-white rounded-md shadow-md text-gray-700 hover:bg-gray-50"
        onClick={() => setIsSidebarOpen(true)}
      >
        <Menu className="h-6 w-6" />
      </button>

      <AdminSidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />

      <main className="flex-1 p-8 overflow-y-auto bg-gray-100 w-full">
        <Outlet />
      </main>
    </div>
  )
}