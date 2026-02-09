-- Fix: Allow leaders to also insert notifications (needed for commission rejection flow)
DROP POLICY IF EXISTS "Creators can create notifications" ON public.notifications;

CREATE POLICY "Authenticated users can create notifications"
ON public.notifications
FOR INSERT
TO authenticated
WITH CHECK (true);