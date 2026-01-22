-- Fix missing relationship error: "Could not find a relationship between 'orders' and 'user_id'"
-- This links orders.user_id directly to the public.profiles table so PostgREST can resolve the join.

-- 1. Drop existing constraint if it points only to auth.users (we can't easily drop auth references, but we can ADD a new one to public.profiles)
-- Note: It is safe to have multiple FKs if they are consistent, but usually we just want one effective one for PostgREST to see.
-- However, user_id probably references auth.users. referencing public.profiles(id) is also valid since profiles(id) is a PK.

DO $$
BEGIN
    -- We try to add the constraint. 
    -- If valid foreign keys already exist, this just ensures the public schema link is explicit.
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'orders_user_id_profiles_fkey' 
        AND table_name = 'orders'
    ) THEN
        ALTER TABLE orders
        ADD CONSTRAINT orders_user_id_profiles_fkey
        FOREIGN KEY (user_id)
        REFERENCES profiles(id);
    END IF;
END $$;
