-- Add course_resources table for additional resources links
CREATE TABLE public.course_resources (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  url TEXT NOT NULL,
  order_index INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add points column to quiz_questions if not exists (for individual question scoring)
-- Note: The points column already exists, so we'll just ensure it's used properly

-- Enable RLS on course_resources
ALTER TABLE public.course_resources ENABLE ROW LEVEL SECURITY;

-- Creators can manage resources
CREATE POLICY "Creators can manage course resources"
ON public.course_resources
FOR ALL
USING (
  has_role(auth.uid(), 'creator'::app_role) OR has_role(auth.uid(), 'admin'::app_role)
);

-- Users can view resources of accessible courses
CREATE POLICY "View resources of accessible courses"
ON public.course_resources
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM courses
    WHERE courses.id = course_resources.course_id
    AND (
      courses.status = 'published'::course_status
      OR courses.created_by = auth.uid()
      OR has_role(auth.uid(), 'admin'::app_role)
    )
  )
);