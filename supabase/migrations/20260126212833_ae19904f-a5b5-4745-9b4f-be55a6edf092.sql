-- Add target_teams and target_users columns to courses table for assignment
ALTER TABLE public.courses 
ADD COLUMN IF NOT EXISTS target_teams text[] DEFAULT NULL,
ADD COLUMN IF NOT EXISTS target_users uuid[] DEFAULT NULL;

-- Add index for better performance when filtering by teams
CREATE INDEX IF NOT EXISTS idx_courses_target_teams ON public.courses USING GIN(target_teams);

-- Add index for better performance when filtering by users
CREATE INDEX IF NOT EXISTS idx_courses_target_users ON public.courses USING GIN(target_users);

-- Add comment for documentation
COMMENT ON COLUMN public.courses.target_teams IS 'Array of team names this course is assigned to. NULL means available to all.';
COMMENT ON COLUMN public.courses.target_users IS 'Array of user IDs this course is specifically assigned to for personalized courses.';