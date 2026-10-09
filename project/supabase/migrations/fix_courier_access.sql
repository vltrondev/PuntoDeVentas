-- Ensure explicit access for couriers to view their assigned orders
-- This is a fallback/reinforcement in case the "view all" policy is missing or not working

-- 1. Explicitly allow users to view orders assigned to them
DROP POLICY IF EXISTS "Couriers can view assigned orders" ON orders;

CREATE POLICY "Couriers can view assigned orders"
ON orders FOR SELECT
TO authenticated
USING (
  user_id = auth.uid()
  OR (
    (courier_id = auth.uid() OR assigned_to = auth.uid())
    AND auth.jwt() -> 'app_metadata' ->> 'role' = 'courier'
  )
);

-- 2. Ensure they can update status of assigned orders
DROP POLICY IF EXISTS "Couriers can update assigned orders" ON orders;

CREATE POLICY "Couriers can update assigned orders"
ON orders FOR UPDATE
TO authenticated
USING (
  (courier_id = auth.uid() OR assigned_to = auth.uid())
  AND auth.jwt() -> 'app_metadata' ->> 'role' = 'courier'
)
WITH CHECK (
  (courier_id = auth.uid() OR assigned_to = auth.uid())
  AND auth.jwt() -> 'app_metadata' ->> 'role' = 'courier'
);
