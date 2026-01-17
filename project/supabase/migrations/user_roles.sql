/*
  # User Roles and Profiles Schema

  1. New Tables
    - `profiles`
      - `id` (uuid, matches auth.users.id)
      - `email` (text)
      - `role` (text, default 'user')
      - `created_at` (timestamp)

  2. Security
    - Enable RLS on `profiles`
    - Add policies for users to read their own profile
    - Add policies for admins to read all profiles

  3. Automation
    - Trigger to automatically create a profile entry when a new user signs up via Supabase Auth
*/

-- Create profiles table
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text,
  role text DEFAULT 'user' CHECK (role IN ('admin', 'user')),
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

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

-- Function to handle new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, email, role)
  VALUES (new.id, new.email, 'user');
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to call the function on sign up
CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

/*
  -----------------------------------------------------------------------
  INSTRUCCIONES DE USO MANUAL (Ejecutar en SQL Editor de Supabase)
  -----------------------------------------------------------------------

  1. PARA VERIFICAR SI ERES ADMIN:
     SELECT * FROM profiles;

  2. PARA CONVERTIR UN USUARIO EN ADMIN:
     -- Reemplaza 'tu-email@ejemplo.com' con el email del usuario registrado
     UPDATE profiles
     SET role = 'admin'
     WHERE email = 'tu-email@ejemplo.com';

*/
