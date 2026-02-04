-- Add order_index to courses table for ordering courses by creator
ALTER TABLE public.courses ADD COLUMN IF NOT EXISTS order_index integer DEFAULT 0;

-- Create course_tags table for course type labels (auto-learning, assisted, etc.)
CREATE TABLE public.course_tags (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL UNIQUE,
  color text NOT NULL DEFAULT '#3b82f6',
  priority integer NOT NULL DEFAULT 0,
  created_by uuid NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.course_tags ENABLE ROW LEVEL SECURITY;

-- Create policies for course_tags
CREATE POLICY "Anyone can view course tags" 
  ON public.course_tags 
  FOR SELECT 
  USING (true);

CREATE POLICY "Creators and admins can manage course tags" 
  ON public.course_tags 
  FOR ALL 
  USING (EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_roles.user_id = auth.uid()
    AND user_roles.role = ANY (ARRAY['creator'::app_role, 'admin'::app_role])
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_roles.user_id = auth.uid()
    AND user_roles.role = ANY (ARRAY['creator'::app_role, 'admin'::app_role])
  ));

-- Create course_tag_assignments junction table
CREATE TABLE public.course_tag_assignments (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  course_id uuid NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  tag_id uuid NOT NULL REFERENCES public.course_tags(id) ON DELETE CASCADE,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(course_id, tag_id)
);

-- Enable RLS
ALTER TABLE public.course_tag_assignments ENABLE ROW LEVEL SECURITY;

-- Create policies for course_tag_assignments
CREATE POLICY "Anyone can view tag assignments" 
  ON public.course_tag_assignments 
  FOR SELECT 
  USING (true);

CREATE POLICY "Creators and admins can manage tag assignments" 
  ON public.course_tag_assignments 
  FOR ALL 
  USING (EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_roles.user_id = auth.uid()
    AND user_roles.role = ANY (ARRAY['creator'::app_role, 'admin'::app_role])
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_roles.user_id = auth.uid()
    AND user_roles.role = ANY (ARRAY['creator'::app_role, 'admin'::app_role])
  ));

-- Insert default course tags
INSERT INTO public.course_tags (name, color, priority) VALUES
  ('Auto-aprendizaje', '#22c55e', 100),
  ('Material Asistido', '#f59e0b', 90),
  ('Sesión en Vivo', '#ef4444', 80)
ON CONFLICT (name) DO NOTHING;