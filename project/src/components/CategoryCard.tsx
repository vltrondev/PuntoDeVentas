
import { Link } from 'react-router-dom'
import type { Category } from '../types'

interface CategoryCardProps {
  category: Category
}

export default function CategoryCard({ category }: CategoryCardProps) {
  return (
    <Link to={`/productos?categoria=${category.id}`} className="block">
      <div className="card overflow-hidden group cursor-pointer h-full">
        <div className="relative overflow-hidden">
          <img
            src={category.image_url || 'https://images.pexels.com/photos/264547/pexels-photo-264547.jpeg'}
            alt={category.name}
            className="w-full h-32 object-cover group-hover:scale-105 transition-transform duration-300"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
          <div className="absolute bottom-4 left-4 right-4">
            <h3 className="text-white font-bold text-lg group-hover:text-accent-300 transition-colors">
              {category.name}
            </h3>
          </div>
        </div>

        <div className="p-4">
          <p className="text-gray-600 text-sm">{category.description}</p>
        </div>
      </div>
    </Link>
  )
}