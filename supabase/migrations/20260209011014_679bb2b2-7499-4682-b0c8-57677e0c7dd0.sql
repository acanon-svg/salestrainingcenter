-- Add is_guaranteed column to profiles table
ALTER TABLE public.profiles 
ADD COLUMN is_guaranteed boolean NOT NULL DEFAULT false;

-- Add comment for documentation
COMMENT ON COLUMN public.profiles.is_guaranteed IS 'When true, the user receives 100% base commission regardless of actual results';