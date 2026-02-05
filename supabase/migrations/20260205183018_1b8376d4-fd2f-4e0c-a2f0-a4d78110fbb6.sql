-- Drop the old constraint
ALTER TABLE public.training_materials DROP CONSTRAINT training_materials_type_check;

-- Add the new constraint with all types including 'tabla' and 'faq'
ALTER TABLE public.training_materials 
ADD CONSTRAINT training_materials_type_check 
CHECK (type = ANY (ARRAY['video'::text, 'documento'::text, 'link'::text, 'tabla'::text, 'faq'::text]));