

import { NavLink } from 'react-router-dom'
import { LayoutDashboard, Package, Users, BarChart2, TrendingUp } from 'lucide-react'
import { useAuth } from '../hooks/useAuth'

const commonLinkClasses = "flex items-center px-4 py-2.5 text-sm font-medium rounded-lg transition-colors"
const activeLinkClasses = "bg-primary-100 text-primary-700"
const inactiveLinkClasses = "text-gray-600 hover:bg-gray-100 hover:text-gray-900"

export default function AdminSidebar() {
  const { isAdmin } = useAuth()

  return (
    <aside className="w-64 bg-white border-r border-gray-200 flex-shrink-0">
      <div className="p-4">
        <h2 className="text-lg font-semibold text-gray-800">Administración</h2>
      </div>
      <nav className="flex flex-col p-4 space-y-1">
        <NavLink
          to="/admin"
          end
          className={({ isActive }) => `${commonLinkClasses} ${isActive ? activeLinkClasses : inactiveLinkClasses}`}
        >
          <LayoutDashboard className="h-5 w-5 mr-3" />
          Dashboard
        </NavLink>

        {isAdmin && (
          <NavLink
            to="/admin/productos"
            className={({ isActive }) => `${commonLinkClasses} ${isActive ? activeLinkClasses : inactiveLinkClasses}`}
          >
            <Package className="h-5 w-5 mr-3" />
            Productos
          </NavLink>
        )}

        {isAdmin && (
          <NavLink
            to="/admin/facturas"
            className={({ isActive }) => `${commonLinkClasses} ${isActive ? activeLinkClasses : inactiveLinkClasses}`}
          >
            <BarChart2 className="h-5 w-5 mr-3" />
            Facturación
          </NavLink>
        )}

        <NavLink
          to="/admin/contactos"
          className={({ isActive }) => `${commonLinkClasses} ${isActive ? activeLinkClasses : inactiveLinkClasses}`}
        >
          <Users className="h-5 w-5 mr-3" />
          Contactos
        </NavLink>
        {isAdmin && (
          <NavLink
            to="/admin/reportes"
            className={({ isActive }) => `${commonLinkClasses} ${isActive ? activeLinkClasses : inactiveLinkClasses}`}
          >
            <TrendingUp className="h-5 w-5 mr-3" />
            Reportes
          </NavLink>
        )}
      </nav>
    </aside>
  )
}