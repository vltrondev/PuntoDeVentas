-- 1. Add contact_id to orders table
ALTER TABLE orders 
ADD COLUMN IF NOT EXISTS contact_id uuid REFERENCES contacts(id);

-- 2. Update the function to accept contact_id
CREATE OR REPLACE FUNCTION public.create_order_from_cart(p_user_id uuid, p_contact_id uuid DEFAULT NULL)
RETURNS uuid AS $$
DECLARE
  v_order_id uuid;
  v_cart_total decimal(10,2);
BEGIN
  -- Check if cart is empty
  IF NOT EXISTS (SELECT 1 FROM cart_items WHERE user_id = p_user_id) THEN
    RAISE EXCEPTION 'Cart is empty';
  END IF;

  -- Calculate total
  SELECT COALESCE(SUM(p.price * c.quantity), 0)
  INTO v_cart_total
  FROM cart_items c
  JOIN products p ON p.id = c.product_id
  WHERE c.user_id = p_user_id;

  -- Create order
  INSERT INTO orders (user_id, total, status, contact_id)
  VALUES (p_user_id, v_cart_total, 'pending', p_contact_id)
  RETURNING id INTO v_order_id;

  -- Move items from cart to order_items
  INSERT INTO order_items (order_id, product_id, quantity, price)
  SELECT v_order_id, c.product_id, c.quantity, p.price
  FROM cart_items c
  JOIN products p ON p.id = c.product_id
  WHERE c.user_id = p_user_id;

  -- Update stock
  UPDATE products p
  SET stock = p.stock - c.quantity
  FROM cart_items c
  WHERE p.id = c.product_id AND c.user_id = p_user_id;

  -- Clear cart
  DELETE FROM cart_items WHERE user_id = p_user_id;

  RETURN v_order_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
