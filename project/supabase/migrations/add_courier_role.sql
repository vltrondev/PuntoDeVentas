/*
  # Add Courier Role and Suspended Status

  1. Changes
    - Update `profiles` table check constraint to include 'courier' role
    - Update `orders` table check constraint to include 'suspended' status
*/

-- Update profiles role check constraint
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_role_check;
ALTER TABLE profiles ADD CONSTRAINT profiles_role_check 
  CHECK (role IN ('admin', 'user', 'courier'));

-- Update orders status check constraint
ALTER TABLE orders DROP CONSTRAINT IF EXISTS orders_status_check;
ALTER TABLE orders ADD CONSTRAINT orders_status_check 
  CHECK (status IN ('pending', 'processing', 'shipped', 'delivered', 'paid', 'cancelled', 'suspended'));
