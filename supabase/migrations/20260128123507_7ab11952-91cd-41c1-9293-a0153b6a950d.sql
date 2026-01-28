-- Add target_teams column to tools table for team-based visibility
ALTER TABLE public.tools 
ADD COLUMN target_teams text[] DEFAULT NULL;

-- Update RLS policy to filter tools by team
DROP POLICY IF EXISTS "Everyone can view active tools" ON public.tools;

CREATE POLICY "Users can view tools for their team" 
ON public.tools 
FOR SELECT 
USING (
  is_active = true 
  AND (
    target_teams IS NULL 
    OR target_teams = '{}' 
    OR EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.user_id = auth.uid() 
      AND profiles.team = ANY(tools.target_teams)
    )
    OR has_role(auth.uid(), 'creator'::app_role)
    OR has_role(auth.uid(), 'admin'::app_role)
  )
);