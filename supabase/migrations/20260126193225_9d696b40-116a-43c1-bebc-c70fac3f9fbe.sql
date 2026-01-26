-- Add scheduled_at column to courses table
ALTER TABLE public.courses 
ADD COLUMN scheduled_at timestamp with time zone DEFAULT NULL;

-- Add index for efficient querying of scheduled courses
CREATE INDEX idx_courses_scheduled_at ON public.courses(scheduled_at) WHERE scheduled_at IS NOT NULL;

-- Create a function to auto-publish scheduled courses
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
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION public.publish_scheduled_courses() TO authenticated;

COMMENT ON COLUMN public.courses.scheduled_at IS 'Date when the course should be automatically published';