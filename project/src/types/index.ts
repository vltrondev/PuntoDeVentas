export interface Product {
  id: string
  name: string
  description?: string
  price: number
  cost?: number
  image_url?: string
  category_id?: string
  stock?: number
  created_at: string
  featured?: boolean
}

export interface Category {
  id: string
  name: string
  description?: string
  image_url?: string
  created_at: string
}

export interface CartItem {
  id: string
  user_id: string
  product_id: string
  quantity: number
  created_at: string
  product?: Product
}

export interface Order {
  id: string
  user_id: string
  total: number
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'paid' | 'cancelled' | 'suspended' | 'assigned'
  created_at: string
  order_type?: 'sale' | 'invoice'
  payment_method?: 'cash' | 'transfer' | 'card' | 'other'
  shipping_cost?: number
  assigned_to?: string
  courier_id?: string
}

export interface Contact {
  id: string
  name: string
  email?: string
  phone?: string
  address?: string
  created_at?: string
  user_id?: string
}