
-- Create table for commission accelerators (bonus tiers based on firmas)
CREATE TABLE public.commission_accelerators (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  config_id UUID NOT NULL REFERENCES public.commission_calculator_configs(id) ON DELETE CASCADE,
  min_firmas INTEGER NOT NULL DEFAULT 0,
  bonus_percentage NUMERIC NOT NULL DEFAULT 0,
  description TEXT,
  order_index INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.commission_accelerators ENABLE ROW LEVEL SECURITY;

-- Policies: same access pattern as commission_calculator_configs
CREATE POLICY "Authenticated users can read accelerators"
ON public.commission_accelerators
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Creators and admins can manage accelerators"
ON public.commission_accelerators
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() AND role IN ('creator', 'admin')
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() AND role IN ('creator', 'admin')
  )
);
