-- Add rating field to feedback table for course ratings
ALTER TABLE public.feedback 
ADD COLUMN IF NOT EXISTS rating integer CHECK (rating >= 1 AND rating <= 5);

-- Add a type field to distinguish course feedback from general feedback
ALTER TABLE public.feedback 
ADD COLUMN IF NOT EXISTS feedback_type text DEFAULT 'general' CHECK (feedback_type IN ('general', 'course'));

-- Add index for faster course feedback queries
CREATE INDEX IF NOT EXISTS idx_feedback_course_id ON public.feedback(course_id) WHERE course_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_feedback_type ON public.feedback(feedback_type);
CREATE INDEX IF NOT EXISTS idx_feedback_status ON public.feedback(status);