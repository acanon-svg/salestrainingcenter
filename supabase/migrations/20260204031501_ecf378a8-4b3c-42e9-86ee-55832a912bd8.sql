-- Create table for monthly commission configurations
CREATE TABLE public.commission_monthly_configs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  config_id UUID NOT NULL REFERENCES public.commission_calculator_configs(id) ON DELETE CASCADE,
  month INTEGER NOT NULL CHECK (month >= 1 AND month <= 12),
  year INTEGER NOT NULL CHECK (year >= 2024 AND year <= 2100),
  meta_firmas INTEGER NOT NULL DEFAULT 100,
  meta_originaciones NUMERIC NOT NULL DEFAULT 0,
  meta_gmv_usd NUMERIC NOT NULL DEFAULT 0,
  base_comisional NUMERIC NOT NULL DEFAULT 1500000,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id),
  UNIQUE(config_id, month, year)
);

-- Enable RLS
ALTER TABLE public.commission_monthly_configs ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Anyone can view monthly configs"
ON public.commission_monthly_configs
FOR SELECT
USING (true);

CREATE POLICY "Creators and admins can manage monthly configs"
ON public.commission_monthly_configs
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid()
    AND role IN ('admin', 'creator')
  )
);

-- Create trigger for updated_at
CREATE TRIGGER update_commission_monthly_configs_updated_at
BEFORE UPDATE ON public.commission_monthly_configs
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Add index for faster lookups
CREATE INDEX idx_commission_monthly_configs_lookup 
ON public.commission_monthly_configs(config_id, month, year);