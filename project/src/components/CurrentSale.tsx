import { useState, useEffect } from 'react'
import { useCart } from '../hooks/useCart'
import { useAuth } from '../hooks/useAuth'
import { ShoppingCart, Trash2, Plus, Minus, CheckCircle, FileText, X } from 'lucide-react'
import { supabase } from '../lib/supabase'
import type { Contact } from '../types'

interface CurrentSaleProps {
  onClose?: () => void;
}

export default function CurrentSale({ onClose }: CurrentSaleProps) {
  const { user, isAdmin, loading: authLoading } = useAuth()
  const { cartItems, cartTotal, cartCount, updateQuantity, removeFromCart, finalizeSale, loading } = useCart()
  const [saleCompletedId, setSaleCompletedId] = useState<string | null>(null)

  // Contacts state
  const [contacts, setContacts] = useState<Contact[]>([])
  const [selectedContactId, setSelectedContactId] = useState<string>('')

  // Users state (for assignment)
  const [users, setUsers] = useState<any[]>([])
  const [selectedUserId, setSelectedUserId] = useState<string>('')

  // Payment Method state
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'transfer'>('cash')

  // Shipping State
  const [shippingOption, setShippingOption] = useState<'none' | 'santo_domingo' | 'interior'>('none')

  const shippingCost = shippingOption === 'santo_domingo' ? 250 : shippingOption === 'interior' ? 290 : 0
  const finalTotal = cartTotal + shippingCost

  // Load data
  useEffect(() => {
    async function loadData() {
      const { data: contactsData } = await supabase.from('contacts').select('*').order('name')
      if (contactsData) setContacts(contactsData)

      const { data: usersData } = await supabase.from('profiles').select('id, email, role')
      if (usersData) setUsers(usersData)
    }
    loadData()
  }, [])

  // Auto-select current user if not admin
  useEffect(() => {
    if (!authLoading && user && !isAdmin && !selectedUserId) {
      setSelectedUserId(user.id)
    }
  }, [user, isAdmin, authLoading, selectedUserId])

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0
    }).format(price)
  }

  const handleFinalizeSale = async () => {
    // Standard sale (Cobrar) -> Mark as PAID immediately
    const { data, error } = await finalizeSale(
      selectedContactId || undefined,
      selectedUserId || undefined,
      'sale',
      paymentMethod,
      'paid', // Cobrar = Pagado
      shippingCost
    )

    if (error) {
      alert(`Error: ${error.message}`)
    } else {
      setSaleCompletedId(data)
      setTimeout(() => {
        setSaleCompletedId(null)
        if (onClose) onClose() // Close modal if needed
      }, 3000)
    }
  }

  const handleGenerateInvoice = async () => {
    // Invoice (Facturar) -> Mark as PENDING (Account Receivable)
    if (!selectedContactId) {
      alert('Por favor selecciona un contacto para la factura.')
      return
    }
    const { data, error } = await finalizeSale(
      selectedContactId,
      selectedUserId || undefined,
      'invoice',
      paymentMethod, // Pass selected payment method instead of null
      'pending',
      shippingCost
    )

    if (error) {
      alert(`Error al generar factura: ${error.message}`)
    } else {
      setSaleCompletedId(data)
      alert(`Factura generada para el cliente! ID: ${data}`)
      setTimeout(() => {
        setSaleCompletedId(null)
        if (onClose) onClose()
      }, 3000)
    }
  }

  if (saleCompletedId) {
    return (
      <div className="bg-white rounded-lg shadow-lg p-6 flex flex-col items-center justify-center text-center h-full relative">
        {onClose && (
          <button onClick={onClose} className="absolute top-4 right-4 text-gray-500 hover:text-gray-700">
            <X className="h-6 w-6" />
          </button>
        )}
        <CheckCircle className="h-16 w-16 text-green-500 mb-4" />
        <h2 className="text-xl font-bold text-gray-800">¡Acción Completada!</h2>
        <p className="text-gray-600 mt-2">Orden #{saleCompletedId.substring(0, 8)} registrada.</p>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg shadow-lg p-6 flex flex-col h-full relative">
      {onClose && (
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600">
          <X className="h-6 w-6" />
        </button>
      )}

      <h2 className="text-2xl font-bold text-gray-800 mb-4 border-b pb-4 flex items-center justify-between">
        Venta Actual
        <span className="text-sm font-normal text-gray-500 bg-gray-100 px-2 py-1 rounded">
          {cartCount} items
        </span>
      </h2>

      {cartItems.length === 0 ? (
        <div className="flex-grow flex flex-col items-center justify-center text-center text-gray-500 min-h-[200px]">
          <ShoppingCart className="h-12 w-12 mb-4" />
          <p>Selecciona productos para agregarlos a la venta.</p>
        </div>
      ) : (
        <div className="flex-grow overflow-y-auto -mr-6 pr-6 min-h-[200px]">
          {cartItems.map(item => (
            <div key={item.id} className="flex items-center space-x-4 py-3 border-bLast-child:border-b-0">
              <img src={item.product?.image_url} alt={item.product?.name} className="w-12 h-12 rounded object-cover" />
              <div className="flex-grow">
                <p className="font-semibold text-sm">{item.product?.name}</p>
                <p className="text-xs text-gray-500">{formatPrice(item.product?.price || 0)}</p>
              </div>
              <div className="flex items-center space-x-2">
                <button onClick={() => updateQuantity(item.id, item.quantity - 1)} className="p-1 rounded-full hover:bg-gray-100"><Minus className="h-4 w-4" /></button>
                <span className="font-bold w-4 text-center">{item.quantity}</span>
                <button onClick={() => updateQuantity(item.id, item.quantity + 1)} className="p-1 rounded-full hover:bg-gray-100"><Plus className="h-4 w-4" /></button>
              </div>
              <button onClick={() => removeFromCart(item.id)} className="text-red-500 hover:text-red-700"><Trash2 className="h-4 w-4" /></button>
            </div>
          ))}
        </div>
      )}

      <div className="border-t pt-4 mt-2">


        {/* Controls Grid */}
        <div className="space-y-3 mb-4">
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Cliente</label>
              <select
                className="input-field text-sm py-1"
                value={selectedContactId}
                onChange={(e) => setSelectedContactId(e.target.value)}
              >
                <option value="">-- General --</option>
                {contacts.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Asignar a <span className="text-red-500">*</span></label>
              <select
                className="input-field text-sm py-1 disabled:bg-gray-100 disabled:text-gray-500"
                value={selectedUserId}
                onChange={(e) => setSelectedUserId(e.target.value)}
                disabled={!isAdmin}
              >
                <option value="">-- Seleccionar Vendedor --</option>
                {users.map(u => (
                  <option key={u.id} value={u.id}>{u.email}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Shipping Selection */}
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Costo de Envío</label>
            <select
              className="input-field text-sm py-1"
              value={shippingOption}
              onChange={(e) => setShippingOption(e.target.value as 'none' | 'santo_domingo' | 'interior')}
            >
              <option value="none">Sin envío (RD $0)</option>
              <option value="santo_domingo">Santo Domingo (RD $250)</option>
              <option value="interior">Interior (RD $290)</option>
            </select>
          </div>

          {/* Payment Method */}
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Método de Pago</label>
            <div className="flex gap-4">
              <label className="flex items-center cursor-pointer">
                <input
                  type="radio"
                  value="cash"
                  checked={paymentMethod === 'cash'}
                  onChange={() => setPaymentMethod('cash')}
                  className="mr-2"
                />
                Efectivo
              </label>
              <label className="flex items-center cursor-pointer">
                <input
                  type="radio"
                  value="transfer"
                  checked={paymentMethod === 'transfer'}
                  onChange={() => setPaymentMethod('transfer')}
                  className="mr-2"
                />
                Transferencia
              </label>
            </div>
          </div>
        </div>

        <div className="flex justify-between items-center mb-2 text-sm text-gray-500">
          <span>Subtotal:</span>
          <span>{formatPrice(cartTotal)}</span>
        </div>
        {shippingCost > 0 && (
          <div className="flex justify-between items-center mb-2 text-sm text-gray-500">
            <span>Envío:</span>
            <span>{formatPrice(shippingCost)}</span>
          </div>
        )}
        <div className="flex justify-between items-center mb-4 border-t pt-2">
          <span className="text-lg font-medium text-gray-600">Total</span>
          <span className="text-2xl font-bold text-primary-600">{formatPrice(finalTotal)}</span>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={handleFinalizeSale}
            disabled={cartItems.length === 0 || loading || !selectedUserId}
            className="btn-primary text-lg py-3 flex flex-col items-center justify-center bg-gray-800 hover:bg-gray-900 disabled:opacity-50 disabled:cursor-not-allowed"
            title={!selectedUserId ? "Selecciona un vendedor" : ""}
          >
            <span>Cobrar</span>
            <span className="text-xs font-normal opacity-80">(Pagado)</span>
          </button>

          <button
            onClick={handleGenerateInvoice}
            disabled={cartItems.length === 0 || loading || !selectedUserId}
            className="btn-primary text-lg py-3 flex flex-col items-center justify-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed"
            title={!selectedUserId ? "Selecciona un vendedor" : ""}
          >
            <div className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              <span>Facturar</span>
            </div>
            <span className="text-xs font-normal opacity-80">(Pendiente)</span>
          </button>
        </div>
      </div>
    </div>
  )
}