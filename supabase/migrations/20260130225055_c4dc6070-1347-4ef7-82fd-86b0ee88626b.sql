-- Add time_limit_minutes field to courses table (required field for new courses)
-- This represents the maximum time a student has to complete the course after enrolling
ALTER TABLE public.courses 
ADD COLUMN IF NOT EXISTS time_limit_minutes integer;

-- Add a comment explaining the field
COMMENT ON COLUMN public.courses.time_limit_minutes IS 'Maximum time in minutes that a student has to complete the course after enrolling. Timer starts when student first accesses the course.';