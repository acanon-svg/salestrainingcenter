
CREATE TABLE public.section_visits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  section_key text NOT NULL,
  section_label text NOT NULL,
  visited_at timestamp with time zone NOT NULL DEFAULT now(),
  duration_seconds integer DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE INDEX idx_section_visits_user_id ON public.section_visits(user_id);
CREATE INDEX idx_section_visits_section_key ON public.section_visits(section_key);
CREATE INDEX idx_section_visits_visited_at ON public.section_visits(visited_at);

ALTER TABLE public.section_visits ENABLE ROW LEVEL SECURITY;

-- Users can insert their own visits
CREATE POLICY "Users can insert own visits"
ON public.section_visits
FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

-- Users can update their own visits (for duration tracking)
CREATE POLICY "Users can update own visits"
ON public.section_visits
FOR UPDATE
TO authenticated
USING (user_id = auth.uid());

-- Admins, creators, and leaders can view all visits
CREATE POLICY "Admins creators leaders can view all visits"
ON public.section_visits
FOR SELECT
TO authenticated
USING (
  has_role(auth.uid(), 'admin'::app_role) 
  OR has_role(auth.uid(), 'creator'::app_role) 
  OR has_role(auth.uid(), 'lider'::app_role)
);

-- Users can view their own visits
CREATE POLICY "Users can view own visits"
ON public.section_visits
FOR SELECT
TO authenticated
USING (user_id = auth.uid());
