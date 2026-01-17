
-- 1. Asegurar que la función is_admin existe y es segura (SECURITY DEFINER)
-- Esto permite que la función lea la tabla profiles saltándose el RLS, rompiendo el ciclo.
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

-- 2. Aseguramos que RLS esté activado
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- 3. Borramos TODAS las políticas antiguas para evitar conflictos
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;

-- 4. Creamos las políticas DE NUEVO (Limpio y sin errores)

-- Permiso de lectura (Users ven lo suyo, Admins ven todo)
CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  TO authenticated
  USING (
    auth.uid() = id -- Usuario normal ve su propia fila
    OR
    is_admin()      -- Admin ve cualquier fila (sin causar recursión gracias a la función)
  );

-- Permiso de creación (Cualquiera autenticado puede crear su propio perfil si no existe)
CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- Permiso de edición (Users editan lo suyo)
CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- NOTA: No necesitamos una política separada de "Admins can view all" porque ya la incluimos en el OR de la primera política.
