-- 1. Crear una función "Security Definer" para verificar si es admin sin causar recursión
-- SECURITY DEFINER significa que la función se ejecuta con permisos totales, saltándose las políticas RLS.
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM profiles
    WHERE id = auth.uid()
    AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Borrar la política problemática que causa el bucle infinito
DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;

-- 3. Crear la política de nuevo USANDO LA FUNCIÓN
CREATE POLICY "Admins can view all profiles"
  ON profiles FOR SELECT
  TO authenticated
  USING (is_admin());
