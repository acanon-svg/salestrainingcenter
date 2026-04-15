ALTER TABLE public.team_results 
  ADD COLUMN IF NOT EXISTS originaciones_m1_real numeric NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS originaciones_m1_meta numeric NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS gmv_m1_real numeric NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS gmv_m1_meta numeric NOT NULL DEFAULT 0;