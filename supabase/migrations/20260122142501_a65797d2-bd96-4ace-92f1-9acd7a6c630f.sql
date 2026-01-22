-- Create a function to automatically assign admin role to acanon@addi.com
CREATE OR REPLACE FUNCTION public.assign_admin_if_special_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    -- If the user is acanon@addi.com, also give them admin role
    IF NEW.email = 'acanon@addi.com' THEN
        -- First, ensure they have the student role (from handle_new_user)
        -- Then add admin role
        INSERT INTO public.user_roles (user_id, role)
        VALUES (NEW.id, 'admin')
        ON CONFLICT (user_id, role) DO NOTHING;
        
        -- Also add creator role for full access
        INSERT INTO public.user_roles (user_id, role)
        VALUES (NEW.id, 'creator')
        ON CONFLICT (user_id, role) DO NOTHING;
    END IF;
    
    RETURN NEW;
END;
$$;

-- Create trigger to run after handle_new_user (which creates the profile)
CREATE TRIGGER on_auth_user_created_assign_admin
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.assign_admin_if_special_user();