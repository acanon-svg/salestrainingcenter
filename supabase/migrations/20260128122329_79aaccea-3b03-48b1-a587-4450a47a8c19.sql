-- Create table for tools/calculators
CREATE TABLE public.tools (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  type TEXT NOT NULL DEFAULT 'calculator',
  is_active BOOLEAN DEFAULT true,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create table for calculator variables
CREATE TABLE public.calculator_variables (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tool_id UUID NOT NULL REFERENCES public.tools(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  label TEXT NOT NULL,
  description TEXT,
  variable_type TEXT NOT NULL DEFAULT 'number', -- number, percentage, currency
  default_value NUMERIC DEFAULT 0,
  min_value NUMERIC,
  max_value NUMERIC,
  weight NUMERIC DEFAULT 1,
  visible_to_students BOOLEAN DEFAULT true,
  visible_to_leaders BOOLEAN DEFAULT true,
  order_index INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create table for calculator formulas
CREATE TABLE public.calculator_formulas (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tool_id UUID NOT NULL REFERENCES public.tools(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  label TEXT NOT NULL,
  description TEXT,
  formula TEXT NOT NULL, -- e.g., "(ventas * comision_base) * peso_region"
  result_type TEXT NOT NULL DEFAULT 'currency', -- number, percentage, currency
  visible_to_students BOOLEAN DEFAULT true,
  visible_to_leaders BOOLEAN DEFAULT true,
  order_index INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.tools ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.calculator_variables ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.calculator_formulas ENABLE ROW LEVEL SECURITY;

-- Policies for tools
CREATE POLICY "Everyone can view active tools" ON public.tools
  FOR SELECT USING (is_active = true);

CREATE POLICY "Creators can manage tools" ON public.tools
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.user_roles 
      WHERE user_id = auth.uid() 
      AND role IN ('creator', 'admin')
    )
  );

-- Policies for calculator_variables
CREATE POLICY "Everyone can view variables" ON public.calculator_variables
  FOR SELECT USING (true);

CREATE POLICY "Creators can manage variables" ON public.calculator_variables
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.user_roles 
      WHERE user_id = auth.uid() 
      AND role IN ('creator', 'admin')
    )
  );

-- Policies for calculator_formulas
CREATE POLICY "Everyone can view formulas" ON public.calculator_formulas
  FOR SELECT USING (true);

CREATE POLICY "Creators can manage formulas" ON public.calculator_formulas
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.user_roles 
      WHERE user_id = auth.uid() 
      AND role IN ('creator', 'admin')
    )
  );

-- Add updated_at trigger
CREATE TRIGGER update_tools_updated_at
  BEFORE UPDATE ON public.tools
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();