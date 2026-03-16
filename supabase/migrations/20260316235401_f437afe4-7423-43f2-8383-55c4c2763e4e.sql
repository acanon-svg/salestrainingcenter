
CREATE TABLE public.hunter_business_metrics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  supervisor text NOT NULL,
  hunter_name text NOT NULL,
  period_month date NOT NULL,
  dia_meta integer NOT NULL DEFAULT 31,
  cierres_realizados integer NOT NULL DEFAULT 0,
  meta_firmas_mes integer,
  cumplimiento_firmas numeric,
  originados integer NOT NULL DEFAULT 0,
  meta_originados_mes integer,
  cumplimiento_originados numeric,
  gmv_usd numeric NOT NULL DEFAULT 0,
  meta_gmv_usd_mes numeric,
  cumplimiento_gmv numeric,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.hunter_business_metrics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins creators leaders can view business metrics"
ON public.hunter_business_metrics FOR SELECT
TO authenticated
USING (
  has_role(auth.uid(), 'admin'::app_role) OR
  has_role(auth.uid(), 'creator'::app_role) OR
  has_role(auth.uid(), 'lider'::app_role)
);

CREATE POLICY "Admins can manage business metrics"
ON public.hunter_business_metrics FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));
