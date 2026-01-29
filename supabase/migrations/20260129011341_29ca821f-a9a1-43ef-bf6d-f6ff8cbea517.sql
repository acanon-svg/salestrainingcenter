-- Create table for leader hierarchy (leaders supervising other leaders)
CREATE TABLE public.leader_hierarchy (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    supervisor_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    subordinate_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    assigned_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE (supervisor_id, subordinate_id),
    CHECK (supervisor_id != subordinate_id)
);

-- Enable RLS
ALTER TABLE public.leader_hierarchy ENABLE ROW LEVEL SECURITY;

-- Create index for faster lookups
CREATE INDEX idx_leader_hierarchy_supervisor ON public.leader_hierarchy(supervisor_id);
CREATE INDEX idx_leader_hierarchy_subordinate ON public.leader_hierarchy(subordinate_id);

-- Policies for leader_hierarchy
-- Admins and creators can view all hierarchies
CREATE POLICY "Admins and creators can view all hierarchies"
ON public.leader_hierarchy
FOR SELECT
TO authenticated
USING (
    public.has_role(auth.uid(), 'admin') OR 
    public.has_role(auth.uid(), 'creator')
);

-- Leaders can see their own subordinates
CREATE POLICY "Leaders can view their subordinates"
ON public.leader_hierarchy
FOR SELECT
TO authenticated
USING (supervisor_id = auth.uid());

-- Admins and creators can insert hierarchies
CREATE POLICY "Admins and creators can insert hierarchies"
ON public.leader_hierarchy
FOR INSERT
TO authenticated
WITH CHECK (
    public.has_role(auth.uid(), 'admin') OR 
    public.has_role(auth.uid(), 'creator')
);

-- Admins and creators can update hierarchies
CREATE POLICY "Admins and creators can update hierarchies"
ON public.leader_hierarchy
FOR UPDATE
TO authenticated
USING (
    public.has_role(auth.uid(), 'admin') OR 
    public.has_role(auth.uid(), 'creator')
);

-- Admins and creators can delete hierarchies
CREATE POLICY "Admins and creators can delete hierarchies"
ON public.leader_hierarchy
FOR DELETE
TO authenticated
USING (
    public.has_role(auth.uid(), 'admin') OR 
    public.has_role(auth.uid(), 'creator')
);

-- Trigger for updated_at
CREATE TRIGGER update_leader_hierarchy_updated_at
BEFORE UPDATE ON public.leader_hierarchy
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();