-- Create table for commission calculator configurations
CREATE TABLE public.commission_calculator_configs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tool_id UUID NOT NULL REFERENCES public.tools(id) ON DELETE CASCADE,
  name TEXT NOT NULL DEFAULT 'Configuración Principal',
  description TEXT,
  -- Target configurations (set by creator)
  meta_firmas INTEGER NOT NULL DEFAULT 100,
  meta_originaciones NUMERIC NOT NULL DEFAULT 0,
  meta_gmv_usd NUMERIC NOT NULL DEFAULT 0,
  base_comisional NUMERIC NOT NULL DEFAULT 1500000,
  -- Targeting
  target_users UUID[] DEFAULT NULL,
  target_teams TEXT[] DEFAULT NULL,
  is_default BOOLEAN DEFAULT false,
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id)
);

-- Enable RLS
ALTER TABLE public.commission_calculator_configs ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Creators and admins can manage configs"
ON public.commission_calculator_configs
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_roles.user_id = auth.uid()
    AND user_roles.role IN ('admin', 'creator')
  )
);

CREATE POLICY "Students and leaders can view their configs"
ON public.commission_calculator_configs
FOR SELECT
USING (
  is_default = true
  OR auth.uid() = ANY(target_users)
  OR EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.user_id = auth.uid()
    AND profiles.team = ANY(commission_calculator_configs.target_teams)
  )
);

-- Trigger for updated_at
CREATE TRIGGER update_commission_calculator_configs_updated_at
BEFORE UPDATE ON public.commission_calculator_configs
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();