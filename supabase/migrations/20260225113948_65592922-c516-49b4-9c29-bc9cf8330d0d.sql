-- Add personal expiration date per enrollment (10 business days from enrollment)
ALTER TABLE public.course_enrollments
ADD COLUMN IF NOT EXISTS personal_expires_at timestamp with time zone DEFAULT NULL;

-- Function to calculate 10 business days from a given date
CREATE OR REPLACE FUNCTION public.add_business_days(start_date timestamp with time zone, num_days integer)
RETURNS timestamp with time zone
LANGUAGE plpgsql
IMMUTABLE
SET search_path = 'public'
AS $$
DECLARE
  result_date timestamp with time zone := start_date;
  days_added integer := 0;
BEGIN
  WHILE days_added < num_days LOOP
    result_date := result_date + interval '1 day';
    -- Skip weekends (6=Saturday, 0=Sunday)
    IF EXTRACT(DOW FROM result_date) NOT IN (0, 6) THEN
      days_added := days_added + 1;
    END IF;
  END LOOP;
  RETURN result_date;
END;
$$;

-- Trigger to auto-set personal_expires_at on enrollment creation
CREATE OR REPLACE FUNCTION public.set_personal_expiration()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = 'public'
AS $$
BEGIN
  -- Only set if the course has an expires_at and it's already passed
  -- (meaning this is a late enrollment that deserves its own deadline)
  IF NEW.personal_expires_at IS NULL THEN
    DECLARE
      course_expires timestamp with time zone;
    BEGIN
      SELECT expires_at INTO course_expires FROM public.courses WHERE id = NEW.course_id;
      
      IF course_expires IS NOT NULL AND course_expires < now() THEN
        -- Course is already expired, give the new student 10 business days
        NEW.personal_expires_at := public.add_business_days(now(), 10);
      END IF;
    END;
  END IF;
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER set_enrollment_personal_expiration
BEFORE INSERT ON public.course_enrollments
FOR EACH ROW
EXECUTE FUNCTION public.set_personal_expiration();