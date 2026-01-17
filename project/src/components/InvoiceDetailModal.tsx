import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { X, Printer, Package, User } from 'lucide-react';


interface InvoiceDetailModalProps {
    order: any; // Using any for now to handle Joined data (contacts, profiles)
    onClose: () => void;
}

export default function InvoiceDetailModal({ order, onClose }: InvoiceDetailModalProps) {
    const [items, setItems] = useState<any[]>([]);
    const [loadingItems, setLoadingItems] = useState(false);

    useEffect(() => {
        if (order?.id) {
            fetchItems(order.id);
        }
    }, [order]);

    async function fetchItems(orderId: string) {
        setLoadingItems(true);
        const { data, error } = await supabase
            .from('order_items')
            .select(`
        *,
        product:products(name, price)
      `)
            .eq('order_id', orderId);

        if (error) {
            console.error('Error fetching items:', error);
        } else {
            setItems(data || []);
        }
        setLoadingItems(false);
    }

    const formatPrice = (price: number) => {
        return new Intl.NumberFormat('es-CO', {
            style: 'currency',
            currency: 'COP',
            minimumFractionDigits: 0
        }).format(price);
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('es-CO', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    if (!order) return null;

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            {/* Add print-this class to the main content card */}
            <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto flex flex-col print-this">
                {/* Header */}
                <div className="p-6 border-b border-gray-100 flex justify-between items-start">
                    <div>
                        <h2 className="text-2xl font-bold text-gray-900">GRUPO NC</h2>
                        <p className="text-sm text-gray-500">Detalle de {order.order_type === 'invoice' ? 'Factura' : 'Venta'} #{order.id.substring(0, 8)}</p>
                    </div>
                    {/* Add no-print to close button */}
                    <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors no-print">
                        <X className="w-5 h-5 text-gray-500" />
                    </button>
                </div>

                <div className="p-6 space-y-8 flex-1">
                    {/* Customer Info */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-gray-50 p-4 rounded-lg">
                        <div>
                            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 flex items-center gap-2">
                                <User className="w-3 h-3" /> Cliente
                            </h3>
                            <p className="font-medium text-gray-900 text-lg">{order.contacts?.name || 'Cliente Casual'}</p>
                            <p className="text-sm text-gray-500">{order.contacts?.email || 'Sin correo registrado'}</p>
                            {order.contacts?.phone && (
                                <p className="text-sm text-gray-500 flex items-center gap-1 mt-1">
                                    <span className="font-semibold text-xs">Tel:</span> {order.contacts.phone}
                                </p>
                            )}
                            {order.contacts?.address && (
                                <p className="text-sm text-gray-500 flex items-center gap-1">
                                    <span className="font-semibold text-xs">Dir:</span> {order.contacts.address}
                                </p>
                            )}
                        </div>
                        <div>
                            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Información del Pedido</h3>
                            <div className="space-y-1">
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-500">Fecha:</span>
                                    <span className="font-medium">{formatDate(order.created_at)}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-500">Estado:</span>
                                    <span className="font-medium capitalize">{order.status}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-500">Método de Pago:</span>
                                    <span className="font-medium capitalize">{order.payment_method || 'Efectivo'}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-500">Vendedor:</span>
                                    <span className="font-medium">
                                        {/* Use assigned_profile if available (from joining), otherwise fallback to ID */}
                                        {order.assigned_profile?.email || (order.assigned_to ? `ID: ${order.assigned_to.substring(0, 8)}` : 'No asignado')}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Items Table */}
                    <div>
                        <h3 className="text-sm font-semibold text-gray-900 mb-4 flex items-center gap-2">
                            <Package className="w-4 h-4" /> Productos Enviados
                        </h3>

                        <div className="border rounded-lg overflow-hidden">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Producto</th>
                                        <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">Cant.</th>
                                        <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">Precio Unit.</th>
                                        <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">Subtotal</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {loadingItems ? (
                                        <tr>
                                            <td colSpan={4} className="px-4 py-8 text-center text-gray-500">
                                                Cargando productos...
                                            </td>
                                        </tr>
                                    ) : items.length === 0 ? (
                                        <tr>
                                            <td colSpan={4} className="px-4 py-8 text-center text-gray-500">
                                                No se encontraron productos.
                                            </td>
                                        </tr>
                                    ) : (
                                        items.map((item) => (
                                            <tr key={item.id}>
                                                <td className="px-4 py-2 text-sm text-gray-900">
                                                    {item.product?.name || 'Producto eliminado'}
                                                </td>
                                                <td className="px-4 py-2 text-sm text-gray-900 text-right">
                                                    {item.quantity}
                                                </td>
                                                <td className="px-4 py-2 text-sm text-gray-500 text-right">
                                                    {formatPrice(item.price_at_time || item.product?.price || 0)}
                                                </td>
                                                <td className="px-4 py-2 text-sm text-gray-900 text-right font-medium">
                                                    {formatPrice((item.price_at_time || item.product?.price || 0) * item.quantity)}
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                                <tfoot className="bg-gray-50">
                                    <tr>
                                        <td colSpan={3} className="px-4 py-3 text-right text-sm font-bold text-gray-900">Total:</td>
                                        <td className="px-4 py-3 text-right text-sm font-bold text-gray-900">{formatPrice(order.total)}</td>
                                    </tr>
                                </tfoot>
                            </table>
                        </div>
                    </div>
                </div>

                {/* Footer Actions - Add no-print */}
                <div className="p-4 border-t border-gray-100 flex justify-end gap-2 bg-gray-50 rounded-b-lg no-print">
                    <button
                        onClick={() => window.print()}
                        className="flex items-center gap-2 px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium"
                    >
                        <Printer className="w-4 h-4" />
                        Imprimir
                    </button>
                    <button
                        onClick={onClose}
                        className="px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors text-sm font-medium"
                    >
                        Cerrar
                    </button>
                </div>
            </div>
        </div>
    );
}
