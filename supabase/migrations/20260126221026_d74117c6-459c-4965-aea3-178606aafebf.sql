-- Add color column to material_categories
ALTER TABLE public.material_categories 
ADD COLUMN IF NOT EXISTS color TEXT DEFAULT '#6366f1';

-- Add comment
COMMENT ON COLUMN public.material_categories.color IS 'Color hex code for the category';