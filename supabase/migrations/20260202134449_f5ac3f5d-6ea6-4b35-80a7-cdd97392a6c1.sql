-- Drop the existing policy and recreate with explicit role
DROP POLICY IF EXISTS "Users can view tools for their team" ON public.tools;

-- Create the corrected policy with explicit TO authenticated
CREATE POLICY "Users can view tools for their team"
ON public.tools
AS PERMISSIVE
FOR SELECT
TO authenticated
USING (
  (is_active = true) 
  AND (
    (target_teams IS NULL) 
    OR (target_teams = '{}'::text[]) 
    OR EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.user_id = auth.uid() 
      AND profiles.team = ANY(tools.target_teams)
    )
    OR has_role(auth.uid(), 'creator'::app_role) 
    OR has_role(auth.uid(), 'admin'::app_role)
  )
);