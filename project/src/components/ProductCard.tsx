import React from 'react'
import { Link } from 'react-router-dom'
import { ShoppingCart, Edit, Trash2 } from 'lucide-react'
import type { Product } from '../types'
import { useCart } from '../hooks/useCart'
import { useAuth } from '../hooks/useAuth'

interface ProductCardProps {
  product: Product
  onDelete?: (productId: string) => void;
}

export default function ProductCard({ product, onDelete }: ProductCardProps) {
  const { addToCart } = useCart()
  const { user, isAdmin } = useAuth()

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (user) {
      addToCart(product.id, 1, product)
    }
  }

  const handleDelete = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (onDelete) {
      onDelete(product.id);
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0
    }).format(price)
  }

  return (
    <div className="card overflow-hidden group">
      <div className="relative">
        <div className="relative overflow-hidden">
          <div className="cursor-pointer" onClick={() => user && addToCart(product.id, 1, product)}>
            <img
              src={product.image_url}
              alt={product.name}
              className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
            />
          </div>
          {isAdmin && (
            <div className="absolute top-2 right-2 flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
              <Link to={`/admin/productos/editar/${product.id}`} className="p-2 bg-white rounded-full shadow-lg hover:bg-blue-100 transition-colors"><Edit className="h-4 w-4 text-blue-600" /></Link>
              <button onClick={handleDelete} className="p-2 bg-white rounded-full shadow-lg hover:bg-red-100 transition-colors"><Trash2 className="h-4 w-4 text-red-600" /></button>
            </div>
          )}
          {product.featured && (
            <div className="absolute top-2 left-2 bg-accent-500 text-white px-2 py-1 text-xs font-semibold rounded">
              Destacado
            </div>
          )}
          {(product.stock ?? 0) <= 5 && (product.stock ?? 0) > 0 && (
            <div className="absolute top-2 right-2 bg-red-500 text-white px-2 py-1 text-xs font-semibold rounded">
              ¡Últimas {product.stock}!
            </div>
          )}
          {(product.stock ?? 0) === 0 && (
            <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
              <span className="text-white font-bold text-lg">Agotado</span>
            </div>
          )}
        </div>
      </div>
      <div className="p-4">
        <h3 className="font-semibold text-gray-800 mb-2 line-clamp-2 group-hover:text-primary-600 transition-colors">
          {product.name}
        </h3>
        <p className="text-gray-600 text-sm mb-3 line-clamp-2">{product.description}</p>

        <div className="flex items-center justify-between">
          <div>
            <span className="text-2xl font-bold text-primary-600">
              {formatPrice(product.price)}
            </span>
            <div className="text-xs text-gray-500 mt-1">
              Stock: {product.stock ?? 0} disponibles
            </div>
          </div>

          {user && (product.stock ?? 0) > 0 && (
            <button
              onClick={handleAddToCart}
              className="btn-primary p-2 flex items-center space-x-1 hover:scale-110 transition-transform"
              title="Agregar al carrito"
            >
              <ShoppingCart className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  )
}