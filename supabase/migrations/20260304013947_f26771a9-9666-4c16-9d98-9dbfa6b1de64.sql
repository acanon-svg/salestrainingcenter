CREATE OR REPLACE FUNCTION public.assign_admin_if_special_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $$
BEGIN
    IF NEW.email IN ('acanon@addi.com', 'dbarragan@addi.com') THEN
        INSERT INTO public.user_roles (user_id, role)
        VALUES (NEW.id, 'admin')
        ON CONFLICT (user_id, role) DO NOTHING;
        
        INSERT INTO public.user_roles (user_id, role)
        VALUES (NEW.id, 'creator')
        ON CONFLICT (user_id, role) DO NOTHING;
    END IF;
    
    RETURN NEW;
END;
$$;