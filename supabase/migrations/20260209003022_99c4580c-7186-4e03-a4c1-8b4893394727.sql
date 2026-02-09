-- Delete duplicates, keeping only one row per user_email + period_date
DELETE FROM public.team_results
WHERE id NOT IN (
  SELECT DISTINCT ON (user_email, period_date) id
  FROM public.team_results
  ORDER BY user_email, period_date, created_at DESC
);

-- Add unique constraint to prevent future duplicates
CREATE UNIQUE INDEX idx_team_results_user_period 
ON public.team_results (user_email, period_date);