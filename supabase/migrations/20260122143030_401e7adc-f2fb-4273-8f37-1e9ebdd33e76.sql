-- Create chatbot configuration table
CREATE TABLE public.chatbot_config (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    enabled BOOLEAN NOT NULL DEFAULT false,
    bot_name TEXT NOT NULL DEFAULT 'Asistente',
    welcome_message TEXT NOT NULL DEFAULT '¡Hola! Soy tu asistente virtual. ¿En qué puedo ayudarte?',
    avatar_url TEXT,
    system_prompt TEXT NOT NULL DEFAULT 'Eres un asistente virtual experto en procesos comerciales. Responde de manera clara, concisa y profesional en español.',
    primary_color TEXT DEFAULT '#1C67D8',
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_by UUID
);

-- Enable RLS
ALTER TABLE public.chatbot_config ENABLE ROW LEVEL SECURITY;

-- Everyone can read chatbot config (needed for displaying the bot)
CREATE POLICY "Everyone can view chatbot config"
    ON public.chatbot_config FOR SELECT
    USING (true);

-- Only admins can modify chatbot config
CREATE POLICY "Admins can manage chatbot config"
    ON public.chatbot_config FOR ALL
    USING (public.has_role(auth.uid(), 'admin'));

-- Insert default configuration
INSERT INTO public.chatbot_config (enabled, bot_name, system_prompt)
VALUES (
    false, 
    'Asistente Comercial',
    'Eres un asistente virtual experto en procesos comerciales de ADDI. Tu rol es ayudar a los colaboradores con información sobre ventas, productos, procedimientos y mejores prácticas. Responde siempre en español de manera clara, profesional y concisa.'
);