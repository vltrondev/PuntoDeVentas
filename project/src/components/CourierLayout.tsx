import { Outlet, Navigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { LogOut, Truck } from 'lucide-react';

export default function CourierLayout() {
    const { user, isCourier, signOut } = useAuth();

    if (!user || !isCourier) {
        return <Navigate to="/login" replace />;
    }

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col">
            <header className="bg-white border-b border-gray-200 px-4 py-3 flex justify-between items-center sticky top-0 z-30 shadow-sm">
                <div className="flex items-center gap-2 text-primary-600">
                    <Truck className="h-6 w-6" />
                    <h1 className="text-xl font-bold">Panel de Mensajería</h1>
                </div>

                <div className="flex items-center gap-4">
                    <span className="text-sm font-medium text-gray-600 hidden sm:block">
                        {user.email}
                    </span>
                    <button
                        onClick={() => signOut()}
                        className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Cerrar sesión"
                    >
                        <LogOut className="h-5 w-5" />
                    </button>
                </div>
            </header>

            <main className="flex-1 p-4 md:p-6 max-w-7xl mx-auto w-full">
                <Outlet />
            </main>
        </div>
    );
}
