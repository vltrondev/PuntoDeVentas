/*
  # Complete E-commerce Schema

  1. New Tables
    - `categories` - Product categories (Electronics, Clothing, etc.)
    - `products` - Product catalog with images, prices, stock
    - `cart_items` - Shopping cart functionality
    - `orders` - Order management and tracking
    - `order_items` - Individual items within orders

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users
    - Public read access for products and categories
    - Private access for cart and orders

  3. Sample Data
    - Pre-populate categories and products for demonstration
*/

-- Categories table
CREATE TABLE IF NOT EXISTS categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  image_url text,
  created_at timestamptz DEFAULT now()
);

-- Products table
CREATE TABLE IF NOT EXISTS products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  price decimal(10,2) NOT NULL,
  image_url text,
  category_id uuid REFERENCES categories(id),
  stock integer DEFAULT 0,
  featured boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- Cart items table
CREATE TABLE IF NOT EXISTS cart_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  product_id uuid REFERENCES products(id) ON DELETE CASCADE,
  quantity integer DEFAULT 1,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, product_id)
);

-- Orders table
CREATE TABLE IF NOT EXISTS orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  total decimal(10,2) NOT NULL,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'shipped', 'delivered', 'cancelled')),
  shipping_address text,
  created_at timestamptz DEFAULT now()
);

-- Order items table
CREATE TABLE IF NOT EXISTS order_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid REFERENCES orders(id) ON DELETE CASCADE,
  product_id uuid REFERENCES products(id),
  quantity integer NOT NULL,
  price decimal(10,2) NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE cart_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;

-- RLS Policies

-- Categories and Products - Public read access
CREATE POLICY "Anyone can read categories"
  ON categories FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Anyone can read products"
  ON products FOR SELECT
  TO public
  USING (true);

-- Cart Items - Users can only access their own cart
CREATE POLICY "Users can manage their own cart"
  ON cart_items FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Orders - Users can only access their own orders
CREATE POLICY "Users can read their own orders"
  ON orders FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own orders"
  ON orders FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Order Items - Users can only access items from their own orders
CREATE POLICY "Users can read their own order items"
  ON order_items FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM orders 
      WHERE orders.id = order_items.order_id 
      AND orders.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create order items for their own orders"
  ON order_items FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM orders 
      WHERE orders.id = order_items.order_id 
      AND orders.user_id = auth.uid()
    )
  );

-- Sample Categories
INSERT INTO categories (name, description, image_url) VALUES
('Electrónicos', 'Dispositivos y gadgets tecnológicos', 'https://images.pexels.com/photos/356056/pexels-photo-356056.jpeg?auto=compress&cs=tinysrgb&w=600'),
('Ropa y Moda', 'Prendas de vestir para toda la familia', 'https://images.pexels.com/photos/996329/pexels-photo-996329.jpeg?auto=compress&cs=tinysrgb&w=600'),
('Hogar y Jardín', 'Decoración y artículos para el hogar', 'https://images.pexels.com/photos/1643383/pexels-photo-1643383.jpeg?auto=compress&cs=tinysrgb&w=600'),
('Deportes', 'Equipamiento y ropa deportiva', 'https://images.pexels.com/photos/863988/pexels-photo-863988.jpeg?auto=compress&cs=tinysrgb&w=600'),
('Libros', 'Literatura y material educativo', 'https://images.pexels.com/photos/159711/books-bookstore-book-reading-159711.jpeg?auto=compress&cs=tinysrgb&w=600'),
('Salud y Belleza', 'Productos de cuidado personal', 'https://images.pexels.com/photos/3685530/pexels-photo-3685530.jpeg?auto=compress&cs=tinysrgb&w=600');

-- Sample Products
INSERT INTO products (name, description, price, image_url, category_id, stock, featured) VALUES
-- Electronics
('Smartphone Pro Max', 'Último modelo con cámara avanzada y 5G', 899.99, 'https://images.pexels.com/photos/404280/pexels-photo-404280.jpeg?auto=compress&cs=tinysrgb&w=600', (SELECT id FROM categories WHERE name = 'Electrónicos'), 25, true),
('Laptop Gaming', 'Potente laptop para gaming y trabajo profesional', 1299.99, 'https://images.pexels.com/photos/18105/pexels-photo.jpg?auto=compress&cs=tinysrgb&w=600', (SELECT id FROM categories WHERE name = 'Electrónicos'), 15, true),
('Auriculares Inalámbricos', 'Sonido premium con cancelación de ruido', 199.99, 'https://images.pexels.com/photos/3394650/pexels-photo-3394650.jpeg?auto=compress&cs=tinysrgb&w=600', (SELECT id FROM categories WHERE name = 'Electrónicos'), 50, false),
('Smart TV 55"', 'Televisor 4K Ultra HD con Smart TV', 699.99, 'https://images.pexels.com/photos/6077368/pexels-photo-6077368.jpeg?auto=compress&cs=tinysrgb&w=600', (SELECT id FROM categories WHERE name = 'Electrónicos'), 20, true),

-- Clothing
('Camiseta Premium', 'Camiseta de algodón orgánico de alta calidad', 29.99, 'https://images.pexels.com/photos/8532616/pexels-photo-8532616.jpeg?auto=compress&cs=tinysrgb&w=600', (SELECT id FROM categories WHERE name = 'Ropa y Moda'), 100, false),
('Jeans Clásicos', 'Jeans de corte recto, disponibles en varios colores', 79.99, 'https://images.pexels.com/photos/1082529/pexels-photo-1082529.jpeg?auto=compress&cs=tinysrgb&w=600', (SELECT id FROM categories WHERE name = 'Ropa y Moda'), 75, false),
('Chaqueta de Invierno', 'Chaqueta térmica resistente al agua', 149.99, 'https://images.pexels.com/photos/996329/pexels-photo-996329.jpeg?auto=compress&cs=tinysrgb&w=600', (SELECT id FROM categories WHERE name = 'Ropa y Moda'), 30, true),

-- Home & Garden
('Sofá Moderno', 'Sofá de 3 plazas con diseño contemporáneo', 899.99, 'https://images.pexels.com/photos/1643383/pexels-photo-1643383.jpeg?auto=compress&cs=tinysrgb&w=600', (SELECT id FROM categories WHERE name = 'Hogar y Jardín'), 12, true),
('Set de Cocina', 'Utensilios de cocina profesionales', 129.99, 'https://images.pexels.com/photos/4551832/pexels-photo-4551832.jpeg?auto=compress&cs=tinysrgb&w=600', (SELECT id FROM categories WHERE name = 'Hogar y Jardín'), 40, false),
('Plantas Decorativas', 'Set de plantas para interior', 39.99, 'https://images.pexels.com/photos/1005058/pexels-photo-1005058.jpeg?auto=compress&cs=tinysrgb&w=600', (SELECT id FROM categories WHERE name = 'Hogar y Jardín'), 60, false),

-- Sports
('Bicicleta Montaña', 'Bicicleta todo terreno con 21 velocidades', 599.99, 'https://images.pexels.com/photos/100582/pexels-photo-100582.jpeg?auto=compress&cs=tinysrgb&w=600', (SELECT id FROM categories WHERE name = 'Deportes'), 18, true),
('Set de Pesas', 'Kit completo para entrenamiento en casa', 199.99, 'https://images.pexels.com/photos/863988/pexels-photo-863988.jpeg?auto=compress&cs=tinysrgb&w=600', (SELECT id FROM categories WHERE name = 'Deportes'), 25, false),

-- Books
('Libro de Programación', 'Guía completa de desarrollo web moderno', 49.99, 'https://images.pexels.com/photos/159711/books-bookstore-book-reading-159711.jpeg?auto=compress&cs=tinysrgb&w=600', (SELECT id FROM categories WHERE name = 'Libros'), 80, false),
('Novela Bestseller', 'La novela más vendida del año', 19.99, 'https://images.pexels.com/photos/1550648/pexels-photo-1550648.jpeg?auto=compress&cs=tinysrgb&w=600', (SELECT id FROM categories WHERE name = 'Libros'), 120, false),

-- Health & Beauty
('Crema Facial Premium', 'Crema hidratante con ingredientes naturales', 79.99, 'https://images.pexels.com/photos/3685530/pexels-photo-3685530.jpeg?auto=compress&cs=tinysrgb&w=600', (SELECT id FROM categories WHERE name = 'Salud y Belleza'), 45, false),
('Kit de Maquillaje', 'Set completo de maquillaje profesional', 129.99, 'https://images.pexels.com/photos/2533266/pexels-photo-2533266.jpeg?auto=compress&cs=tinysrgb&w=600', (SELECT id FROM categories WHERE name = 'Salud y Belleza'), 35, true);