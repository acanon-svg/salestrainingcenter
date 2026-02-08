-- Add weeks_in_month column to team_results for weekly goal breakdown
ALTER TABLE public.team_results 
ADD COLUMN weeks_in_month smallint NOT NULL DEFAULT 4;

COMMENT ON COLUMN public.team_results.weeks_in_month IS 'Number of weeks in the month, used to divide monthly goals into weekly targets';