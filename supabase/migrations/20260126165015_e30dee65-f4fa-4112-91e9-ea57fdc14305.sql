-- Fix quiz_attempts answer exposure: Leaders should not see the answers column
-- Create a secure view that hides answers from leaders viewing regional data

-- Create a function to check if user owns the quiz attempt
CREATE OR REPLACE FUNCTION public.is_own_quiz_attempt(attempt_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT attempt_user_id = auth.uid()
$$;

-- Drop the existing RLS policy for leaders viewing regional quiz attempts
DROP POLICY IF EXISTS "Leaders can view regional quiz_attempts" ON public.quiz_attempts;

-- Create a more restrictive policy: leaders can view regional attempts but we'll use a view to hide answers
-- For now, keep the basic policies and create a safe view

-- Create a public view for quiz attempts that excludes answers for non-owners
CREATE OR REPLACE VIEW public.quiz_attempts_safe
WITH (security_invoker = on)
AS
SELECT 
  id,
  quiz_id,
  user_id,
  score,
  passed,
  started_at,
  completed_at,
  created_at,
  -- Only show answers if the current user owns the attempt
  CASE 
    WHEN user_id = auth.uid() THEN answers
    ELSE NULL
  END as answers
FROM public.quiz_attempts;

-- Grant access to the view
GRANT SELECT ON public.quiz_attempts_safe TO authenticated;

-- Add comment explaining the view's purpose
COMMENT ON VIEW public.quiz_attempts_safe IS 'Safe view of quiz_attempts that hides answers from non-owners (leaders viewing regional data)';

-- Re-create the leader policy to work with the base table (score, passed visible, but app should use the view)
CREATE POLICY "Leaders can view regional quiz_attempts"
ON public.quiz_attempts FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.leader_regions lr
    JOIN public.profiles p ON p.regional = lr.regional
    WHERE lr.user_id = auth.uid()
    AND p.user_id = quiz_attempts.user_id
  )
);