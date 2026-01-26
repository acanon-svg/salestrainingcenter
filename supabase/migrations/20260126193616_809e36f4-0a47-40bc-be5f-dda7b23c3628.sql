-- Fix the function with proper search_path
CREATE OR REPLACE FUNCTION public.publish_scheduled_courses()
RETURNS void AS $$
BEGIN
  UPDATE public.courses
  SET 
    status = 'published',
    published_at = now()
  WHERE 
    status = 'draft' 
    AND scheduled_at IS NOT NULL 
    AND scheduled_at <= now();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;