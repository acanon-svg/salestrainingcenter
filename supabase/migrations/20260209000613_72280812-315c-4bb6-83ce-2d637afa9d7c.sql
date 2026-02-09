-- Add business days columns to team_results
ALTER TABLE public.team_results
ADD COLUMN dias_habiles_transcurridos integer NOT NULL DEFAULT 0,
ADD COLUMN dias_habiles_mes integer NOT NULL DEFAULT 0;