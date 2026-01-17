-- Reemplaza 'correo@ejemplo.com' con el correo real del usuario que quieres volver administrador
UPDATE profiles
SET role = 'admin'
WHERE email = 'correo@ejemplo.com';
