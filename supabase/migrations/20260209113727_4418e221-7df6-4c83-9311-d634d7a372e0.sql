-- Fix 1: Add role check to publish_scheduled_courses function
CREATE OR REPLACE FUNCTION public.publish_scheduled_courses()
RETURNS void AS $$
BEGIN
  -- Verify caller has creator or admin role
  IF NOT (public.has_role(auth.uid(), 'creator'::app_role) OR public.has_role(auth.uid(), 'admin'::app_role)) THEN
    RAISE EXCEPTION 'Unauthorized: Only creators and admins can publish courses';
  END IF;

  UPDATE public.courses
  SET status = 'published', published_at = now()
  WHERE status = 'draft' AND scheduled_at IS NOT NULL AND scheduled_at <= now();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Fix 2: Restrict course-covers storage to creators/admins only
DROP POLICY IF EXISTS "Authenticated users can upload course covers" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can update course covers" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can delete course covers" ON storage.objects;

CREATE POLICY "Creators and admins can upload course covers"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'course-covers' 
  AND (public.has_role(auth.uid(), 'creator') OR public.has_role(auth.uid(), 'admin'))
);

CREATE POLICY "Creators and admins can update course covers"
ON storage.objects FOR UPDATE TO authenticated
USING (
  bucket_id = 'course-covers' 
  AND (public.has_role(auth.uid(), 'creator') OR public.has_role(auth.uid(), 'admin'))
);

CREATE POLICY "Creators and admins can delete course covers"
ON storage.objects FOR DELETE TO authenticated
USING (
  bucket_id = 'course-covers' 
  AND (public.has_role(auth.uid(), 'creator') OR public.has_role(auth.uid(), 'admin'))
);