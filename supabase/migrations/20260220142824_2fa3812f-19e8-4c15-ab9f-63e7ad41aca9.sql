-- Allow leaders, creators, and admins to enroll other users in courses (for course recommendations)
CREATE POLICY "Leaders can enroll team members"
ON public.course_enrollments
FOR INSERT
WITH CHECK (
  has_role(auth.uid(), 'lider'::app_role) OR
  has_role(auth.uid(), 'creator'::app_role) OR
  has_role(auth.uid(), 'admin'::app_role)
);