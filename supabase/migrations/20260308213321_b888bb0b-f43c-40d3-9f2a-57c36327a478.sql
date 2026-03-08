
CREATE OR REPLACE FUNCTION public.set_personal_expiration()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
BEGIN
  IF NEW.personal_expires_at IS NULL THEN
    DECLARE
      course_expires timestamp with time zone;
    BEGIN
      SELECT expires_at INTO course_expires FROM public.courses WHERE id = NEW.course_id;
      
      IF course_expires IS NOT NULL AND course_expires < now() THEN
        NEW.personal_expires_at := public.add_business_days(now(), 20);
      END IF;
    END;
  END IF;
  
  RETURN NEW;
END;
$function$;
