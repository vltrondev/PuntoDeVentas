import { useState, useEffect } from 'react'
import type { CartItem, Product } from '../types'
import { supabase } from '../lib/supabase'
import { useAuth } from './useAuth'

export function useCart() {
  const [cartItems, setCartItems] = useState<CartItem[]>([])
  const [loading, setLoading] = useState(false)
  const { user } = useAuth()

  useEffect(() => {
    if (user) {
      fetchCartItems()
    } else {
      setCartItems([])
    }
  }, [user])

  const fetchCartItems = async () => {
    if (!user) return

    setLoading(true)
    const { data, error } = await supabase
      .from('cart_items')
      .select(`
        *,
        product:products(*)
      `)
      .eq('user_id', user.id)

    if (!error && data) {
      setCartItems(data as CartItem[])
    }
    setLoading(false)
  }

  const addToCart = async (productId: string, quantity: number = 1, product?: Product) => {
    if (!user) return

    // Optimistic UI Update
    const existingItemIndex = cartItems.findIndex(item => item.product_id === productId)
    const previousCartItems = [...cartItems] // Backup for rollback

    if (existingItemIndex > -1) {
      // Check stock limit for existing item
      const existingItem = cartItems[existingItemIndex]
      const currentStock = existingItem.product?.stock ?? 0
      const newQuantity = existingItem.quantity + quantity

      if (newQuantity > currentStock) {
        // Optionally notify user here or just return. 
        // Since we can't return error easily, we just prevent addition.
        console.warn('Cannot add more items than available stock')
        return
      }

      // Optimistically update existing item
      const newCartItems = [...cartItems]
      newCartItems[existingItemIndex] = {
        ...newCartItems[existingItemIndex],
        quantity: newQuantity
      }
      setCartItems(newCartItems)

      // Background DB update
      const { error } = await supabase
        .from('cart_items')
        .update({ quantity: newQuantity })
        .eq('id', existingItem.id)

      if (error) {
        // Rollback on error
        setCartItems(previousCartItems)
      }
    } else {
      // Check stock limit for new item
      if (product && quantity > (product.stock ?? 0)) {
        console.warn('Cannot add more items than available stock')
        return
      }

      // Optimistically add new item (ONLY if product is provided for display)
      if (product) {
        const optimisticItem: CartItem = {
          id: 'temp-' + Date.now(), // Temporary ID
          user_id: user.id,
          product_id: productId,
          quantity: quantity,
          created_at: new Date().toISOString(),
          product: product
        }
        setCartItems([...cartItems, optimisticItem])
      }

      // Background DB Insert
      const { data: newItem, error } = await supabase
        .from('cart_items')
        .insert({
          user_id: user.id,
          product_id: productId,
          quantity
        })
        .select('*, product:products(*)')
        .single()

      if (!error && newItem) {
        // Replace temp item with real item or add if not optimistic
        if (product) {
          setCartItems(current => current.map(item => item.id.startsWith('temp-') && item.product_id === productId ? (newItem as CartItem) : item))
        } else {
          setCartItems(current => [...current, newItem as CartItem])
        }
      } else if (error) {
        // Rollback
        setCartItems(previousCartItems)
      }
    }
  }

  const updateQuantity = async (itemId: string, quantity: number) => {
    if (quantity <= 0) {
      await removeFromCart(itemId)
      return
    }

    // Find item to check stock
    const item = cartItems.find(i => i.id === itemId)
    if (item && item.product && quantity > (item.product.stock ?? 0)) {
      // Prevent update if exceeds stock
      return
    }

    const { error } = await supabase
      .from('cart_items')
      .update({ quantity })
      .eq('id', itemId)

    if (!error) {
      setCartItems(cartItems.map(item => item.id === itemId ? { ...item, quantity } : item))
    }
  }

  const removeFromCart = async (itemId: string) => {
    const { error } = await supabase
      .from('cart_items')
      .delete()
      .eq('id', itemId)

    if (!error) {
      setCartItems(cartItems.filter(item => item.id !== itemId))
    }
  }

  const clearCart = async () => {
    if (!user) return

    const { error } = await supabase
      .from('cart_items')
      .delete()
      .eq('user_id', user.id)

    if (!error) {
      setCartItems([])
    }
  }

  const finalizeSale = async (
    contactId?: string,
    assignedTo?: string,
    orderType: 'sale' | 'invoice' = 'sale',
    paymentMethod: 'cash' | 'transfer' | 'card' | 'other' | null = null,
    status: 'pending' | 'paid' = 'pending',
    shippingCost: number = 0
  ) => {
    if (!user) return { error: new Error("User not authenticated") };
    if (cartItems.length === 0) return { error: new Error("Cart is empty") };

    // Strict Stock Check before calling backend
    const insufficientStockItems = cartItems.filter(item =>
      item.product && (item.product.stock ?? 0) < item.quantity
    );

    if (insufficientStockItems.length > 0) {
      const itemNames = insufficientStockItems.map(i => i.product?.name).join(', ');
      return { error: new Error(`Stock insuficiente para: ${itemNames}`) };
    }

    setLoading(true);
    const { data, error } = await supabase.rpc('create_order_from_cart', {
      p_user_id: user.id,
      p_contact_id: contactId || null,
      p_assigned_to: assignedTo || null,
      p_order_type: orderType,
      p_payment_method: paymentMethod,
      p_status: status,
      p_shipping_cost: shippingCost
    });
    setLoading(false);

    if (error) {
      return { error };
    }
    return { data };
  }

  const cartTotal = cartItems.reduce((total, item) => {
    return total + (item.product?.price || 0) * item.quantity
  }, 0)

  const cartCount = cartItems.reduce((count, item) => count + item.quantity, 0)

  return {
    cartItems,
    loading,
    addToCart,
    updateQuantity,
    removeFromCart,
    clearCart,
    cartTotal,
    cartCount,
    finalizeSale
  }
}