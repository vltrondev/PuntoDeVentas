import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';
import type { Order } from '../types';
import { Package, Smartphone, MapPin, DollarSign, XCircle, Search, ChevronDown, Truck, CheckCircle, Clock } from 'lucide-react';
import { format, isToday } from 'date-fns';
import { es } from 'date-fns/locale';

export default function CourierDashboard() {
    const { user } = useAuth();
    const [orders, setOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [processingId, setProcessingId] = useState<string | null>(null);


    useEffect(() => {
        if (user) {
            fetchAssignedOrders();
        }
    }, [user]);

    const fetchAssignedOrders = async () => {
        try {
            setLoading(true);
            const { data, error } = await supabase
                .from('orders')
                .select(`
          *,
          profiles:user_id (email),
          contacts (name, address, phone),
          order_items (
            quantity,
            price,
            product:products (name, image_url)
          )
        `)
                .eq('courier_id', user?.id)
                .order('created_at', { ascending: false });

            if (error) throw error;
            setOrders(data || []);
        } catch (error) {
            console.error('Error fetching orders:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleStatusUpdate = async (orderId: string, newStatus: Order['status']) => {
        if (!confirm(newStatus === 'delivered' ? '¿Confirmar entrega de esta orden?' : '¿Suspender entrega de esta orden?')) {
            return;
        }

        setProcessingId(orderId);
        try {
            const { error } = await supabase
                .from('orders')
                .update({ status: newStatus })
                .eq('id', orderId);

            if (error) throw error;

            // Update local state
            setOrders(orders.map(o => o.id === orderId ? { ...o, status: newStatus } : o));
        } catch (error) {
            console.error('Error updating status:', error);
            alert('Error al actualizar el estado de la orden');
        } finally {
            setProcessingId(null);
        }
    };

    const filteredOrders = orders.filter(order => {
        const searchLower = searchTerm.toLowerCase();
        const contactName = (order as any).contacts?.name?.toLowerCase() || '';
        const orderId = order.id.toLowerCase();
        return contactName.includes(searchLower) || orderId.includes(searchLower);
    });

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'paid': return 'bg-green-100 text-green-800';
            case 'suspended': return 'bg-orange-100 text-orange-800';
            case 'delivered': return 'bg-blue-100 text-blue-800';
            case 'cancelled': return 'bg-red-100 text-red-800';
            case 'assigned': return 'bg-indigo-100 text-indigo-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    const getStatusLabel = (status: string) => {
        switch (status) {
            case 'paid': return 'Cobrado';
            case 'suspended': return 'Suspendido';
            case 'delivered': return 'Entregado';
            case 'cancelled': return 'Cancelado';
            case 'pending': return 'Pendiente';
            case 'processing': return 'Procesando';
            case 'shipped': return 'En camino';
            case 'assigned': return 'Asignada';
            default: return status;
        }
    };

    // Calculate Daily Stats
    const todayOrders = orders.filter(order => isToday(new Date(order.created_at)));
    const deliveredToday = todayOrders.filter(order => order.status === 'paid' || order.status === 'delivered').length;
    const pendingToday = todayOrders.filter(order => order.status === 'pending' || order.status === 'processing' || order.status === 'shipped' || order.status === 'assigned').length;
    const suspendedToday = todayOrders.filter(order => order.status === 'suspended').length;
    const dailyEarnings = deliveredToday * 250;
    const totalMoneyToday = todayOrders
        .filter(order => order.status === 'paid' || order.status === 'delivered')
        .reduce((sum, order) => sum + (order.total + (order.shipping_cost || 0)), 0);

    if (loading) {
        return (
            <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
                <div>
                    <h2 className="text-2xl font-bold text-gray-800">Envíos Asignados</h2>
                    <p className="text-gray-500 text-sm mt-1">Gestiona tus entregas pendientes</p>
                </div>

                <div className="flex gap-2 w-full sm:w-auto">
                    <button
                        onClick={fetchAssignedOrders}
                        className="p-2 text-gray-600 hover:text-primary-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                        title="Actualizar lista"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                    </button>
                    <div className="relative w-full sm:w-64">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                        <input
                            type="text"
                            placeholder="Buscar por cliente o ID..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                        />
                    </div>
                </div>
            </div>

            {/* Daily Tracker */}
            <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
                <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex items-center justify-between">
                    <div>
                        <p className="text-sm text-gray-500">Ganancias Hoy</p>
                        <p className="text-2xl font-bold text-amber-600">${dailyEarnings.toLocaleString()}</p>
                    </div>
                    <div className="bg-amber-100 p-2 rounded-lg">
                        <DollarSign className="h-6 w-6 text-amber-600" />
                    </div>
                </div>

                <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex items-center justify-between">
                    <div>
                        <p className="text-sm text-gray-500">Entregados Hoy</p>
                        <p className="text-2xl font-bold text-gray-800">{deliveredToday}</p>
                    </div>
                    <div className="bg-green-100 p-2 rounded-lg">
                        <CheckCircle className="h-6 w-6 text-green-600" />
                    </div>
                </div>

                <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex items-center justify-between">
                    <div>
                        <p className="text-sm text-gray-500">Pendientes Hoy</p>
                        <p className="text-2xl font-bold text-gray-800">{pendingToday}</p>
                    </div>
                    <div className="bg-blue-100 p-2 rounded-lg">
                        <Clock className="h-6 w-6 text-blue-600" />
                    </div>
                </div>

                <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex items-center justify-between">
                    <div>
                        <p className="text-sm text-gray-500">Suspendidos Hoy</p>
                        <p className="text-2xl font-bold text-gray-800">{suspendedToday}</p>
                    </div>
                    <div className="bg-orange-100 p-2 rounded-lg">
                        <XCircle className="h-6 w-6 text-orange-600" />
                    </div>
                </div>

                <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex items-center justify-between">
                    <div>
                        <p className="text-sm text-gray-500">Cobrado Hoy</p>
                        <p className="text-2xl font-bold text-gray-800">${totalMoneyToday.toLocaleString()}</p>
                    </div>
                    <div className="bg-primary-100 p-2 rounded-lg">
                        <DollarSign className="h-6 w-6 text-primary-600" />
                    </div>
                </div>
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {filteredOrders.map((order) => {
                    const contact = (order as any).contacts;
                    const items = (order as any).order_items || [];
                    const isPending = order.status === 'pending' || order.status === 'processing' || order.status === 'shipped' || order.status === 'assigned';

                    return (
                        <div key={order.id} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden flex flex-col">
                            <div className="p-5 flex-1">
                                <div className="flex justify-between items-start mb-4">
                                    <div>
                                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}>
                                            {getStatusLabel(order.status)}
                                        </span>
                                        <p className="text-xs text-gray-500 mt-2">
                                            {format(new Date(order.created_at), "d 'de' MMM, h:mm a", { locale: es })}
                                        </p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-lg font-bold text-primary-600">
                                            ${(order.total + (order.shipping_cost || 0)).toLocaleString()}
                                        </p>
                                        <p className="text-xs text-gray-500">Total a cobrar</p>
                                    </div>
                                </div>

                                <div className="space-y-3">
                                    <div className="flex items-start gap-3">
                                        <div className="bg-blue-50 p-2 rounded-lg shrink-0">
                                            <Package className="h-5 w-5 text-blue-600" />
                                        </div>
                                        <div>
                                            <p className="font-medium text-gray-900">{contact?.name || 'Cliente sin nombre'}</p>
                                            <p className="text-sm text-gray-500">{items.length} {items.length === 1 ? 'producto' : 'productos'}</p>
                                        </div>
                                    </div>

                                    {contact?.address && (
                                        <div className="flex items-start gap-3">
                                            <div className="bg-orange-50 p-2 rounded-lg shrink-0">
                                                <MapPin className="h-5 w-5 text-orange-600" />
                                            </div>
                                            <p className="text-sm text-gray-600 mt-1">{contact.address}</p>
                                        </div>
                                    )}

                                    {contact?.phone && (
                                        <div className="flex items-center gap-3">
                                            <div className="bg-green-50 p-2 rounded-lg shrink-0">
                                                <Smartphone className="h-5 w-5 text-green-600" />
                                            </div>
                                            <a href={`tel:${contact.phone}`} className="text-sm text-primary-600 hover:underline">
                                                {contact.phone}
                                            </a>
                                        </div>
                                    )}
                                </div>

                                <div className="mt-4 pt-4 border-t border-gray-100">
                                    <details className="group">
                                        <summary className="flex cursor-pointer items-center justify-between text-sm font-medium text-gray-500 hover:text-gray-900">
                                            <span>Ver detalles del pedido</span>
                                            <span className="transition group-open:rotate-180">
                                                <ChevronDown className="h-4 w-4" />
                                            </span>
                                        </summary>
                                        <div className="mt-3 space-y-2">
                                            {items.map((item: any, idx: number) => (
                                                <div key={idx} className="flex justify-between text-sm">
                                                    <span className="text-gray-600">
                                                        {item.quantity}x {item.product?.name}
                                                    </span>
                                                    <span className="font-medium text-gray-900">
                                                        ${(item.price * item.quantity).toLocaleString()}
                                                    </span>
                                                </div>
                                            ))}
                                            {order.shipping_cost && (
                                                <div className="flex justify-between text-sm border-t border-dashed border-gray-200 pt-2 mt-2">
                                                    <span className="text-gray-600">Envío</span>
                                                    <span className="font-medium text-gray-900">${order.shipping_cost.toLocaleString()}</span>
                                                </div>
                                            )}
                                        </div>
                                    </details>
                                </div>
                            </div>

                            {isPending && (
                                <div className="p-4 bg-gray-50 border-t border-gray-200 grid grid-cols-2 gap-3">
                                    <button
                                        onClick={() => handleStatusUpdate(order.id, 'delivered')}
                                        disabled={!!processingId}
                                        className="flex items-center justify-center gap-2 w-full py-2.5 px-4 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        <CheckCircle className="h-4 w-4" />
                                        Entregado
                                    </button>
                                    <button
                                        onClick={() => handleStatusUpdate(order.id, 'suspended')}
                                        disabled={!!processingId}
                                        className="flex items-center justify-center gap-2 w-full py-2.5 px-4 bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        <XCircle className="h-4 w-4" />
                                        Suspender
                                    </button>
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>

            {filteredOrders.length === 0 && !loading && (
                <div className="text-center py-12 bg-white rounded-xl shadow-sm border border-gray-200">
                    <Truck className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900">No hay envíos asignados</h3>
                    <p className="text-gray-500 mt-2">No tienes pedidos pendientes de entrega en este momento.</p>
                </div>
            )}
        </div>
    );
}
