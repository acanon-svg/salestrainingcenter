
-- Commission reviews for Field Sales leaders
CREATE TABLE public.commission_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_email TEXT NOT NULL,
  user_name TEXT,
  period_month INT NOT NULL,
  period_year INT NOT NULL,
  regional TEXT,
  
  -- Snapshot of results at review time
  firmas_real NUMERIC NOT NULL DEFAULT 0,
  firmas_meta NUMERIC NOT NULL DEFAULT 0,
  originaciones_real NUMERIC NOT NULL DEFAULT 0,
  originaciones_meta NUMERIC NOT NULL DEFAULT 0,
  gmv_real NUMERIC NOT NULL DEFAULT 0,
  gmv_meta NUMERIC NOT NULL DEFAULT 0,
  
  -- Calculated fields
  firmas_compliance NUMERIC NOT NULL DEFAULT 0,
  candado_met BOOLEAN NOT NULL DEFAULT FALSE,
  originaciones_weighted NUMERIC NOT NULL DEFAULT 0,
  gmv_weighted NUMERIC NOT NULL DEFAULT 0,
  base_commission NUMERIC NOT NULL DEFAULT 1500000,
  calculated_commission NUMERIC NOT NULL DEFAULT 0,
  
  -- Leader adjustments
  has_mb_income BOOLEAN NOT NULL DEFAULT FALSE,
  indicator_bonus NUMERIC NOT NULL DEFAULT 0,
  total_commission NUMERIC NOT NULL DEFAULT 0,
  
  -- Approval workflow
  status TEXT NOT NULL DEFAULT 'pending',
  rejection_reason TEXT,
  observations TEXT,
  reviewed_by UUID,
  reviewed_at TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  
  UNIQUE(user_email, period_month, period_year)
);

ALTER TABLE public.commission_reviews ENABLE ROW LEVEL SECURITY;

-- Leaders can manage their regional's commissions
CREATE POLICY "Leaders manage own regional commissions"
  ON public.commission_reviews
  FOR ALL
  TO authenticated
  USING (
    public.has_role(auth.uid(), 'lider') AND 
    regional IN (
      SELECT lr.regional FROM public.leader_regions lr WHERE lr.user_id = auth.uid()
    )
  )
  WITH CHECK (
    public.has_role(auth.uid(), 'lider') AND 
    regional IN (
      SELECT lr.regional FROM public.leader_regions lr WHERE lr.user_id = auth.uid()
    )
  );

-- Creators/Admins can read all commissions (for alerts and reports)
CREATE POLICY "Creators and admins manage all commissions"
  ON public.commission_reviews
  FOR ALL
  TO authenticated
  USING (
    public.has_role(auth.uid(), 'creator') OR 
    public.has_role(auth.uid(), 'admin')
  )
  WITH CHECK (
    public.has_role(auth.uid(), 'creator') OR 
    public.has_role(auth.uid(), 'admin')
  );

-- Validation trigger for period_month (instead of CHECK constraint)
CREATE OR REPLACE FUNCTION public.validate_commission_review()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.period_month < 1 OR NEW.period_month > 12 THEN
    RAISE EXCEPTION 'period_month must be between 1 and 12';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER validate_commission_review_trigger
  BEFORE INSERT OR UPDATE ON public.commission_reviews
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_commission_review();

-- Trigger to update updated_at
CREATE TRIGGER update_commission_reviews_updated_at
  BEFORE UPDATE ON public.commission_reviews
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
