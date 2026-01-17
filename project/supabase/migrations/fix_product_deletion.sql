-- Drop the existing restrictive constraint
ALTER TABLE order_items
DROP CONSTRAINT IF EXISTS order_items_product_id_fkey;

-- Add the new constraint with ON DELETE SET NULL
ALTER TABLE order_items
ADD CONSTRAINT order_items_product_id_fkey
FOREIGN KEY (product_id)
REFERENCES products(id)
ON DELETE SET NULL;
