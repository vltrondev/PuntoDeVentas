-- Function to handle stock updates based on order status changes
CREATE OR REPLACE FUNCTION public.handle_order_stock_change()
RETURNS TRIGGER AS $$
BEGIN
  -- Check if status changed
  IF OLD.status = NEW.status THEN
    RETURN NEW;
  END IF;

  -- Scenario 1: Order Cancelled or Suspended (Return Stock)
  -- If new status is 'cancelled' or 'suspended' AND old status was NOT 'cancelled' or 'suspended'
  IF (NEW.status IN ('cancelled', 'suspended')) AND (OLD.status NOT IN ('cancelled', 'suspended')) THEN
    -- Update stock for all items in this order
    UPDATE products p
    SET stock = p.stock + oi.quantity
    FROM order_items oi
    WHERE p.id = oi.product_id
    AND oi.order_id = NEW.id;
  END IF;

  -- Scenario 2: Order Reactivated (Deduct Stock again)
  -- If old status was 'cancelled' or 'suspended' AND new status is NOT 'cancelled' or 'suspended'
  -- This handles cases where a suspended/cancelled order is moved back to pending/processing
  IF (OLD.status IN ('cancelled', 'suspended')) AND (NEW.status NOT IN ('cancelled', 'suspended')) THEN
    -- Check if we have enough stock first? 
    -- For now, we just deduct. If stock goes negative, it goes negative (as per current simple logic).
    -- Or we could raise error if stock is insufficient, but that might block the status update.
    -- Let's stick to simple deduction matching the creation logic.
    
    UPDATE products p
    SET stock = p.stock - oi.quantity
    FROM order_items oi
    WHERE p.id = oi.product_id
    AND oi.order_id = NEW.id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create the trigger
DROP TRIGGER IF EXISTS on_order_status_change ON orders;

CREATE TRIGGER on_order_status_change
  AFTER UPDATE OF status ON orders
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_order_stock_change();
