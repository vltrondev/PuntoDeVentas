

import { NavLink } from 'react-router-dom'
import { LayoutDashboard, Package, Users, BarChart2, TrendingUp, X } from 'lucide-react'
import { useAuth } from '../hooks/useAuth'

const commonLinkClasses = "flex items-center px-4 py-2.5 text-sm font-medium rounded-lg transition-colors"
const activeLinkClasses = "bg-primary-100 text-primary-700"
const inactiveLinkClasses = "text-gray-600 hover:bg-gray-100 hover:text-gray-900"

interface AdminSidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
}

export default function AdminSidebar({ isOpen = false, onClose }: AdminSidebarProps) {
  const { isAdmin } = useAuth()

  const sidebarClasses = `
    fixed inset-y-0 left-0 z-40 w-64 bg-white border-r border-gray-200 
    transform transition-transform duration-300 ease-in-out
    md:translate-x-0 md:static md:h-auto md:shadow-none
    ${isOpen ? 'translate-x-0 shadow-xl' : '-translate-x-full'}
  `

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-30 md:hidden"
          onClick={onClose}
        />
      )}

      <aside className={sidebarClasses}>
        <div className="p-4 flex justify-between items-center">
          <h2 className="text-lg font-semibold text-gray-800">Administración</h2>
          <button
            onClick={onClose}
            className="md:hidden p-1 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-full"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <nav className="flex flex-col p-4 space-y-1">
          <NavLink
            to="/admin"
            end
            onClick={onClose}
            className={({ isActive }) => `${commonLinkClasses} ${isActive ? activeLinkClasses : inactiveLinkClasses}`}
          >
            <LayoutDashboard className="h-5 w-5 mr-3" />
            Dashboard
          </NavLink>

          {isAdmin && (
            <NavLink
              to="/admin/productos"
              onClick={onClose}
              className={({ isActive }) => `${commonLinkClasses} ${isActive ? activeLinkClasses : inactiveLinkClasses}`}
            >
              <Package className="h-5 w-5 mr-3" />
              Productos
            </NavLink>
          )}

          {isAdmin && (
            <NavLink
              to="/admin/facturas"
              onClick={onClose}
              className={({ isActive }) => `${commonLinkClasses} ${isActive ? activeLinkClasses : inactiveLinkClasses}`}
            >
              <BarChart2 className="h-5 w-5 mr-3" />
              Facturación
            </NavLink>
          )}

          <NavLink
            to="/admin/contactos"
            onClick={onClose}
            className={({ isActive }) => `${commonLinkClasses} ${isActive ? activeLinkClasses : inactiveLinkClasses}`}
          >
            <Users className="h-5 w-5 mr-3" />
            Contactos
          </NavLink>
          {isAdmin && (
            <NavLink
              to="/admin/reportes"
              onClick={onClose}
              className={({ isActive }) => `${commonLinkClasses} ${isActive ? activeLinkClasses : inactiveLinkClasses}`}
            >
              <TrendingUp className="h-5 w-5 mr-3" />
              Reportes
            </NavLink>
          )}
        </nav>
      </aside>
    </>
  )
}