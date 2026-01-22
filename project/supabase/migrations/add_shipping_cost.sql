-- 1. Add shipping_cost column
ALTER TABLE orders 
ADD COLUMN IF NOT EXISTS shipping_cost decimal(10,2) DEFAULT 0;

-- 2. Update master function to include shipping_cost
DROP FUNCTION IF EXISTS public.create_order_from_cart(uuid, uuid, uuid, text, text, text);

CREATE OR REPLACE FUNCTION public.create_order_from_cart(
  p_user_id uuid, 
  p_contact_id uuid DEFAULT NULL,
  p_assigned_to uuid DEFAULT NULL,
  p_order_type text DEFAULT 'sale',
  p_payment_method text DEFAULT NULL,
  p_status text DEFAULT 'pending',
  p_shipping_cost decimal DEFAULT 0
)
RETURNS uuid AS $$
DECLARE
  v_order_id uuid;
  v_cart_total decimal(10,2);
  v_final_total decimal(10,2);
BEGIN
  IF NOT EXISTS (SELECT 1 FROM cart_items WHERE user_id = p_user_id) THEN
    RAISE EXCEPTION 'Cart is empty';
  END IF;

  SELECT COALESCE(SUM(p.price * c.quantity), 0)
  INTO v_cart_total
  FROM cart_items c
  JOIN products p ON p.id = c.product_id
  WHERE c.user_id = p_user_id;

  -- Add shipping cost to total
  v_final_total := v_cart_total + COALESCE(p_shipping_cost, 0);

  INSERT INTO orders (user_id, total, status, contact_id, assigned_to, order_type, payment_method, shipping_cost)
  VALUES (p_user_id, v_final_total, p_status, p_contact_id, p_assigned_to, p_order_type, p_payment_method, COALESCE(p_shipping_cost, 0))
  RETURNING id INTO v_order_id;

  INSERT INTO order_items (order_id, product_id, quantity, price)
  SELECT v_order_id, c.product_id, c.quantity, p.price
  FROM cart_items c
  JOIN products p ON p.id = c.product_id
  WHERE c.user_id = p_user_id;

  UPDATE products p
  SET stock = p.stock - c.quantity
  FROM cart_items c
  WHERE p.id = c.product_id AND c.user_id = p_user_id;

  DELETE FROM cart_items WHERE user_id = p_user_id;

  RETURN v_order_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
