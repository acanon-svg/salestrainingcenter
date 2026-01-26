-- Add material_id column to feedback table for linking feedback to training materials
ALTER TABLE public.feedback 
ADD COLUMN IF NOT EXISTS material_id UUID REFERENCES public.training_materials(id) ON DELETE SET NULL;

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_feedback_material_id ON public.feedback(material_id);

-- Add comment
COMMENT ON COLUMN public.feedback.material_id IS 'Reference to training material when feedback is about material content';