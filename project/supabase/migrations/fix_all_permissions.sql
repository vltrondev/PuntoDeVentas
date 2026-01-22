-- Comprehensive permission fix for Couriers (and all staff)
-- This ensures they can read all necessary related data

-- 1. Orders: Ensure they can see orders assigned to them OR all orders if necessary (fallback)
DROP POLICY IF EXISTS "Couriers can view assigned orders" ON orders;
CREATE POLICY "Couriers can view assigned orders"
ON orders FOR SELECT
TO authenticated
USING (
  assigned_to = auth.uid() 
  OR 
  user_id = auth.uid() 
  OR 
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

-- 2. Order Items: Essential for the dashboard details
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated users can view order items" ON order_items;
CREATE POLICY "Authenticated users can view order items"
ON order_items FOR SELECT
TO authenticated
USING (true);

-- 3. Products: Essential for item details
ALTER TABLE products ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated users can view products" ON products;
CREATE POLICY "Authenticated users can view products"
ON products FOR SELECT
TO authenticated
USING (true);

-- 4. Contacts: Essential for customer info
ALTER TABLE contacts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated users can view contacts" ON contacts;
CREATE POLICY "Authenticated users can view contacts"
ON contacts FOR SELECT
TO authenticated
USING (true);

-- 5. Profiles: Essential for reading user info
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated users can view profiles" ON profiles;
CREATE POLICY "Authenticated users can view profiles"
ON profiles FOR SELECT
TO authenticated
USING (true);
