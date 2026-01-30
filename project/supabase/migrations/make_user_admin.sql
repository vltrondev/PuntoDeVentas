-- Reemplaza 'correo@ejemplo.com' con el correo real del usuario que quieres volver administrador
UPDATE profiles
SET role = 'admin'
WHERE email = '';


-- delivery

UPDATE profiles SET role = 'courier' WHERE email = '';


-- vendedores
UPDATE profiles
SET role = 'user'
WHERE email = '';