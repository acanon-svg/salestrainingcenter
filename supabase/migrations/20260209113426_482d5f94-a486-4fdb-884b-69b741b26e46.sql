-- Fix overly permissive notifications INSERT policy
-- Drop the permissive policy that allows any authenticated user to insert notifications for anyone
DROP POLICY IF EXISTS "Authenticated users can create notifications" ON public.notifications;

-- Recreate with proper restrictions: only creators, admins, and leaders can create notifications
CREATE POLICY "Authorized roles can create notifications"
ON public.notifications
FOR INSERT
TO authenticated
WITH CHECK (
  has_role(auth.uid(), 'creator') OR 
  has_role(auth.uid(), 'admin') OR 
  has_role(auth.uid(), 'lider')
);