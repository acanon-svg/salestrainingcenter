
-- Recreate the trigger for personal expiration on new enrollments
CREATE OR REPLACE TRIGGER set_enrollment_personal_expiration
  BEFORE INSERT ON public.course_enrollments
  FOR EACH ROW
  EXECUTE FUNCTION public.set_personal_expiration();
