-- Create storage bucket for course covers
INSERT INTO storage.buckets (id, name, public)
VALUES ('course-covers', 'course-covers', true)
ON CONFLICT (id) DO NOTHING;

-- Create policy for authenticated users to upload course covers
CREATE POLICY "Authenticated users can upload course covers"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'course-covers');

-- Create policy for public read access
CREATE POLICY "Public can view course covers"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'course-covers');

-- Create policy for authenticated users to update their uploads
CREATE POLICY "Authenticated users can update course covers"
ON storage.objects
FOR UPDATE
TO authenticated
USING (bucket_id = 'course-covers');

-- Create policy for authenticated users to delete course covers
CREATE POLICY "Authenticated users can delete course covers"
ON storage.objects
FOR DELETE
TO authenticated
USING (bucket_id = 'course-covers');