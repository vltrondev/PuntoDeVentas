-- Reemplaza 'correo@ejemplo.com' con el correo real del usuario que quieres volver administrador
UPDATE profiles
SET role = 'admin'
WHERE email = '';


-- Courier access is read from auth.users app_metadata by the application.
UPDATE auth.users
SET raw_app_meta_data = COALESCE(raw_app_meta_data, '{}'::jsonb) || jsonb_build_object('role', 'courier')
WHERE lower(email) = lower('correo-del-mensajero@ejemplo.com')
RETURNING id, email, raw_app_meta_data ->> 'role' AS role;

UPDATE auth.users
SET role = 'authenticated'
WHERE lower(email) = lower('miches@mensajero.com')
RETURNING id, email, role AS database_role,
          raw_app_meta_data ->> 'role' AS app_role;


-- vendedores
UPDATE profiles
SET role = 'user'
WHERE email = '';