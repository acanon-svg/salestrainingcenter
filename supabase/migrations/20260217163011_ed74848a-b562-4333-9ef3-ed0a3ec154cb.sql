
-- Create storage bucket for puzzle images
INSERT INTO storage.buckets (id, name, public)
VALUES ('puzzle-images', 'puzzle-images', true)
ON CONFLICT (id) DO NOTHING;

-- Allow authenticated users to upload puzzle images
CREATE POLICY "Authenticated users can upload puzzle images"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'puzzle-images' AND auth.role() = 'authenticated');

-- Allow public read access to puzzle images
CREATE POLICY "Public read access for puzzle images"
ON storage.objects FOR SELECT
USING (bucket_id = 'puzzle-images');

-- Allow uploaders to update their images
CREATE POLICY "Users can update own puzzle images"
ON storage.objects FOR UPDATE
USING (bucket_id = 'puzzle-images' AND auth.role() = 'authenticated');

-- Allow uploaders to delete their images
CREATE POLICY "Users can delete puzzle images"
ON storage.objects FOR DELETE
USING (bucket_id = 'puzzle-images' AND auth.role() = 'authenticated');
