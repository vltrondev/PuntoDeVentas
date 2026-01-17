-- 1. Add payment_method column
ALTER TABLE orders 
ADD COLUMN IF NOT EXISTS payment_method text CHECK (payment_method IN ('cash', 'transfer', 'card', 'other'));

-- 2. Update status check to ensure 'paid' is valid if not already
ALTER TABLE orders DROP CONSTRAINT IF EXISTS orders_status_check;
ALTER TABLE orders ADD CONSTRAINT orders_status_check CHECK (status IN ('pending', 'processing', 'shipped', 'delivered', 'paid', 'cancelled'));

-- 3. Update master function
DROP FUNCTION IF EXISTS public.create_order_from_cart(uuid, uuid, uuid, text);

CREATE OR REPLACE FUNCTION public.create_order_from_cart(
  p_user_id uuid, 
  p_contact_id uuid DEFAULT NULL,
  p_assigned_to uuid DEFAULT NULL,
  p_order_type text DEFAULT 'sale',
  p_payment_method text DEFAULT NULL,
  p_status text DEFAULT 'pending'
)
RETURNS uuid AS $$
DECLARE
  v_order_id uuid;
  v_cart_total decimal(10,2);
BEGIN
  IF NOT EXISTS (SELECT 1 FROM cart_items WHERE user_id = p_user_id) THEN
    RAISE EXCEPTION 'Cart is empty';
  END IF;

  SELECT COALESCE(SUM(p.price * c.quantity), 0)
  INTO v_cart_total
  FROM cart_items c
  JOIN products p ON p.id = c.product_id
  WHERE c.user_id = p_user_id;

  INSERT INTO orders (user_id, total, status, contact_id, assigned_to, order_type, payment_method)
  VALUES (p_user_id, v_cart_total, p_status, p_contact_id, p_assigned_to, p_order_type, p_payment_method)
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
