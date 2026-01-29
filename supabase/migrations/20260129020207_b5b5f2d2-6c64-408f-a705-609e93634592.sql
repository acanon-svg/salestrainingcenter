-- Allow creators and admins to delete notifications
CREATE POLICY "Creators can delete notifications" 
ON public.notifications 
FOR DELETE 
USING (has_role(auth.uid(), 'creator'::app_role) OR has_role(auth.uid(), 'admin'::app_role));

-- Allow users to delete their own notifications
CREATE POLICY "Users can delete own notifications" 
ON public.notifications 
FOR DELETE 
USING (user_id = auth.uid());