-- Asegurar que la tabla orders tenga todas las columnas necesarias
DO $$
BEGIN
    -- 1. Agregar contact_id si no existe
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'orders' AND column_name = 'contact_id') THEN
        ALTER TABLE orders ADD COLUMN contact_id uuid REFERENCES contacts(id);
    END IF;

    -- 2. Agregar assigned_to si no existe
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'orders' AND column_name = 'assigned_to') THEN
        ALTER TABLE orders ADD COLUMN assigned_to uuid REFERENCES auth.users(id);
    END IF;

    -- 3. Agregar order_type si no existe
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'orders' AND column_name = 'order_type') THEN
        ALTER TABLE orders ADD COLUMN order_type text DEFAULT 'sale';
        -- Intentar agregar el constraint, si falla es porque ya existe (ignoramos el error)
        BEGIN
            ALTER TABLE orders ADD CONSTRAINT check_order_type CHECK (order_type IN ('sale', 'invoice'));
        EXCEPTION
            WHEN duplicate_object THEN NULL;
        END;
    END IF;
END $$;

-- 4. Volver a aplicar la función para asegurar que coincide con la tabla
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
