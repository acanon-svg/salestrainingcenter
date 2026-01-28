-- Create team_feedback_forms table for embedded Google Forms
CREATE TABLE public.team_feedback_forms (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  description text,
  embed_url text NOT NULL,
  target_teams text[] DEFAULT NULL,
  is_active boolean DEFAULT true,
  created_by uuid REFERENCES auth.users(id),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.team_feedback_forms ENABLE ROW LEVEL SECURITY;

-- Creators and admins can manage forms
CREATE POLICY "Creators can manage team feedback forms"
ON public.team_feedback_forms
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_roles.user_id = auth.uid()
    AND user_roles.role IN ('creator', 'admin')
  )
);

-- Leaders can view forms for their team
CREATE POLICY "Leaders can view team feedback forms"
ON public.team_feedback_forms
FOR SELECT
USING (
  is_active = true
  AND (
    target_teams IS NULL
    OR target_teams = '{}'
    OR EXISTS (
      SELECT 1 FROM leader_regions lr
      JOIN profiles p ON p.regional = lr.regional
      WHERE lr.user_id = auth.uid()
      AND p.team = ANY(team_feedback_forms.target_teams)
    )
    OR EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.user_id = auth.uid()
      AND profiles.team = ANY(team_feedback_forms.target_teams)
    )
  )
);

-- Add updated_at trigger
CREATE TRIGGER update_team_feedback_forms_updated_at
  BEFORE UPDATE ON public.team_feedback_forms
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();