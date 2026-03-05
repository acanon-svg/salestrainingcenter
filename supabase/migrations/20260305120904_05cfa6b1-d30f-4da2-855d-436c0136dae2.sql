ALTER TABLE public.commission_monthly_configs 
ADD COLUMN meta_originaciones_m1 numeric NOT NULL DEFAULT 0,
ADD COLUMN meta_gmv_m1 numeric NOT NULL DEFAULT 0;