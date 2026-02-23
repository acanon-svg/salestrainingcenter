
-- Table to store historical snapshots of generated system prompts
CREATE TABLE public.chatbot_prompt_history (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  generated_prompt text NOT NULL,
  courses_count integer NOT NULL DEFAULT 0,
  materials_count integer NOT NULL DEFAULT 0,
  glossary_count integer NOT NULL DEFAULT 0,
  announcements_count integer NOT NULL DEFAULT 0,
  team_data_count integer NOT NULL DEFAULT 0,
  generated_by uuid,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.chatbot_prompt_history ENABLE ROW LEVEL SECURITY;

-- Only admins can view and manage prompt history
CREATE POLICY "Admins can manage prompt history"
  ON public.chatbot_prompt_history
  FOR ALL
  USING (public.has_role(auth.uid(), 'admin'::app_role));

-- Add auto_generated_prompt column to chatbot_config to separate manual from auto prompts
ALTER TABLE public.chatbot_config
  ADD COLUMN IF NOT EXISTS auto_generated_prompt text DEFAULT '';
