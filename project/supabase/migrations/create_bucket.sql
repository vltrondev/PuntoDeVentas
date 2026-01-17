-- Enable the storage extension if not already valid (usually defaults on)
-- Create the storage bucket 'product_images'
INSERT INTO storage.buckets (id, name, public)
VALUES ('product_images', 'product_images', true)
ON CONFLICT (id) DO NOTHING;

-- Set up security policies for the bucket

-- 1. Allow public read access to all images
CREATE POLICY "Give public access to product_images"
ON storage.objects FOR SELECT
USING (bucket_id = 'product_images');

-- 2. Allow authenticated users to upload images
CREATE POLICY "Allow particular uploads"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'product_images' AND auth.role() = 'authenticated');

-- 3. Allow authenticated users to update images
CREATE POLICY "Allow particular updates"
ON storage.objects FOR UPDATE
USING (bucket_id = 'product_images' AND auth.role() = 'authenticated');

-- 4. Allow authenticated users to delete images
CREATE POLICY "Allow particular deletes"
ON storage.objects FOR DELETE
USING (bucket_id = 'product_images' AND auth.role() = 'authenticated');
