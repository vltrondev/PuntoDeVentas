-- Add courier_id column to orders table
ALTER TABLE orders 
ADD COLUMN IF NOT EXISTS courier_id uuid REFERENCES auth.users(id);

-- Add index for better performance
CREATE INDEX IF NOT EXISTS idx_orders_courier_id ON orders(courier_id);
