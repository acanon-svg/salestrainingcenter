-- Create glossary_terms table for storing definitions
CREATE TABLE public.glossary_terms (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  term TEXT NOT NULL,
  definition TEXT NOT NULL,
  example TEXT,
  related_terms TEXT[],
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create unique index on lowercase term to prevent duplicates
CREATE UNIQUE INDEX idx_glossary_terms_term_lower ON public.glossary_terms (LOWER(term));

-- Enable RLS
ALTER TABLE public.glossary_terms ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Anyone authenticated can read glossary terms
CREATE POLICY "Anyone can view glossary terms"
  ON public.glossary_terms
  FOR SELECT
  TO authenticated
  USING (true);

-- Only creators and admins can manage glossary terms
CREATE POLICY "Creators and admins can insert glossary terms"
  ON public.glossary_terms
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid()
      AND role IN ('creator', 'admin')
    )
  );

CREATE POLICY "Creators and admins can update glossary terms"
  ON public.glossary_terms
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid()
      AND role IN ('creator', 'admin')
    )
  );

CREATE POLICY "Creators and admins can delete glossary terms"
  ON public.glossary_terms
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid()
      AND role IN ('creator', 'admin')
    )
  );

-- Add trigger for updated_at
CREATE TRIGGER update_glossary_terms_updated_at
  BEFORE UPDATE ON public.glossary_terms
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();