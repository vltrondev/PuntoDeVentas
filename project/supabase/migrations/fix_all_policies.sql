-- 1. Aseguramos que RLS esté activado
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- 2. Borramos políticas antiguas para evitar conflictos o duplicados
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;

-- 3. Creamos las políticas correctas de nuevo

-- PERMITIR LECTURA (Select): Cada usuario ve su propio perfil
CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

-- PERMITIR CREACIÓN (Insert): Usuarios pueden crear su perfil si no existe
CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- PERMITIR EDICIÓN (Update): Usuarios pueden editar su propio datos
CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- PERMITIR A ADMINS VER TODO (Para gestión de usuarios futura)
CREATE POLICY "Admins can view all profiles"
  ON profiles FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );
