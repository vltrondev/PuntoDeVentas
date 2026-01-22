import { useState, useEffect } from 'react'
import { format, startOfWeek, endOfWeek } from 'date-fns'
import { es } from 'date-fns/locale'
import { Calendar, DollarSign, TrendingUp, Search } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'

interface Order {
    id: string
    created_at: string
    total: number
    status: string
    contact_id: string | null
    contacts?: {
        name: string
    }
}

export default function SellerDashboard() {
    const { user } = useAuth()
    const [loading, setLoading] = useState(true)
    const [orders, setOrders] = useState<Order[]>([])

    // Default to current week
    const [startDate, setStartDate] = useState(format(startOfWeek(new Date(), { weekStartsOn: 1 }), 'yyyy-MM-dd'))
    const [endDate, setEndDate] = useState(format(endOfWeek(new Date(), { weekStartsOn: 1 }), 'yyyy-MM-dd'))

    useEffect(() => {
        if (user) {
            fetchOrders()
        }
    }, [user, startDate, endDate])

    const fetchOrders = async () => {
        try {
            setLoading(true)

            // Ajustar la fecha final para incluir todo el día (23:59:59)
            const adjustedEndDate = new Date(endDate)
            adjustedEndDate.setHours(23, 59, 59, 999)

            const { data, error } = await supabase
                .from('orders')
                .select('*, contacts(name)')
                .eq('assigned_to', user?.id)
                .gte('created_at', new Date(startDate).toISOString())
                .lte('created_at', adjustedEndDate.toISOString())
                .order('created_at', { ascending: false })

            if (error) throw error

            setOrders(data || [])
        } catch (error) {
            console.error('Error fetching orders:', error)
        } finally {
            setLoading(false)
        }
    }

    // Filter for commissionable orders (paid/delivered)
    const commissionableOrders = orders.filter(
        order => ['paid', 'delivered', 'completed'].includes(order.status)
    )

    const totalSales = commissionableOrders.reduce((sum, order) => sum + (Number(order.total) || 0), 0)
    const commission = totalSales * 0.20

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="mb-8">
                <h1 className="text-2xl font-bold text-gray-900">Mi Panel de Ventas</h1>
                <p className="text-gray-600 mt-1">Revisa tus ventas y comisiones acumuladas</p>
            </div>

            {/* Date Filters */}
            <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 mb-8 flex flex-col sm:flex-row gap-4 items-end">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Fecha Inicio</label>
                    <div className="relative">
                        <input
                            type="date"
                            value={startDate}
                            onChange={(e) => setStartDate(e.target.value)}
                            className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-primary-500 focus:border-primary-500"
                        />
                        <Calendar className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
                    </div>
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Fecha Fin</label>
                    <div className="relative">
                        <input
                            type="date"
                            value={endDate}
                            onChange={(e) => setEndDate(e.target.value)}
                            className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-primary-500 focus:border-primary-500"
                        />
                        <Calendar className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
                    </div>
                </div>
                <button
                    onClick={fetchOrders}
                    className="btn-primary flex items-center gap-2 mb-0.5"
                >
                    <Search className="h-4 w-4" />
                    Filtrar
                </button>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-6 text-white shadow-lg">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-blue-100 font-medium mb-1">Ventas Totales</p>
                            <h3 className="text-3xl font-bold">${totalSales.toFixed(2)}</h3>
                        </div>
                        <div className="p-2 bg-white/20 rounded-lg">
                            <TrendingUp className="h-6 w-6 text-white" />
                        </div>
                    </div>
                    <p className="text-blue-100 text-sm mt-4">En el periodo seleccionado</p>
                </div>

                <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl p-6 text-white shadow-lg">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-green-100 font-medium mb-1">Comisión Ganada (20%)</p>
                            <h3 className="text-3xl font-bold">${commission.toFixed(2)}</h3>
                        </div>
                        <div className="p-2 bg-white/20 rounded-lg">
                            <DollarSign className="h-6 w-6 text-white" />
                        </div>
                    </div>
                    <p className="text-green-100 text-sm mt-4">Disponible para pago semanal</p>
                </div>
            </div>

            {/* Orders Table */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="p-6 border-b border-gray-200">
                    <h2 className="text-lg font-semibold text-gray-800">Historial de Ventas</h2>
                </div>
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fecha</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID Orden</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cliente</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Estado</th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Total</th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Comisión</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {loading ? (
                                <tr>
                                    <td colSpan={6} className="px-6 py-4 text-center text-gray-500">Cargando ventas...</td>
                                </tr>
                            ) : orders.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="px-6 py-4 text-center text-gray-500">No se encontraron ventas en este periodo</td>
                                </tr>
                            ) : (
                                orders.map((order) => (
                                    <tr key={order.id} className="hover:bg-gray-50 transition-colors">
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                            {format(new Date(order.created_at), 'dd/MM/yyyy HH:mm', { locale: es })}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-600">
                                            #{order.id.slice(0, 8)}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                            {order.contacts?.name || 'Cliente Casual'}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            {(() => {
                                                const statusConfig: Record<string, { label: string; className: string }> = {
                                                    pending: { label: 'Pendiente', className: 'bg-yellow-100 text-yellow-800' },
                                                    processing: { label: 'En Proceso', className: 'bg-orange-100 text-orange-800' },
                                                    shipped: { label: 'En Delivery', className: 'bg-blue-100 text-blue-800' },
                                                    delivered: { label: 'Entregada', className: 'bg-green-100 text-green-800' },
                                                    cancelled: { label: 'Cancelada', className: 'bg-red-100 text-red-800' },
                                                    paid: { label: 'Pagado', className: 'bg-emerald-100 text-emerald-800' },
                                                    completed: { label: 'Completado', className: 'bg-green-100 text-green-800' },
                                                }
                                                const config = statusConfig[order.status] || { label: order.status, className: 'bg-gray-100 text-gray-800' }

                                                return (
                                                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${config.className}`}>
                                                        {config.label}
                                                    </span>
                                                )
                                            })()}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right font-medium">
                                            ${Number(order.total).toFixed(2)}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-green-600 text-right font-medium">
                                            +${(Number(order.total) * 0.20).toFixed(2)}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    )
}
