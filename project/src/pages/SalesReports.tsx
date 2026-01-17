import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { Calendar, DollarSign, FileText, CheckCircle, Clock } from 'lucide-react'
import type { Order } from '../types'

interface DailyStats {
    date: string
    count: number
    total: number
    invoiced: number
    paid: number
}

interface ProductStats {
    id: string
    name: string
    quantity: number
    revenue: number
}

export default function SalesReports() {
    const [loading, setLoading] = useState(true)
    const [orders, setOrders] = useState<Order[]>([])
    const [topProducts, setTopProducts] = useState<ProductStats[]>([])
    const [startDate, setStartDate] = useState(() => {
        const date = new Date()
        date.setDate(1) // First day of current month
        return date.toISOString().split('T')[0]
    })
    const [endDate, setEndDate] = useState(() => {
        return new Date().toISOString().split('T')[0]
    })
    const [showPrintModal, setShowPrintModal] = useState(false)
    const [printDate, setPrintDate] = useState(() => new Date().toISOString().split('T')[0])
    const [printData, setPrintData] = useState<DailyStats | null>(null)
    const [isPrinting, setIsPrinting] = useState(false)

    useEffect(() => {
        fetchData()
    }, [startDate, endDate])

    useEffect(() => {
        if (printData && isPrinting) {
            // Small timeout to allow render
            setTimeout(() => {
                window.print()
                setIsPrinting(false)
                setPrintData(null) // Clear after print
            }, 500)
        }
    }, [printData, isPrinting])

    const fetchData = async () => {
        try {
            setLoading(true)

            // Fetch Orders
            const { data: ordersData, error: ordersError } = await supabase
                .from('orders')
                .select('*')
                .gte('created_at', `${startDate}T00:00:00`)
                .lte('created_at', `${endDate}T23:59:59`)
                .neq('status', 'cancelled')
                .order('created_at', { ascending: false })

            if (ordersError) throw ordersError
            setOrders(ordersData || [])

            // Fetch Order Items for Top Products
            // We need to fetch items for the orders in range. 
            // If the range is huge, this might be heavy, but for typical admin usage it's okay.
            if (ordersData && ordersData.length > 0) {
                const orderIds = ordersData.map(o => o.id)
                const { data: itemsData, error: itemsError } = await supabase
                    .from('order_items')
                    .select('*, product:products(name)')
                    .in('order_id', orderIds)

                if (itemsError) throw itemsError

                processTopProducts(itemsData || [])
            } else {
                setTopProducts([])
            }

        } catch (error) {
            console.error('Error fetching data:', error)
        } finally {
            setLoading(false)
        }
    }

    const processTopProducts = (items: any[]) => {
        const stats: Record<string, ProductStats> = {}

        items.forEach(item => {
            const productId = item.product_id
            if (!stats[productId]) {
                stats[productId] = {
                    id: productId,
                    name: item.product?.name || 'Unknown Product',
                    quantity: 0,
                    revenue: 0
                }
            }
            stats[productId].quantity += item.quantity
            stats[productId].revenue += item.quantity * item.price
        })

        const sorted = Object.values(stats).sort((a, b) => b.quantity - a.quantity).slice(0, 5)
        setTopProducts(sorted)
    }

    // Calculate Summary Stats
    const totalSales = orders.reduce((sum, order) => sum + order.total, 0)
    const totalInvoiced = orders.filter(o => o.order_type === 'invoice').reduce((sum, order) => sum + order.total, 0)
    const totalPaid = orders.filter(o => o.status === 'paid' || o.status === 'delivered').reduce((sum, order) => sum + order.total, 0)
    const totalPending = totalSales - totalPaid

    // Calculate Daily Stats
    const groupedByDay = orders.reduce((acc, order) => {
        const date = new Date(order.created_at).toLocaleDateString()
        if (!acc[date]) {
            acc[date] = { date, count: 0, total: 0, invoiced: 0, paid: 0 }
        }
        acc[date].count += 1
        acc[date].total += order.total
        if (order.order_type === 'invoice') acc[date].invoiced += order.total
        if (order.status === 'paid' || order.status === 'delivered') acc[date].paid += order.total
        return acc
    }, {} as Record<string, DailyStats>)

    // Sort dates descending
    const sortedDaily = Object.values(groupedByDay).sort((a, b) => {
        return new Date(b.date).getTime() - new Date(a.date).getTime()
    })

    const handlePrintClick = () => {
        setShowPrintModal(true)
    }

    const confirmPrint = async () => {
        setShowPrintModal(false)
        await fetchPrintData(printDate)
    }

    const fetchPrintData = async (date: string) => {
        setLoading(true)
        try {
            const startDate = `${date}T00:00:00`
            const endDate = `${date}T23:59:59`

            const { data: ordersData, error } = await supabase
                .from('orders')
                .select('*')
                .gte('created_at', startDate)
                .lte('created_at', endDate)
                .neq('status', 'cancelled')

            if (error) throw error

            const orders = ordersData || []

            // Calculate stats for this specific day
            const stats = orders.reduce((acc, order) => {
                acc.count += 1
                acc.total += order.total
                if (order.order_type === 'invoice') acc.invoiced += order.total
                if (order.status === 'paid' || order.status === 'delivered') acc.paid += order.total
                return acc
            }, { date, count: 0, total: 0, invoiced: 0, paid: 0 } as DailyStats)

            setPrintData(stats)
            setIsPrinting(true)

        } catch (error) {
            console.error('Error fetching print data:', error)
            alert('Error al generar el reporte')
        } finally {
            setLoading(false)
        }
    }

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('es-CO', {
            style: 'currency',
            currency: 'COP',
            minimumFractionDigits: 0
        }).format(amount)
    }

    return (
        <div className="space-y-6">
            {/* Print Styles */}
            <style>{`
                @media print {
                    body {
                        visibility: hidden;
                    }
                    #print-section {
                        visibility: visible;
                        display: block !important;
                        position: absolute;
                        left: 0;
                        top: 0;
                        width: 100%;
                        background: white;
                        z-index: 9999;
                    }
                    #print-section * {
                        visibility: visible;
                    }
                }
            `}</style>

            <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
                <h1 className="text-2xl font-bold text-gray-800">Reporte de Ventas</h1>

                <div className="flex items-center gap-4">
                    <button
                        onClick={handlePrintClick}
                        className="btn-primary flex items-center gap-2 px-4 py-2 text-sm"
                    >
                        <FileText className="h-4 w-4" />
                        Imprimir Cierre
                    </button>

                    <div className="flex items-center gap-2 bg-white p-2 rounded-lg shadow-sm border border-gray-200">
                        <Calendar className="h-5 w-5 text-gray-500" />
                        <input
                            type="date"
                            value={startDate}
                            onChange={(e) => setStartDate(e.target.value)}
                            className="border-none focus:ring-0 text-sm text-gray-600"
                        />
                        <span className="text-gray-400">-</span>
                        <input
                            type="date"
                            value={endDate}
                            onChange={(e) => setEndDate(e.target.value)}
                            className="border-none focus:ring-0 text-sm text-gray-600"
                        />
                    </div>
                </div>
            </div>

            {loading ? (
                <div className="text-center py-12">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
                    <p className="mt-4 text-gray-500">Cargando reporte...</p>
                </div>
            ) : (
                <>
                    {/* Summary Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-gray-500 text-sm font-medium">Ventas Totales</h3>
                                <div className="p-2 bg-blue-100 rounded-lg">
                                    <DollarSign className="h-5 w-5 text-blue-600" />
                                </div>
                            </div>
                            <p className="text-2xl font-bold text-gray-800">{formatCurrency(totalSales)}</p>
                            <p className="text-xs text-gray-500 mt-1">{orders.length} órdenes</p>
                        </div>

                        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-gray-500 text-sm font-medium">Facturado</h3>
                                <div className="p-2 bg-purple-100 rounded-lg">
                                    <FileText className="h-5 w-5 text-purple-600" />
                                </div>
                            </div>
                            <p className="text-2xl font-bold text-gray-800">{formatCurrency(totalInvoiced)}</p>
                            <p className="text-xs text-gray-500 mt-1">Órdenes tipo factura</p>
                        </div>

                        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-gray-500 text-sm font-medium">Pagado</h3>
                                <div className="p-2 bg-green-100 rounded-lg">
                                    <CheckCircle className="h-5 w-5 text-green-600" />
                                </div>
                            </div>
                            <p className="text-2xl font-bold text-gray-800">{formatCurrency(totalPaid)}</p>
                            <p className="text-xs text-gray-500 mt-1">Cobrado exitosamente</p>
                        </div>

                        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-gray-500 text-sm font-medium">Por Cobrar</h3>
                                <div className="p-2 bg-orange-100 rounded-lg">
                                    <Clock className="h-5 w-5 text-orange-600" />
                                </div>
                            </div>
                            <p className="text-2xl font-bold text-gray-800">{formatCurrency(totalPending)}</p>
                            <p className="text-xs text-gray-500 mt-1">Pendiente de pago</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* Daily Report Table */}
                        <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                            <div className="p-6 border-b border-gray-200">
                                <h3 className="font-semibold text-gray-800">Reporte Diario Detallado</h3>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="w-full text-left text-sm">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th className="px-6 py-3 font-medium text-gray-500">Fecha</th>
                                            <th className="px-6 py-3 font-medium text-gray-500">Órdenes</th>
                                            <th className="px-6 py-3 font-medium text-gray-500">Venta Total</th>
                                            <th className="px-6 py-3 font-medium text-gray-500">Facturado</th>
                                            <th className="px-6 py-3 font-medium text-gray-500">Pagado</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100">
                                        {sortedDaily.map((day, index) => (
                                            <tr key={index} className="hover:bg-gray-50">
                                                <td className="px-6 py-3 text-gray-900">{day.date}</td>
                                                <td className="px-6 py-3 text-gray-600">{day.count}</td>
                                                <td className="px-6 py-3 font-medium text-gray-900">{formatCurrency(day.total)}</td>
                                                <td className="px-6 py-3 text-gray-600">{formatCurrency(day.invoiced)}</td>
                                                <td className="px-6 py-3 text-green-600">{formatCurrency(day.paid)}</td>
                                            </tr>
                                        ))}
                                        {sortedDaily.length === 0 && (
                                            <tr>
                                                <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                                                    No hay datos para el periodo seleccionado
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        {/* Top Products */}
                        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden h-fit">
                            <div className="p-6 border-b border-gray-200">
                                <h3 className="font-semibold text-gray-800">Productos Más Vendidos</h3>
                            </div>
                            <div className="divide-y divide-gray-100">
                                {topProducts.map((product) => (
                                    <div key={product.id} className="p-4 hover:bg-gray-50 flex justify-between items-center">
                                        <div>
                                            <p className="font-medium text-gray-800 line-clamp-1">{product.name}</p>
                                            <p className="text-xs text-gray-500">{product.quantity} unidades vendidas</p>
                                        </div>
                                        <span className="font-medium text-primary-600 text-sm">
                                            {formatCurrency(product.revenue)}
                                        </span>
                                    </div>
                                ))}
                                {topProducts.length === 0 && (
                                    <div className="p-8 text-center text-gray-500 text-sm">
                                        No hay datos disponibles
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </>
            )}

            {/* Print Date Modal */}
            {showPrintModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-6 w-96 shadow-xl">
                        <h3 className="text-lg font-bold mb-4">Imprimir Cierre de Caja</h3>
                        <p className="text-gray-600 mb-4 text-sm">Seleccione la fecha del cierre a imprimir:</p>

                        <input
                            type="date"
                            value={printDate}
                            onChange={(e) => setPrintDate(e.target.value)}
                            className="w-full border p-2 rounded mb-6"
                        />

                        <div className="flex justify-end gap-3">
                            <button
                                onClick={() => setShowPrintModal(false)}
                                className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={confirmPrint}
                                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                            >
                                Imprimir Reporte
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Hidden Print Section */}
            {printData && (
                <div id="print-section" className="hidden">
                    <div className="p-8 max-w-2xl mx-auto">
                        <div className="text-center mb-8">
                            <h1 className="text-2xl font-bold uppercase tracking-wider">Cierre de Caja Diario</h1>
                            <p className="text-gray-600 mt-2">Fecha: {new Date(printData.date).toLocaleDateString('es-CO', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
                        </div>

                        <div className="border-t border-b border-gray-200 py-4 my-6">
                            <div className="flex justify-between items-center py-2">
                                <span className="font-medium text-gray-600">Total de Ventas:</span>
                                <span className="text-xl font-bold">{formatCurrency(printData.total)}</span>
                            </div>
                            <div className="flex justify-between items-center py-2">
                                <span className="text-gray-600">Facturado:</span>
                                <span className="font-medium">{formatCurrency(printData.invoiced)}</span>
                            </div>
                            <div className="flex justify-between items-center py-2">
                                <span className="text-gray-600">Total Recaudado (Pagado):</span>
                                <span className="font-medium text-green-600">{formatCurrency(printData.paid)}</span>
                            </div>
                            <div className="flex justify-between items-center py-2">
                                <span className="text-gray-600">Pendiente por Cobrar:</span>
                                <span className="font-medium text-red-600">{formatCurrency(printData.total - printData.paid)}</span>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4 text-center mt-8">
                            <div className="bg-gray-50 p-4 rounded">
                                <p className="text-sm text-gray-500">Cantidad de Órdenes</p>
                                <p className="text-xl font-bold">{printData.count}</p>
                            </div>
                            <div className="bg-gray-50 p-4 rounded">
                                <p className="text-sm text-gray-500">Ticket Promedio</p>
                                <p className="text-xl font-bold">{printData.count > 0 ? formatCurrency(printData.total / printData.count) : '$0'}</p>
                            </div>
                        </div>

                        <div className="mt-12 text-center text-xs text-gray-400">
                            <p>Reporte generado el {new Date().toLocaleString('es-CO')}</p>
                            <p>*** Fin del Reporte ***</p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
