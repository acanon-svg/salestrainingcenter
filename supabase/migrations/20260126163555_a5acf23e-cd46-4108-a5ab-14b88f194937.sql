-- Add 'lider' to the app_role enum
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'lider';

-- Create table to track leader-region assignments
CREATE TABLE public.leader_regions (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    regional text NOT NULL,
    assigned_by uuid REFERENCES auth.users(id),
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    updated_at timestamp with time zone NOT NULL DEFAULT now(),
    UNIQUE (user_id)
);

-- Enable RLS
ALTER TABLE public.leader_regions ENABLE ROW LEVEL SECURITY;

-- Admins can manage leader regions
CREATE POLICY "Admins can manage leader regions"
ON public.leader_regions
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

-- Leaders can view their own assignment
CREATE POLICY "Leaders can view own region"
ON public.leader_regions
FOR SELECT
USING (user_id = auth.uid());

-- Create trigger for updated_at
CREATE TRIGGER update_leader_regions_updated_at
BEFORE UPDATE ON public.leader_regions
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Update RLS policies to allow leaders to view data from their region

-- Leaders can view profiles from their region
CREATE POLICY "Leaders can view regional profiles"
ON public.profiles
FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM public.leader_regions lr
        WHERE lr.user_id = auth.uid()
        AND lr.regional = profiles.regional
    )
);

-- Leaders can view course enrollments from their regional users
CREATE POLICY "Leaders can view regional enrollments"
ON public.course_enrollments
FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM public.leader_regions lr
        JOIN public.profiles p ON p.regional = lr.regional
        WHERE lr.user_id = auth.uid()
        AND p.user_id = course_enrollments.user_id
    )
);

-- Leaders can view field accompaniments from their region
CREATE POLICY "Leaders can view regional accompaniments"
ON public.field_accompaniments
FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM public.leader_regions lr
        WHERE lr.user_id = auth.uid()
        AND lr.regional = field_accompaniments.regional
    )
);

-- Leaders can view quiz attempts from their regional users
CREATE POLICY "Leaders can view regional quiz attempts"
ON public.quiz_attempts
FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM public.leader_regions lr
        JOIN public.profiles p ON p.regional = lr.regional
        WHERE lr.user_id = auth.uid()
        AND p.user_id = quiz_attempts.user_id
    )
);