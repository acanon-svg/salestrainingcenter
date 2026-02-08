
-- Table to store team performance results uploaded from Google Sheets / CSV
CREATE TABLE public.team_results (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_email TEXT NOT NULL,
  regional TEXT,
  team TEXT,
  firmas_real NUMERIC NOT NULL DEFAULT 0,
  firmas_meta NUMERIC NOT NULL DEFAULT 0,
  originaciones_real NUMERIC NOT NULL DEFAULT 0,
  originaciones_meta NUMERIC NOT NULL DEFAULT 0,
  gmv_real NUMERIC NOT NULL DEFAULT 0,
  gmv_meta NUMERIC NOT NULL DEFAULT 0,
  period_date DATE NOT NULL,
  batch_id UUID,
  uploaded_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes for performance
CREATE INDEX idx_team_results_email ON public.team_results(user_email);
CREATE INDEX idx_team_results_regional ON public.team_results(regional);
CREATE INDEX idx_team_results_period ON public.team_results(period_date);
CREATE INDEX idx_team_results_batch ON public.team_results(batch_id);

-- Enable RLS
ALTER TABLE public.team_results ENABLE ROW LEVEL SECURITY;

-- Creators and admins can do everything
CREATE POLICY "Creators and admins can manage team_results"
ON public.team_results
FOR ALL
TO authenticated
USING (
  public.has_role(auth.uid(), 'creator') OR public.has_role(auth.uid(), 'admin')
)
WITH CHECK (
  public.has_role(auth.uid(), 'creator') OR public.has_role(auth.uid(), 'admin')
);

-- Leaders can read results for their regional
CREATE POLICY "Leaders can view their regional results"
ON public.team_results
FOR SELECT
TO authenticated
USING (
  public.has_role(auth.uid(), 'lider')
  AND regional IN (
    SELECT p.regional FROM public.profiles p WHERE p.user_id = auth.uid()
  )
);

-- Students can view their own results
CREATE POLICY "Students can view own results"
ON public.team_results
FOR SELECT
TO authenticated
USING (
  user_email IN (
    SELECT p.email FROM public.profiles p WHERE p.user_id = auth.uid()
  )
);

-- Trigger for updated_at
CREATE TRIGGER update_team_results_updated_at
BEFORE UPDATE ON public.team_results
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
