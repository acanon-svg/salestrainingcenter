
-- Add AI-related columns to courses table
ALTER TABLE public.courses 
  ADD COLUMN IF NOT EXISTS is_ai_generated boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS ai_generation_trigger text,
  ADD COLUMN IF NOT EXISTS ai_analysis text,
  ADD COLUMN IF NOT EXISTS ai_metadata jsonb;

-- Add 'rejected' to the possible status values if not already present
-- We'll use a text check instead since course_status is an enum
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'rejected' AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'course_status')) THEN
    ALTER TYPE public.course_status ADD VALUE 'rejected';
  END IF;
END $$;
