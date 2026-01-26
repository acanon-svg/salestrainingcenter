-- Create table to store team results data for the chatbot
CREATE TABLE public.chatbot_team_data (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    data_name TEXT NOT NULL,
    data_content JSONB NOT NULL,
    description TEXT,
    uploaded_by UUID,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.chatbot_team_data ENABLE ROW LEVEL SECURITY;

-- Only admins can manage team data
CREATE POLICY "Admins can manage chatbot team data"
ON public.chatbot_team_data
FOR ALL
USING (
    EXISTS (
        SELECT 1 FROM public.user_roles
        WHERE user_roles.user_id = auth.uid()
        AND user_roles.role = 'admin'
    )
);

-- All authenticated users can view the team data (so chatbot can access it)
CREATE POLICY "Authenticated users can view chatbot team data"
ON public.chatbot_team_data
FOR SELECT
USING (auth.role() = 'authenticated');

-- Create storage bucket for chatbot avatars
INSERT INTO storage.buckets (id, name, public) 
VALUES ('chatbot-avatars', 'chatbot-avatars', true)
ON CONFLICT (id) DO NOTHING;

-- Policy for public read access to avatars
CREATE POLICY "Anyone can view chatbot avatars"
ON storage.objects
FOR SELECT
USING (bucket_id = 'chatbot-avatars');

-- Policy for admins to upload avatars
CREATE POLICY "Admins can upload chatbot avatars"
ON storage.objects
FOR INSERT
WITH CHECK (
    bucket_id = 'chatbot-avatars' 
    AND EXISTS (
        SELECT 1 FROM public.user_roles
        WHERE user_roles.user_id = auth.uid()
        AND user_roles.role = 'admin'
    )
);

-- Policy for admins to update avatars
CREATE POLICY "Admins can update chatbot avatars"
ON storage.objects
FOR UPDATE
USING (
    bucket_id = 'chatbot-avatars' 
    AND EXISTS (
        SELECT 1 FROM public.user_roles
        WHERE user_roles.user_id = auth.uid()
        AND user_roles.role = 'admin'
    )
);

-- Policy for admins to delete avatars
CREATE POLICY "Admins can delete chatbot avatars"
ON storage.objects
FOR DELETE
USING (
    bucket_id = 'chatbot-avatars' 
    AND EXISTS (
        SELECT 1 FROM public.user_roles
        WHERE user_roles.user_id = auth.uid()
        AND user_roles.role = 'admin'
    )
);