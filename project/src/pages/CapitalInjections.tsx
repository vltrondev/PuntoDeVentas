import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { PlusCircle, Calendar, TrendingUp } from 'lucide-react'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'

interface CapitalInjection {
    id: string
    amount: number
    description: string
    created_at: string
    created_by: string
}

export default function CapitalInjections() {
    const [injections, setInjections] = useState<CapitalInjection[]>([])
    const [amount, setAmount] = useState('')
    const [description, setDescription] = useState('')
    const [loading, setLoading] = useState(true)
    const [submitting, setSubmitting] = useState(false)

    useEffect(() => {
        fetchInjections()
    }, [])

    const fetchInjections = async () => {
        try {
            setLoading(true)
            const { data, error } = await supabase
                .from('capital_injections')
                .select('*')
                .order('created_at', { ascending: false })

            if (error) throw error
            setInjections(data || [])
        } catch (error: any) {
            console.error('Error fetching injections:', error)
            alert('Error al cargar ingresos: ' + error.message)
        } finally {
            setLoading(false)
        }
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!amount) return

        try {
            setSubmitting(true)
            const { user } = (await supabase.auth.getUser()).data

            const { error } = await supabase
                .from('capital_injections')
                .insert({
                    amount: parseFloat(amount),
                    description: description,
                    created_by: user?.id
                })

            if (error) throw error

            setAmount('')
            setDescription('')
            fetchInjections()
            alert('Capital ingresado correctamente')
        } catch (error: any) {
            console.error('Error adding injection:', error)
            alert('Error al agregar capital: ' + error.message)
        } finally {
            setSubmitting(false)
        }
    }

    const totalCapital = injections.reduce((sum, item) => sum + Number(item.amount), 0)

    return (
        <div className="max-w-6xl mx-auto px-4 py-8">
            <h1 className="text-3xl font-bold text-gray-800 mb-8">Gestión de Capital</h1>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {/* Form Section */}
                <div className="md:col-span-1">
                    <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
                        <h2 className="text-xl font-semibold text-gray-800 mb-6 flex items-center gap-2">
                            <PlusCircle className="h-5 w-5 text-primary-600" />
                            Nuevo Ingreso
                        </h2>

                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Monto de Ingreso</label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <span className="text-gray-500 sm:text-sm">$</span>
                                    </div>
                                    <input
                                        type="number"
                                        step="0.01"
                                        required
                                        value={amount}
                                        onChange={(e) => setAmount(e.target.value)}
                                        className="pl-7 input-field w-full rounded-lg border-gray-300 focus:ring-primary-500 focus:border-primary-500"
                                        placeholder="0.00"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Descripción / Motivo</label>
                                <textarea
                                    rows={3}
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    className="input-field w-full rounded-lg border-gray-300 focus:ring-primary-500 focus:border-primary-500"
                                    placeholder="Ej: Inversión inicial, Aporte socios..."
                                />
                            </div>

                            <button
                                type="submit"
                                disabled={submitting}
                                className="w-full btn-primary flex justify-center items-center py-2.5"
                            >
                                {submitting ? 'Guardando...' : 'Registrar Ingreso'}
                            </button>
                        </form>
                    </div>

                    {/* Total Card */}
                    <div className="mt-6 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl p-6 text-white shadow-lg">
                        <div className="flex justify-between items-start">
                            <div>
                                <p className="text-green-100 font-medium mb-1">Capital Total Inyectado</p>
                                <h3 className="text-3xl font-bold">${totalCapital.toLocaleString('es-CO', { minimumFractionDigits: 2 })}</h3>
                            </div>
                            <div className="p-2 bg-white/20 rounded-lg">
                                <TrendingUp className="h-6 w-6 text-white" />
                            </div>
                        </div>
                        <p className="text-green-100 text-sm mt-4">Histórico acumulado</p>
                    </div>
                </div>

                {/* History List */}
                <div className="md:col-span-2">
                    <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
                        <div className="p-6 border-b border-gray-100 bg-gray-50">
                            <h2 className="text-lg font-semibold text-gray-800">Historial de Ingresos</h2>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-white">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fecha</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Descripción</th>
                                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Monto</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {loading ? (
                                        <tr><td colSpan={3} className="px-6 py-8 text-center text-gray-500">Cargando...</td></tr>
                                    ) : injections.length === 0 ? (
                                        <tr><td colSpan={3} className="px-6 py-8 text-center text-gray-500">No hay registros de capital aún.</td></tr>
                                    ) : (
                                        injections.map((item) => (
                                            <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                                                    <div className="flex items-center gap-2">
                                                        <Calendar className="h-4 w-4 text-gray-400" />
                                                        {format(new Date(item.created_at), "d MMM yyyy, HH:mm", { locale: es })}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 text-sm text-gray-900">
                                                    {item.description || <span className="text-gray-400 italic">Sin descripción</span>}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-green-600 text-right">
                                                    +${Number(item.amount).toLocaleString('es-CO', { minimumFractionDigits: 2 })}
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
