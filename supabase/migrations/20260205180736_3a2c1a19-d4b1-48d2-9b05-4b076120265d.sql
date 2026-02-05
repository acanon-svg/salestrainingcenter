-- Create table for category sections (to group/classify categories)
CREATE TABLE public.category_sections (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  color TEXT DEFAULT '#6366f1',
  order_index INTEGER DEFAULT 0,
  created_by UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add section_id to material_categories
ALTER TABLE public.material_categories 
ADD COLUMN section_id UUID REFERENCES public.category_sections(id) ON DELETE SET NULL;

-- Enable RLS
ALTER TABLE public.category_sections ENABLE ROW LEVEL SECURITY;

-- RLS Policies for category_sections
CREATE POLICY "Anyone can view category sections" 
ON public.category_sections 
FOR SELECT 
USING (true);

CREATE POLICY "Creators and admins can manage category sections" 
ON public.category_sections 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() 
    AND role IN ('creator', 'admin')
  )
);

-- Add trigger for updated_at
CREATE TRIGGER update_category_sections_updated_at
BEFORE UPDATE ON public.category_sections
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();