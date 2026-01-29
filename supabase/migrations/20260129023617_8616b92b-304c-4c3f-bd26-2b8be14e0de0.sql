-- Drop existing policy for leaders viewing feedback forms
DROP POLICY IF EXISTS "Leaders can view targeted feedback forms" ON public.team_feedback_forms;

-- Create improved policy that properly handles leader visibility
-- Leaders can see forms if:
-- 1. Form is active AND (no targeting OR they match targeting OR they have lider role with no restrictions)
CREATE POLICY "Leaders can view targeted feedback forms" 
ON public.team_feedback_forms 
FOR SELECT 
USING (
  (is_active = true) 
  AND (
    -- Admin or Creator can see everything
    has_role(auth.uid(), 'admin'::app_role) 
    OR has_role(auth.uid(), 'creator'::app_role)
    -- User's ID is explicitly in target_leaders
    OR (auth.uid() = ANY (target_leaders))
    -- User's team matches target_teams
    OR (EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.user_id = auth.uid() 
      AND profiles.team = ANY (team_feedback_forms.target_teams)
    ))
    -- No specific targeting set (open to all leaders with lider role)
    OR (
      has_role(auth.uid(), 'lider'::app_role)
      AND (target_teams IS NULL OR target_teams = '{}'::text[])
      AND (target_leaders IS NULL OR target_leaders = '{}'::uuid[])
    )
  )
);