-- Allow analista to view all profiles (needed for reports)
CREATE POLICY "Analistas can view all profiles"
ON public.profiles
FOR SELECT
USING (has_role(auth.uid(), 'analista'::app_role));

-- Allow analista to view all course enrollments (needed for reports)
CREATE POLICY "Analistas can view all enrollments"
ON public.course_enrollments
FOR SELECT
USING (has_role(auth.uid(), 'analista'::app_role));

-- Allow analista to view all quiz attempts (needed for reports)
CREATE POLICY "Analistas can view all quiz attempts"
ON public.quiz_attempts
FOR SELECT
USING (has_role(auth.uid(), 'analista'::app_role));

-- Allow analista to view all courses (needed for reports)
CREATE POLICY "Analistas can view all courses"
ON public.courses
FOR SELECT
USING (has_role(auth.uid(), 'analista'::app_role));

-- Allow analista to view regionals data
CREATE POLICY "Analistas can view regionals"
ON public.field_accompaniments
FOR SELECT
USING (has_role(auth.uid(), 'analista'::app_role));