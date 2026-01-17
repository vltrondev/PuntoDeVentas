
import { Link } from 'react-router-dom';
import { Package, Users, BarChart2, PlusCircle } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';

export default function AdminPanel() {
  const { isAdmin } = useAuth();

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold text-gray-800 mb-8">Panel de Administración</h1>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {isAdmin && (
          <Link to="/admin/productos" className="card p-6 text-center hover:border-primary-500 border-2 border-transparent transition-all">
            <Package className="h-12 w-12 mx-auto text-primary-500 mb-4" />
            <h2 className="text-xl font-semibold">Gestionar Productos</h2>
          </Link>
        )}
        <Link to="/admin/contactos" className="card p-6 text-center hover:border-primary-500 border-2 border-transparent transition-all">
          <Users className="h-12 w-12 mx-auto text-primary-500 mb-4" />
          <h2 className="text-xl font-semibold">Gestionar Contactos</h2>
        </Link>
        {isAdmin && (
          <Link to="/admin/productos/nuevo" className="card p-6 text-center hover:border-primary-500 border-2 border-transparent transition-all">
            <PlusCircle className="h-12 w-12 mx-auto text-primary-500 mb-4" />
            <h2 className="text-xl font-semibold">Añadir Producto</h2>
          </Link>
        )}
        {isAdmin && (
          <Link to="/admin/reportes" className="card p-6 text-center hover:border-primary-500 border-2 border-transparent transition-all">
            <BarChart2 className="h-12 w-12 mx-auto text-primary-500 mb-4" />
            <h2 className="text-xl font-semibold">Reportes de Ventas</h2>
          </Link>
        )}
      </div>
    </div>
  );
}