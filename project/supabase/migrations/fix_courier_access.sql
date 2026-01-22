-- Ensure explicit access for couriers to view their assigned orders
-- This is a fallback/reinforcement in case the "view all" policy is missing or not working

-- 1. Explicitly allow users to view orders assigned to them
DROP POLICY IF EXISTS "Couriers can view assigned orders" ON orders;

CREATE POLICY "Couriers can view assigned orders"
ON orders FOR SELECT
TO authenticated
USING (
  assigned_to = auth.uid() 
  OR 
  user_id = auth.uid() -- Still allow seeing their own created orders if any
);

-- 2. Ensure they can update status of assigned orders
DROP POLICY IF EXISTS "Couriers can update assigned orders" ON orders;

CREATE POLICY "Couriers can update assigned orders"
ON orders FOR UPDATE
TO authenticated
USING (assigned_to = auth.uid())
WITH CHECK (assigned_to = auth.uid());
