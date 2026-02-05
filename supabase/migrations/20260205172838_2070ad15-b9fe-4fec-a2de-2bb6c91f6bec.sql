-- Create FAQ table for training materials
CREATE TABLE public.material_faqs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  material_id UUID NOT NULL REFERENCES public.training_materials(id) ON DELETE CASCADE,
  question TEXT NOT NULL,
  answer TEXT NOT NULL,
  order_index INTEGER DEFAULT 0,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.material_faqs ENABLE ROW LEVEL SECURITY;

-- Allow everyone to read FAQs (for search and viewing)
CREATE POLICY "Anyone can view FAQs"
ON public.material_faqs
FOR SELECT
USING (true);

-- Allow creators and admins to manage FAQs
CREATE POLICY "Creators can insert FAQs"
ON public.material_faqs
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid()
    AND role IN ('creator', 'admin')
  )
);

CREATE POLICY "Creators can update FAQs"
ON public.material_faqs
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid()
    AND role IN ('creator', 'admin')
  )
);

CREATE POLICY "Creators can delete FAQs"
ON public.material_faqs
FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid()
    AND role IN ('creator', 'admin')
  )
);

-- Create index for better search performance
CREATE INDEX idx_material_faqs_material_id ON public.material_faqs(material_id);
CREATE INDEX idx_material_faqs_question ON public.material_faqs USING gin(to_tsvector('spanish', question));
CREATE INDEX idx_material_faqs_answer ON public.material_faqs USING gin(to_tsvector('spanish', answer));