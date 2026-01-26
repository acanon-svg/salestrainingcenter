-- Create material_categories table for organizing training materials
CREATE TABLE public.material_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT,
    parent_id UUID REFERENCES public.material_categories(id) ON DELETE CASCADE,
    order_index INTEGER DEFAULT 0,
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add category_id to training_materials table
ALTER TABLE public.training_materials 
ADD COLUMN category_id UUID REFERENCES public.material_categories(id) ON DELETE SET NULL;

-- Create index for faster category lookups
CREATE INDEX idx_training_materials_category ON public.training_materials(category_id);
CREATE INDEX idx_material_categories_parent ON public.material_categories(parent_id);

-- Enable RLS
ALTER TABLE public.material_categories ENABLE ROW LEVEL SECURITY;

-- RLS Policies for material_categories
-- Everyone authenticated can view categories
CREATE POLICY "Anyone can view material categories"
ON public.material_categories
FOR SELECT
TO authenticated
USING (true);

-- Only creators and admins can manage categories
CREATE POLICY "Creators can insert categories"
ON public.material_categories
FOR INSERT
TO authenticated
WITH CHECK (
    public.has_role(auth.uid(), 'creator') OR 
    public.has_role(auth.uid(), 'admin')
);

CREATE POLICY "Creators can update categories"
ON public.material_categories
FOR UPDATE
TO authenticated
USING (
    public.has_role(auth.uid(), 'creator') OR 
    public.has_role(auth.uid(), 'admin')
);

CREATE POLICY "Creators can delete categories"
ON public.material_categories
FOR DELETE
TO authenticated
USING (
    public.has_role(auth.uid(), 'creator') OR 
    public.has_role(auth.uid(), 'admin')
);

-- Trigger for updated_at
CREATE TRIGGER update_material_categories_updated_at
BEFORE UPDATE ON public.material_categories
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();