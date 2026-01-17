-- 1. Add order_type column
ALTER TABLE orders 
ADD COLUMN IF NOT EXISTS order_type text DEFAULT 'sale' CHECK (order_type IN ('sale', 'invoice'));

-- 2. Update function to support order_type
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
  IF NOT EXISTS (SELECT 1 FROM cart_items WHERE user_id = p_user_id) THEN
    RAISE EXCEPTION 'Cart is empty';
  END IF;

  SELECT COALESCE(SUM(p.price * c.quantity), 0)
  INTO v_cart_total
  FROM cart_items c
  JOIN products p ON p.id = c.product_id
  WHERE c.user_id = p_user_id;

  INSERT INTO orders (user_id, total, status, contact_id, assigned_to, order_type)
  VALUES (p_user_id, v_cart_total, 'pending', p_contact_id, p_assigned_to, p_order_type)
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
