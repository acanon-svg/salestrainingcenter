-- Create app_settings table for global configuration
CREATE TABLE public.app_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    key TEXT NOT NULL UNIQUE,
    value JSONB NOT NULL DEFAULT '{}',
    description TEXT,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_by UUID
);

-- Enable RLS
ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;

-- Everyone can read settings
CREATE POLICY "Everyone can view settings"
    ON public.app_settings FOR SELECT
    USING (true);

-- Only admins can modify settings
CREATE POLICY "Admins can manage settings"
    ON public.app_settings FOR ALL
    USING (public.has_role(auth.uid(), 'admin'));

-- Insert default setting for registration (disabled by default)
INSERT INTO public.app_settings (key, value, description)
VALUES ('registration_enabled', 'false', 'Controla si los usuarios pueden registrarse en la plataforma');