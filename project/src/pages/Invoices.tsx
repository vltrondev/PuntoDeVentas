import React, { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { FileText, ShoppingBag, Search } from 'lucide-react'

import InvoiceDetailModal from '../components/InvoiceDetailModal';
import CourierSettlementModal from '../components/CourierSettlementModal';

export default function Invoices() {
    const [orders, setOrders] = useState<any[]>([])
    const [selectedOrder, setSelectedOrder] = useState<any>(null)
    const [showSettlementModal, setShowSettlementModal] = useState(false)
    const [loading, setLoading] = useState(true)

    // Filter states
    const [users, setUsers] = useState<any[]>([])
    const [filterUser, setFilterUser] = useState<string>('')
    const [filterDate, setFilterDate] = useState<string>('') // Default empty (show all)
    const [searchTerm, setSearchTerm] = useState<string>('')

    useEffect(() => {
        fetchUsers()
    }, [])

    useEffect(() => {
        fetchOrders()
    }, [filterUser, filterDate])

    async function fetchUsers() {
        const { data } = await supabase.from('profiles').select('id, email, role')
        if (data) setUsers(data)
    }

    async function fetchOrders() {
        setLoading(true)

        let query = supabase
            .from('orders')
            .select(`
                *,
                contacts (name, email, phone, address),
                assigned_profile:profiles!orders_assigned_to_fkey (email, role)
            `)
            .order('created_at', { ascending: false })

        // Apply User Filter
        if (filterUser) {
            query = query.eq('assigned_to', filterUser)
        }

        // Apply Date Filter
        if (filterDate) {
            // Create range for the selected day (00:00:00 to 23:59:59 local time generally, or specific UTC range)
            // Ideally we compare against the range of the day.
            const startDate = new Date(filterDate)
            startDate.setHours(0, 0, 0, 0)
            const endDate = new Date(filterDate)
            endDate.setHours(23, 59, 59, 999)

            query = query.gte('created_at', startDate.toISOString()).lte('created_at', endDate.toISOString())
        }

        const { data, error } = await query

        if (error) {
            console.error('Error fetching orders:', error)
            setOrders([])
        } else {
            setOrders(data || [])
        }

        setLoading(false)
    }

    const formatPrice = (price: number) => {
        return new Intl.NumberFormat('es-CO', {
            style: 'currency',
            currency: 'COP',
            minimumFractionDigits: 0
        }).format(price)
    }

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('es-CO', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        })
    }

    const handleCharge = async (orderId: string, e: React.MouseEvent) => {
        e.stopPropagation(); // Prevent opening modal
        // Removed window.confirm to avoid UI blocking issues

        try {
            // Update to 'paid' now
            const { data, error } = await supabase
                .from('orders')
                .update({ status: 'paid' })
                .eq('id', orderId)
                .select();

            if (error) {
                console.error('Supabase Error:', error);
                alert('Error al cobrar: ' + error.message);
                return;
            }

            // Check if any row was actually updated
            if (!data || data.length === 0) {
                console.warn('No rows updated. RLS issue?');
                alert('Error: No se pudo actualizar. Verifica tus permisos.');
                return;
            }

            // Success - No alert needed effectively, just update UI
            // alert('Factura cobrada correctamente.');

            // Update local state
            setOrders(orders.map(o =>
                o.id === orderId ? { ...o, status: 'paid' } : o
            ));
        } catch (error: any) {
            console.error('Error updating status:', error);
            alert('Error inesperado: ' + (error.message || error));
        }
    };

    const handleCancel = async (orderId: string, e: React.MouseEvent) => {
        e.stopPropagation();

        if (!window.confirm('¿Estás seguro de que deseas cancelar esta factura? Esta acción no se puede deshacer.')) {
            return;
        }

        try {
            const { error } = await supabase
                .from('orders')
                .update({ status: 'cancelled' })
                .eq('id', orderId);

            if (error) {
                console.error('Supabase Error:', error);
                alert('Error al cancelar: ' + error.message);
                return;
            }

            // Update local state
            setOrders(orders.map(o =>
                o.id === orderId ? { ...o, status: 'cancelled' } : o
            ));
        } catch (error: any) {
            console.error('Error updating status:', error);
            alert('Error inesperado: ' + (error.message || error));
        }
    };

    const handleAssign = async (orderId: string, userId: string) => {
        try {
            const { error } = await supabase
                .from('orders')
                .update({ assigned_to: userId || null })
                .eq('id', orderId);

            if (error) throw error;

            // Update local state
            setOrders(orders.map(o =>
                o.id === orderId ? { ...o, assigned_to: userId || null, assigned_profile: users.find(u => u.id === userId) } : o
            ));
        } catch (error: any) {
            console.error('Error assigning order:', error);
            alert('Error al asignar: ' + error.message);
        }
    };

    const handleAssignCourier = async (orderId: string, userId: string) => {
        try {
            const { error } = await supabase
                .from('orders')
                .update({ courier_id: userId || null })
                .eq('id', orderId);

            if (error) throw error;

            // Update local state
            setOrders(orders.map(o =>
                o.id === orderId ? { ...o, courier_id: userId || null } : o
            ));
        } catch (error: any) {
            console.error('Error assigning courier:', error);
            alert('Error al asignar mensajero: ' + error.message);
        }
    };

    const filteredOrders = orders.filter(order => {
        if (!searchTerm) return true
        const term = searchTerm.toLowerCase()
        const idMatch = order.id.toLowerCase().includes(term)
        const clientNameMatch = order.contacts?.name?.toLowerCase().includes(term)
        const clientEmailMatch = order.contacts?.email?.toLowerCase().includes(term)
        return idMatch || clientNameMatch || clientEmailMatch
    })

    if (loading) return <div>Cargando facturas...</div>

    return (
        <div>
            <div className="flex flex-col md:flex-row justify-between items-center mb-6">
                <div className="flex items-center gap-4">
                    <h1 className="text-3xl font-bold text-gray-800">Historial de Ventas</h1>
                    <button
                        onClick={() => setShowSettlementModal(true)}
                        className="bg-primary-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary-700 transition-colors shadow-sm flex items-center gap-2"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="16" height="20" x="4" y="2" rx="2" /><line x1="8" x2="16" y1="6" y2="6" /><line x1="8" x2="16" y1="10" y2="10" /><path d="M16 14h-8" /><path d="M12 14v4" /><path d="M8 18h8" /></svg>
                        Calc. Mensajero
                    </button>
                </div>

                <div className="flex flex-col md:flex-row gap-4 mt-4 md:mt-0 w-full md:w-auto bg-white p-3 rounded-lg shadow-sm items-end">
                    {/* Search Bar */}
                    <div className="flex flex-col w-full md:w-64">
                        <label className="text-xs font-semibold text-gray-500 mb-1">Buscar</label>
                        <div className="relative">
                            <input
                                type="text"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                placeholder="ID, Cliente o Email..."
                                className="w-full border border-gray-300 rounded px-3 py-1 pl-8 text-sm focus:ring-primary-500 focus:border-primary-500"
                            />
                            <Search className="w-4 h-4 text-gray-400 absolute left-2.5 top-1.5" />
                        </div>
                    </div>

                    {/* Date Filter */}
                    <div className="flex flex-col w-full md:w-auto">
                        <label className="text-xs font-semibold text-gray-500 mb-1">Fecha</label>
                        <input
                            type="date"
                            value={filterDate}
                            onChange={(e) => setFilterDate(e.target.value)}
                            className="border border-gray-300 rounded px-3 py-1 text-sm focus:ring-primary-500 focus:border-primary-500"
                        />
                    </div>

                    {/* User Filter */}
                    <div className="flex flex-col w-full md:w-auto">
                        <label className="text-xs font-semibold text-gray-500 mb-1">Vendedor</label>
                        <select
                            value={filterUser}
                            onChange={(e) => setFilterUser(e.target.value)}
                            className="border border-gray-300 rounded px-3 py-1 text-sm focus:ring-primary-500 focus:border-primary-500 min-w-[150px]"
                        >
                            <option value="">-- Todos --</option>
                            {users.map(u => (
                                <option key={u.id} value={u.id}>{u.email}</option>
                            ))}
                        </select>
                    </div>
                </div>
            </div>

            <div className="bg-white shadow-md rounded-lg overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fecha / ID</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tipo</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cliente</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Vendedor</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Mensajero</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total</th>
                            <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Estado</th>
                            <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {filteredOrders.map((order) => {
                            const isInvoice = order.order_type === 'invoice';
                            const showChargeButton = order.status === 'pending' || order.status === 'delivered';

                            return (
                                <tr
                                    key={order.id}
                                    className="hover:bg-gray-50 cursor-pointer transition-colors"
                                >
                                    <td className="px-6 py-4 whitespace-nowrap" onClick={() => setSelectedOrder(order)}>
                                        <div className="text-sm font-medium text-gray-900">{formatDate(order.created_at)}</div>
                                        <div className="text-xs text-gray-500">#{order.id.substring(0, 8)}</div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap" onClick={() => setSelectedOrder(order)}>
                                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${isInvoice ? 'bg-purple-100 text-purple-800' : 'bg-green-100 text-green-800'
                                            }`}>
                                            {isInvoice ? <><FileText className="w-3 h-3 mr-1" /> Factura</> : <><ShoppingBag className="w-3 h-3 mr-1" /> Venta</>}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap" onClick={() => setSelectedOrder(order)}>
                                        <div className="text-sm text-gray-900">{order.contacts?.name || 'Cliente Casual'}</div>
                                        <div className="text-xs text-gray-500">{order.contacts?.email}</div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        <select
                                            value={order.assigned_to || ''}
                                            onClick={(e) => e.stopPropagation()}
                                            onChange={(e) => handleAssign(order.id, e.target.value)}
                                            className="block w-full pl-3 pr-10 py-1 text-xs border-gray-300 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm rounded-md"
                                        >
                                            <option value="">Sin asignar</option>
                                            {users.map(u => (
                                                <option key={u.id} value={u.id}>
                                                    {u.email} {u.role === 'courier' ? '(M)' : ''}
                                                </option>
                                            ))}
                                        </select>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        <select
                                            value={order.courier_id || ''}
                                            onClick={(e) => e.stopPropagation()}
                                            onChange={(e) => handleAssignCourier(order.id, e.target.value)}
                                            className="block w-full pl-3 pr-10 py-1 text-xs border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md bg-blue-50"
                                        >
                                            <option value="">Sin asignar</option>
                                            {/* Show only couriers or all users ideally? User said "assign to delivery". Filtering by role 'courier' is best if roles are strict, but I'll show all with emphasis on (M) */}
                                            {users.map(u => (
                                                <option key={u.id} value={u.id} className={u.role === 'courier' ? 'font-bold' : ''}>
                                                    {u.email} {u.role === 'courier' ? '(M)' : ''}
                                                </option>
                                            ))}
                                        </select>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900" onClick={() => setSelectedOrder(order)}>
                                        {formatPrice(order.total)}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-center" onClick={() => setSelectedOrder(order)}>
                                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${(order.status === 'paid') ? 'bg-green-100 text-green-800' :
                                            (order.status === 'delivered') ? 'bg-blue-100 text-blue-800' :
                                                order.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                                                    order.status === 'suspended' ? 'bg-orange-100 text-orange-800' :
                                                        order.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                                                            'bg-gray-100 text-gray-800'
                                            }`}>
                                            {(order.status === 'paid') ? 'Pagado' :
                                                (order.status === 'delivered') ? 'Entregado' :
                                                    order.status === 'pending' ? 'Pendiente' :
                                                        order.status === 'suspended' ? 'Suspendido' :
                                                            order.status === 'cancelled' ? 'Cancelado' : order.status}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-medium">
                                        {showChargeButton && (
                                            <div className="flex justify-center gap-2">
                                                <button
                                                    onClick={(e) => handleCharge(order.id, e)}
                                                    className="bg-green-600 text-white px-3 py-1 rounded text-xs hover:bg-green-700 transition-colors shadow-sm z-50 relative"
                                                >
                                                    {order.status === 'delivered' ? 'Confirmar Pago' : 'Cobrar'}
                                                </button>
                                                <button
                                                    onClick={(e) => handleCancel(order.id, e)}
                                                    className="bg-red-600 text-white px-3 py-1 rounded text-xs hover:bg-red-700 transition-colors shadow-sm z-50 relative"
                                                >
                                                    Cancelar
                                                </button>
                                            </div>
                                        )}
                                    </td>
                                </tr>
                            )
                        })}
                    </tbody>
                </table>

                {filteredOrders.length === 0 && (
                    <div className="p-12 text-center text-gray-500">No hay registros de ventas o facturas.</div>
                )}
            </div>

            {showSettlementModal && (
                <CourierSettlementModal
                    onClose={() => setShowSettlementModal(false)}
                    onUpdate={fetchOrders}
                />
            )}

            {selectedOrder && (
                <InvoiceDetailModal
                    order={selectedOrder}
                    onClose={() => setSelectedOrder(null)}
                />
            )}
        </div>
    )
}
