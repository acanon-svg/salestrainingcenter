
-- Fix feedback RLS: tighten SELECT policy to prevent exposure when recipient_id is null
DROP POLICY IF EXISTS "Users can view relevant feedback" ON public.feedback;

CREATE POLICY "Users can view relevant feedback"
ON public.feedback
FOR SELECT
USING (
  (sender_id = auth.uid())
  OR (recipient_id IS NOT NULL AND recipient_id = auth.uid())
  OR has_role(auth.uid(), 'admin'::app_role)
);
