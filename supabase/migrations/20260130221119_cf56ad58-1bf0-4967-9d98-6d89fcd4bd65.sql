-- Allow creators and admins to delete course enrollments (for data reset)
CREATE POLICY "Creators can delete enrollments"
ON public.course_enrollments
FOR DELETE
USING (has_role(auth.uid(), 'creator'::app_role) OR has_role(auth.uid(), 'admin'::app_role));

-- Allow creators and admins to delete user_badges (for data reset)
CREATE POLICY "Creators can delete user badges"
ON public.user_badges
FOR DELETE
USING (has_role(auth.uid(), 'creator'::app_role) OR has_role(auth.uid(), 'admin'::app_role));

-- Allow creators and admins to update profiles (for resetting points)
CREATE POLICY "Creators can update profiles"
ON public.profiles
FOR UPDATE
USING (has_role(auth.uid(), 'creator'::app_role))
WITH CHECK (has_role(auth.uid(), 'creator'::app_role));