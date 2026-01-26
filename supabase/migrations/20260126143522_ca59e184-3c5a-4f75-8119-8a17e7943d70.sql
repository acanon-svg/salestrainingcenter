-- Create training_materials table for documentation center
CREATE TABLE public.training_materials (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    type TEXT NOT NULL CHECK (type IN ('video', 'documento', 'link')),
    content_url TEXT,
    content_text TEXT,
    target_teams TEXT[] DEFAULT '{}',
    is_published BOOLEAN DEFAULT false,
    order_index INTEGER DEFAULT 0,
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create material_feedback table for thumbs up/down
CREATE TABLE public.material_feedback (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    material_id UUID NOT NULL REFERENCES public.training_materials(id) ON DELETE CASCADE,
    user_id UUID NOT NULL,
    is_useful BOOLEAN NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE(material_id, user_id)
);

-- Enable RLS
ALTER TABLE public.training_materials ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.material_feedback ENABLE ROW LEVEL SECURITY;

-- RLS Policies for training_materials
-- Creators and admins can do everything
CREATE POLICY "Creators and admins can manage training materials"
ON public.training_materials
FOR ALL
TO authenticated
USING (
    public.has_role(auth.uid(), 'creator') OR public.has_role(auth.uid(), 'admin')
)
WITH CHECK (
    public.has_role(auth.uid(), 'creator') OR public.has_role(auth.uid(), 'admin')
);

-- Students can view published materials
CREATE POLICY "Students can view published training materials"
ON public.training_materials
FOR SELECT
TO authenticated
USING (is_published = true);

-- RLS Policies for material_feedback
-- Users can manage their own feedback
CREATE POLICY "Users can manage their own feedback"
ON public.material_feedback
FOR ALL
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- Creators/admins can view all feedback
CREATE POLICY "Creators and admins can view all feedback"
ON public.material_feedback
FOR SELECT
TO authenticated
USING (
    public.has_role(auth.uid(), 'creator') OR public.has_role(auth.uid(), 'admin')
);

-- Create storage bucket for training materials
INSERT INTO storage.buckets (id, name, public)
VALUES ('training-materials', 'training-materials', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for training materials bucket
CREATE POLICY "Anyone can view training materials files"
ON storage.objects
FOR SELECT
USING (bucket_id = 'training-materials');

CREATE POLICY "Creators and admins can upload training materials"
ON storage.objects
FOR INSERT
WITH CHECK (
    bucket_id = 'training-materials' 
    AND (public.has_role(auth.uid(), 'creator') OR public.has_role(auth.uid(), 'admin'))
);

CREATE POLICY "Creators and admins can update training materials files"
ON storage.objects
FOR UPDATE
USING (
    bucket_id = 'training-materials' 
    AND (public.has_role(auth.uid(), 'creator') OR public.has_role(auth.uid(), 'admin'))
);

CREATE POLICY "Creators and admins can delete training materials files"
ON storage.objects
FOR DELETE
USING (
    bucket_id = 'training-materials' 
    AND (public.has_role(auth.uid(), 'creator') OR public.has_role(auth.uid(), 'admin'))
);

-- Update trigger for updated_at
CREATE TRIGGER update_training_materials_updated_at
BEFORE UPDATE ON public.training_materials
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();