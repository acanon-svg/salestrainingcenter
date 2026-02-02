-- Add column to track if user has changed their password
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS password_changed boolean DEFAULT false;

-- Add column to track when password was last changed
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS password_changed_at timestamp with time zone;

-- Update RLS policy to allow users to update their own password_changed status
CREATE POLICY "Users can update their own password_changed status"
ON public.profiles
FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);