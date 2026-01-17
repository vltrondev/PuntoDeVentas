-- 1. Add assigned_to column to orders
ALTER TABLE orders 
ADD COLUMN IF NOT EXISTS assigned_to uuid REFERENCES auth.users(id);

-- 2. Allow ALL authenticated users to view profiles (so they can select who to assign)
-- First, drop the old restrictive policy
DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;
DROP POLICY IF EXISTS "Authenticated users can view profiles" ON profiles;

-- Create a new policy: "Authenticated users can view basic profile info"
-- Note: We trust authenticated users to see the list of other users (emails) in the system
CREATE POLICY "Authenticated users can view profiles"
  ON profiles FOR SELECT
  TO authenticated
  USING (true);

-- 3. Update the function AGAIN to accept p_assigned_to
CREATE OR REPLACE FUNCTION public.create_order_from_cart(
  p_user_id uuid, 
  p_contact_id uuid DEFAULT NULL,
  p_assigned_to uuid DEFAULT NULL
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

  -- Insert with assigned_to
  INSERT INTO orders (user_id, total, status, contact_id, assigned_to)
  VALUES (p_user_id, v_cart_total, 'pending', p_contact_id, p_assigned_to)
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
