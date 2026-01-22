import { useState } from 'react'
import Products from './Products'
import CurrentSale from '../components/CurrentSale'
import { useAuth } from '../hooks/useAuth'
import { Link } from 'react-router-dom'
import { useCart } from '../hooks/useCart'
import { ShoppingCart } from 'lucide-react'

export default function POS() {
  const { user, loading } = useAuth()
  const { cartCount, cartTotal } = useCart()
  const [isCartOpen, setIsCartOpen] = useState(false)

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0
    }).format(price)
  }

  if (loading) {
    return <div className="h-[calc(100vh-4rem)] flex items-center justify-center">Cargando...</div>
  }

  if (!user) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center">
        <h1 className="text-2xl mb-4">Por favor, inicia sesión para usar GRUPO NC.</h1>
        <Link to="/login" className="btn-primary">
          Iniciar Sesión
        </Link>
      </div>
    )
  }

  return (
    <div className="relative h-[calc(100vh-4rem)] bg-gray-100 overflow-hidden">
      {/* Product Grid (Full Width) */}
      <div className="h-full overflow-y-auto p-4">
        <Products isPOS={true} />
      </div>

      {/* Floating Cart Button (Top Right by convention, or Left if requested specifically? User said Top Left) */}
      {/* Re-reading user request: "via un icono en la parte superior izquierda" -> Top Left */}
      <button
        onClick={() => setIsCartOpen(true)}
        className="fixed top-20 left-4 z-40 bg-primary-600 text-white p-3 rounded-full shadow-lg hover:bg-primary-700 transition-all flex items-center gap-2 group"
      >
        <div className="relative">
          <ShoppingCart className="h-6 w-6" />
          {cartCount > 0 && (
            <span className="absolute -top-2 -right-2 bg-red-500 text-white ml-2 text-xs font-bold w-5 h-5 flex items-center justify-center rounded-full border-2 border-white">
              {cartCount}
            </span>
          )}
        </div>
        <span className="hidden group-hover:block font-medium whitespace-nowrap transition-all duration-300">
          {formatPrice(cartTotal)}
        </span>
      </button>

      {/* Cart Drawer / Overlay */}
      {isCartOpen && (
        <div className="fixed inset-0 z-50 flex justify-end">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black bg-opacity-50 transition-opacity"
            onClick={() => setIsCartOpen(false)}
          ></div>

          {/* Drawer Content */}
          <div className="relative w-full max-w-md bg-white shadow-2xl h-full transform transition-transform duration-300 ease-in-out">
            <CurrentSale onClose={() => setIsCartOpen(false)} />
          </div>
        </div>
      )}
    </div>
  )
}