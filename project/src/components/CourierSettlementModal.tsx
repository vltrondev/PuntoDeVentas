import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { X, DollarSign, Calculator } from 'lucide-react';

interface CourierSettlementModalProps {
    onClose: () => void;
    onUpdate: () => void; // Trigger refresh in parent
}

export default function CourierSettlementModal({ onClose, onUpdate }: CourierSettlementModalProps) {
    const [couriers, setCouriers] = useState<any[]>([]);
    const [selectedCourier, setSelectedCourier] = useState<string>('');
    const [pendingOrders, setPendingOrders] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [calculating, setCalculating] = useState(false);

    useEffect(() => {
        fetchCouriers();
    }, []);

    useEffect(() => {
        if (selectedCourier) {
            fetchPendingOrders(selectedCourier);
        } else {
            setPendingOrders([]);
        }
    }, [selectedCourier]);

    const fetchCouriers = async () => {
        // Fetch all users, identifying couriers. Ideally filter by role if backend supports strict roles.
        const { data } = await supabase.from('profiles').select('id, email, role');
        if (data) {
            // Filter typically for role='courier' or show all if role usage is loose.
            // As per instructions, highlighting (M) is common, but here we probably only want to select people who CAN be couriers.
            // Let's show all for flexibility but sort couriers first.
            const sorted = data.sort((a, b) => (b.role === 'courier' ? 1 : 0) - (a.role === 'courier' ? 1 : 0));
            setCouriers(sorted);
        }
    };

    const fetchPendingOrders = async (courierId: string) => {
        setCalculating(true);
        const { data, error } = await supabase
            .from('orders')
            .select('*')
            .eq('courier_id', courierId)
            // Filter for orders that need settlement: pending, shipped, processing AND delivered.
            .in('status', ['pending', 'shipped', 'processing', 'delivered']);

        if (error) {
            console.error('Error fetching orders:', error);
        } else {
            setPendingOrders(data || []);
        }
        setCalculating(false);
    };

    const handleSettleAll = async () => {
        if (!selectedCourier || pendingOrders.length === 0) return;

        if (!window.confirm(`¿Estás seguro de cobrar ${pendingOrders.length} ordenes? Total: $${totalAmount.toLocaleString()}`)) {
            return;
        }

        setLoading(true);
        try {
            const orderIds = pendingOrders.map(o => o.id);

            // Update all to 'paid' (Admin settlement)
            const { error } = await supabase
                .from('orders')
                .update({ status: 'paid' })
                .in('id', orderIds);

            if (error) throw error;

            alert('¡Ordenes cobradas exitosamente!');
            onUpdate(); // Refresh parent list
            onClose(); // Close modal
        } catch (error: any) {
            console.error('Error settling orders:', error);
            alert('Error al cobrar ordenes: ' + error.message);
        } finally {
            setLoading(false);
        }
    };

    const totalAmount = pendingOrders.reduce((sum, order) => sum + (Number(order.total) || 0), 0);

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-md overflow-hidden">
                <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                    <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                        <Calculator className="w-5 h-5 text-primary-600" />
                        Cuadre de Mensajero
                    </h3>
                    <button onClick={onClose} className="p-1 hover:bg-gray-200 rounded-full transition-colors">
                        <X className="w-5 h-5 text-gray-500" />
                    </button>
                </div>

                <div className="p-6 space-y-6">
                    {/* Courier Selector */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Seleccionar Mensajero</label>
                        <select
                            value={selectedCourier}
                            onChange={(e) => setSelectedCourier(e.target.value)}
                            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                        >
                            <option value="">-- Seleccionar --</option>
                            {couriers.map(user => (
                                <option key={user.id} value={user.id} className={user.role === 'courier' ? 'font-bold' : ''}>
                                    {user.email} {user.role === 'courier' ? '(M)' : ''}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Stats Display */}
                    {selectedCourier && (
                        <div className="bg-blue-50 rounded-xl p-4 border border-blue-100 animate-fade-in">
                            {calculating ? (
                                <div className="text-center py-4 text-blue-600">Calculando...</div>
                            ) : (
                                <>
                                    <div className="flex justify-between items-center mb-2">
                                        <span className="text-blue-700 font-medium">Pedidos Pendientes:</span>
                                        <span className="bg-blue-200 text-blue-800 px-2 py-0.5 rounded-full text-sm font-bold">
                                            {pendingOrders.length}
                                        </span>
                                    </div>
                                    <div className="flex justify-between items-center pt-2 border-t border-blue-200">
                                        <span className="text-blue-900 font-bold text-lg">Total a Cobrar:</span>
                                        <span className="text-blue-900 font-bold text-xl">
                                            ${totalAmount.toLocaleString()}
                                        </span>
                                    </div>
                                </>
                            )}
                        </div>
                    )}

                    {/* Action Button */}
                    <button
                        onClick={handleSettleAll}
                        disabled={!selectedCourier || pendingOrders.length === 0 || loading || calculating}
                        className="w-full btn-primary py-3 flex items-center justify-center gap-2 text-lg disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {loading ? (
                            <span>Procesando...</span>
                        ) : (
                            <>
                                <DollarSign className="w-5 h-5" />
                                Cobrar Todo
                            </>
                        )}
                    </button>

                    {selectedCourier && pendingOrders.length === 0 && !calculating && (
                        <p className="text-center text-sm text-gray-500">
                            Este mensajero no tiene pedidos pendientes de cobro.
                        </p>
                    )}
                </div>
            </div>
        </div>
    );
}
