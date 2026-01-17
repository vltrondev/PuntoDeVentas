-- Bloque de permisos para que TODOS los usuarios (staff) puedan ver y editar pedidos.
-- Esto permite que cualquier empleado cobre una factura hecha por otro.

-- 1. Políticas de Lectura (Ver pedidos)
DROP POLICY IF EXISTS "Users can read their own orders" ON orders;
CREATE POLICY "Staff can view all orders"
  ON orders FOR SELECT
  TO authenticated
  USING (true);

-- 2. Políticas de Edición (Cobrar / Modificar)
DROP POLICY IF EXISTS "Users can update own orders" ON orders; 
DROP POLICY IF EXISTS "Admins can update all orders" ON orders;

-- Permitir a cualquier AUTHENTICATED user cambiar el estado
CREATE POLICY "Staff can update any order"
  ON orders FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- 3. Políticas de Creación (Facturar)
-- (Ya existía "Users can create their own orders", pero la hacemos más permisiva por si acaso)
DROP POLICY IF EXISTS "Users can create their own orders" ON orders;
CREATE POLICY "Staff can create orders"
  ON orders FOR INSERT
  TO authenticated
  WITH CHECK (true);
