-- Create tags table for training materials
CREATE TABLE public.material_tags (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  color TEXT NOT NULL DEFAULT '#3b82f6',
  priority INTEGER NOT NULL DEFAULT 0,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create junction table for material-tag relationships
CREATE TABLE public.material_tag_assignments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  material_id UUID NOT NULL REFERENCES public.training_materials(id) ON DELETE CASCADE,
  tag_id UUID NOT NULL REFERENCES public.material_tags(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(material_id, tag_id)
);

-- Add keywords column to training_materials
ALTER TABLE public.training_materials 
ADD COLUMN keywords TEXT[] DEFAULT '{}';

-- Enable RLS
ALTER TABLE public.material_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.material_tag_assignments ENABLE ROW LEVEL SECURITY;

-- RLS policies for material_tags
CREATE POLICY "Anyone can view tags" ON public.material_tags
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Creators and admins can manage tags" ON public.material_tags
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid()
      AND role IN ('creator', 'admin')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid()
      AND role IN ('creator', 'admin')
    )
  );

-- RLS policies for material_tag_assignments
CREATE POLICY "Anyone can view tag assignments" ON public.material_tag_assignments
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Creators and admins can manage tag assignments" ON public.material_tag_assignments
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid()
      AND role IN ('creator', 'admin')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid()
      AND role IN ('creator', 'admin')
    )
  );

-- Create indexes for performance
CREATE INDEX idx_material_tag_assignments_material ON public.material_tag_assignments(material_id);
CREATE INDEX idx_material_tag_assignments_tag ON public.material_tag_assignments(tag_id);
CREATE INDEX idx_training_materials_keywords ON public.training_materials USING GIN(keywords);