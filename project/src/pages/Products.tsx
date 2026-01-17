import React, { useState, useEffect } from 'react'
import { useSearchParams, Link } from 'react-router-dom'
import { Search, Filter, SortAsc, PlusCircle } from 'lucide-react'
import { supabase } from '../lib/supabase'
import type { Product, Category } from '../types'
import ProductCard from '../components/ProductCard'
import { useAuth } from '../hooks/useAuth'
import { useDebounce } from '../hooks/useDebounce'

interface ProductsProps {
  isPOS?: boolean;
}

export default function Products({ isPOS = false }: ProductsProps) {
  const { isAdmin } = useAuth()
  const [searchParams] = useSearchParams()
  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const debouncedSearchTerm = useDebounce(searchTerm, 500)
  const [selectedCategory, setSelectedCategory] = useState<string>(searchParams.get('categoria') || '')
  const [priceRange, setPriceRange] = useState<{ min: number; max: number }>({ min: 0, max: 2000 })
  const [sortBy, setSortBy] = useState('name_asc')

  useEffect(() => {
    // Fetch categories once on component mount
    const fetchCategories = async () => {
      const { data: categoriesData } = await supabase
        .from('categories')
        .select('*')
        .order('name')
      if (categoriesData) setCategories(categoriesData)
    }
    fetchCategories()
  }, []);

  useEffect(() => {
    // Fetch products whenever filters change
    const fetchProducts = async () => {
      setLoading(true)

      let query = supabase.from('products').select('*')

      // Search filter (using ilike for case-insensitive partial match)
      if (debouncedSearchTerm) {
        query = query.ilike('name', `%${debouncedSearchTerm}%`)
      }

      // Category filter
      if (selectedCategory) {
        query = query.eq('category_id', selectedCategory)
      }

      // Price range filter
      query = query.gte('price', priceRange.min)
      query = query.lte('price', priceRange.max)

      // Sorting
      const lastUnderscoreIndex = sortBy.lastIndexOf('_');
      const sortField = lastUnderscoreIndex !== -1 ? sortBy.substring(0, lastUnderscoreIndex) : sortBy;
      const sortOrder = lastUnderscoreIndex !== -1 ? sortBy.substring(lastUnderscoreIndex + 1) : 'asc';
      query = query.order(sortField, { ascending: sortOrder !== 'desc' })

      const { data: productsData, error } = await query
      if (error) console.error("Error fetching products:", error)
      if (productsData) setProducts(productsData)
      setLoading(false)
    }
    fetchProducts()
    fetchProducts()
  }, [debouncedSearchTerm, selectedCategory, priceRange, sortBy])

  const clearFilters = () => {
    setSearchTerm('')
    setSelectedCategory('')
    setPriceRange({ min: 0, max: 2000 })
    setSortBy('name_asc')
  }

  const handleDeleteProduct = async (productId: string) => {
    if (!window.confirm('¿Estás seguro de que quieres eliminar este producto?')) {
      return;
    }
    const { error } = await supabase.from('products').delete().eq('id', productId);
    if (error) {
      alert(`Error eliminando producto: ${error.message}`);
    } else {
      setProducts(prev => prev.filter(p => p.id !== productId));
    }
  };

  return (
    <MainWrapper isPOS={isPOS}>
      {/* Header */}
      {!isPOS && (
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-800 mb-4">
            Gestión de Productos
          </h1>
          <p className="text-lg text-gray-600">
            Añade, edita o elimina productos del inventario.
          </p>
        </div>
      )}

      {/* Filters Section */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Search */}
          <div className="relative">
            <input
              type="text"
              placeholder="Buscar productos..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input-field pl-10"
            />
            <Search className="absolute left-3 top-3.5 h-5 w-5 text-gray-400" />
          </div>

          {/* Category Filter */}
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="input-field"
          >
            <option value="">Todas las categorías</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>

          {/* Price Range */}
          <div className="flex items-center space-x-2">
            <input
              type="number"
              placeholder="Precio mín"
              value={priceRange.min}
              onChange={(e) => setPriceRange(prev => ({ ...prev, min: Number(e.target.value) }))}
              className="input-field w-1/2"
            />
            <span className="text-gray-500">-</span>
            <input
              type="number"
              placeholder="Precio máx"
              value={priceRange.max}
              onChange={(e) => setPriceRange(prev => ({ ...prev, max: Number(e.target.value) }))}
              className="input-field w-1/2"
            />
          </div>

          {/* Sort */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="input-field"
          >
            <option value="name_asc">Ordenar por nombre</option>
            <option value="price_asc">Precio: Menor a Mayor</option>
            <option value="price_desc">Precio: Mayor a Menor</option>
            <option value="created_at_desc">Más recientes</option>
          </select>
        </div>

        <div className="flex justify-between items-center mt-4 col-span-1 md:col-span-2 lg:col-span-4">
          {isAdmin && (
            <Link to="/admin/productos/nuevo" className="btn-secondary text-sm py-1 px-3">
              <PlusCircle className="h-4 w-4 mr-2" />
              Añadir Producto
            </Link>
          )}
          <p className="text-sm text-gray-600">
            {products.length} productos encontrados
          </p>
          <button
            onClick={clearFilters}
            className="text-sm text-primary-600 hover:text-primary-700 font-medium"
          >
            Limpiar filtros
          </button>
        </div>
      </div>

      {/* Products Grid */}
      {loading ? (
        <div className="flex items-center justify-center p-16">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary-500"></div>
        </div>
      )
        :
        products.length === 0 ? (
          <div className="text-center py-16">
            <div className="text-6xl mb-4">🔍</div>
            <h3 className="text-xl font-semibold text-gray-700 mb-2">
              No se encontraron productos
            </h3>
            <p className="text-gray-500">
              Intenta ajustar los filtros o buscar con otros términos
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {products.map((product, index) => (
              <div key={product.id} className="animate-slide-up" style={{ animationDelay: `${index * 0.05}s` }}>
                <ProductCard product={product} onDelete={!isPOS && isAdmin ? handleDeleteProduct : undefined} />
              </div>
            ))}
          </div>
        )}
    </MainWrapper>
  )
}

const MainWrapper: React.FC<{ children: React.ReactNode; isPOS: boolean }> = ({ children, isPOS }) =>
  isPOS ? <>{children}</> : <div className="min-h-screen bg-gray-50 py-8"><div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">{children}</div></div>;