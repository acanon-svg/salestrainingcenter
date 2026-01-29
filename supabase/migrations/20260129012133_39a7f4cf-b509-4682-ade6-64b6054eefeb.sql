-- Create table for portal section visibility configuration
CREATE TABLE public.portal_section_configs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  section_key TEXT NOT NULL UNIQUE,
  section_name TEXT NOT NULL,
  description TEXT,
  is_enabled BOOLEAN NOT NULL DEFAULT true,
  target_teams TEXT[] DEFAULT NULL,
  target_users UUID[] DEFAULT NULL,
  target_leaders UUID[] DEFAULT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.portal_section_configs ENABLE ROW LEVEL SECURITY;

-- Admins and creators can manage portal section configs
CREATE POLICY "Admins and creators can manage portal section configs"
ON public.portal_section_configs
FOR ALL
USING (
  has_role(auth.uid(), 'admin'::app_role) OR 
  has_role(auth.uid(), 'creator'::app_role)
);

-- Everyone can view portal section configs (to check visibility)
CREATE POLICY "Everyone can view portal section configs"
ON public.portal_section_configs
FOR SELECT
USING (true);

-- Insert default sections
INSERT INTO public.portal_section_configs (section_key, section_name, description) VALUES
('dashboard', 'Dashboard', 'Página principal del portal'),
('courses', 'Cursos', 'Sección de cursos disponibles'),
('training_materials', 'Material de Entrenamiento', 'Biblioteca de materiales'),
('ranking', 'Ranking', 'Tabla de clasificación'),
('badges', 'Insignias', 'Sistema de insignias'),
('tools', 'Herramientas', 'Calculadoras y herramientas'),
('team_feedback', 'Feedbacks al Equipo', 'Formularios de feedback'),
('announcements', 'Anuncios', 'Sección de anuncios');

-- Modify team_feedback_forms to support target_leaders
ALTER TABLE public.team_feedback_forms ADD COLUMN IF NOT EXISTS target_leaders UUID[] DEFAULT NULL;

-- Update RLS policy for team_feedback_forms to include leader targeting
DROP POLICY IF EXISTS "Leaders can view team feedback forms" ON public.team_feedback_forms;

CREATE POLICY "Leaders can view targeted feedback forms"
ON public.team_feedback_forms
FOR SELECT
USING (
  (is_active = true) AND (
    -- If no targeting at all, show to everyone
    ((target_teams IS NULL OR target_teams = '{}') AND (target_leaders IS NULL OR target_leaders = '{}'))
    -- Or user's team is in target_teams
    OR (EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.user_id = auth.uid() AND profiles.team = ANY(team_feedback_forms.target_teams)
    ))
    -- Or user is specifically targeted as leader
    OR (auth.uid() = ANY(target_leaders))
    -- Or admin/creator can always see
    OR has_role(auth.uid(), 'admin'::app_role)
    OR has_role(auth.uid(), 'creator'::app_role)
  )
);

-- Create trigger for updated_at
CREATE TRIGGER update_portal_section_configs_updated_at
BEFORE UPDATE ON public.portal_section_configs
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();