
import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'

export default function ProtectedAdminRoute() {
  const { isAdmin, loading } = useAuth()

  if (loading) {
    return <div className="flex-1 flex items-center justify-center">Cargando...</div>
  }

  return isAdmin ? <Outlet /> : <Navigate to="/" replace />
}