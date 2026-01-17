-- ¡IMPORTANTE! Eliminamos TODAS las versiones anteriores de la función para evitar conflictos (el error que tienes)
DROP FUNCTION IF EXISTS public.create_order_from_cart(uuid);
DROP FUNCTION IF EXISTS public.create_order_from_cart(uuid, uuid);
DROP FUNCTION IF EXISTS public.create_order_from_cart(uuid, uuid, uuid);
DROP FUNCTION IF EXISTS public.create_order_from_cart(uuid, uuid, uuid, text);

-- Crear la versión DEFINITIVA y ÚNICA
CREATE OR REPLACE FUNCTION public.create_order_from_cart(
  p_user_id uuid, 
  p_contact_id uuid DEFAULT NULL,
  p_assigned_to uuid DEFAULT NULL,
  p_order_type text DEFAULT 'sale'
)
RETURNS uuid AS $$
DECLARE
  v_order_id uuid;
  v_cart_total decimal(10,2);
BEGIN
  -- 1. Verificar carrito vacío
  IF NOT EXISTS (SELECT 1 FROM cart_items WHERE user_id = p_user_id) THEN
    RAISE EXCEPTION 'Cart is empty';
  END IF;

  -- 2. Calcular total
  SELECT COALESCE(SUM(p.price * c.quantity), 0)
  INTO v_cart_total
  FROM cart_items c
  JOIN products p ON p.id = c.product_id
  WHERE c.user_id = p_user_id;

  -- 3. Crear orden
  INSERT INTO orders (user_id, total, status, contact_id, assigned_to, order_type)
  VALUES (p_user_id, v_cart_total, 'pending', p_contact_id, p_assigned_to, p_order_type)
  RETURNING id INTO v_order_id;

  -- 4. Mover items de cart_items a order_items
  INSERT INTO order_items (order_id, product_id, quantity, price)
  SELECT v_order_id, c.product_id, c.quantity, p.price
  FROM cart_items c
  JOIN products p ON p.id = c.product_id
  WHERE c.user_id = p_user_id;

  -- 5. Actualizar stock
  UPDATE products p
  SET stock = p.stock - c.quantity
  FROM cart_items c
  WHERE p.id = c.product_id AND c.user_id = p_user_id;

  -- 6. Limpiar carrito
  DELETE FROM cart_items WHERE user_id = p_user_id;

  RETURN v_order_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
