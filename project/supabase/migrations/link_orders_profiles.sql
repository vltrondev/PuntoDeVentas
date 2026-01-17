-- Link orders.assigned_to to profiles.id to allow JOINs
-- This fixes the error "Could not find a relationship between 'orders' and 'profiles'"

ALTER TABLE orders
DROP CONSTRAINT IF EXISTS orders_assigned_to_fkey;

ALTER TABLE orders
ADD CONSTRAINT orders_assigned_to_fkey
FOREIGN KEY (assigned_to)
REFERENCES profiles(id);
