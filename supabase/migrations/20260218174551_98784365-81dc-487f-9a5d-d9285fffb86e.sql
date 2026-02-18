
-- Create course_folders table
CREATE TABLE public.course_folders (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  description text,
  color text DEFAULT '#3b82f6',
  order_index integer DEFAULT 0,
  created_by uuid NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.course_folders ENABLE ROW LEVEL SECURITY;

-- Creators can manage their own folders
CREATE POLICY "Creators can manage own folders"
ON public.course_folders
FOR ALL
USING (has_role(auth.uid(), 'creator'::app_role) AND created_by = auth.uid())
WITH CHECK (has_role(auth.uid(), 'creator'::app_role) AND created_by = auth.uid());

-- Creators can view all folders (for shared visibility)
CREATE POLICY "Creators can view all folders"
ON public.course_folders
FOR SELECT
USING (has_role(auth.uid(), 'creator'::app_role) OR has_role(auth.uid(), 'admin'::app_role));

-- Add folder_id to courses table
ALTER TABLE public.courses ADD COLUMN folder_id uuid REFERENCES public.course_folders(id) ON DELETE SET NULL;

-- Add timestamp trigger
CREATE TRIGGER update_course_folders_updated_at
BEFORE UPDATE ON public.course_folders
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
