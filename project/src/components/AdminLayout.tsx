import React from 'react'
import { Outlet } from 'react-router-dom'
import AdminSidebar from '../components/AdminSidebar'

import { useAuth } from '../hooks/useAuth'

export default function AdminLayout() {
  const { loading } = useAuth()

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  return (
    <div className="flex h-[calc(100vh-4rem)]">
      <AdminSidebar />
      <main className="flex-1 p-8 overflow-y-auto bg-gray-100">
        <Outlet />
      </main>
    </div>
  )
}