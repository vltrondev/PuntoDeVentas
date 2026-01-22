
import { Outlet, Navigate } from 'react-router-dom'
import Header from './Header'
import DebugAuth from './DebugAuth'
import { useAuth } from '../hooks/useAuth'

export default function AppLayout() {
  const { isCourier } = useAuth()

  if (isCourier) {
    return <Navigate to="/mensajero" replace />
  }

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-grow">
        <Outlet />
      </main>
      <DebugAuth />
    </div>
  )
}