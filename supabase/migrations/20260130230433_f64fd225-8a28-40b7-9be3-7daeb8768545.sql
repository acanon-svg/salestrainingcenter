-- Add course_link field to announcements table for redirecting to courses
ALTER TABLE public.announcements 
ADD COLUMN IF NOT EXISTS course_link text;

COMMENT ON COLUMN public.announcements.course_link IS 'URL del curso al que redirige el anuncio cuando el usuario hace clic';