-- Create table for field accompaniments (acompañamientos de campo)
CREATE TABLE public.field_accompaniments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    accompaniment_date DATE NOT NULL,
    
    -- People involved
    executive_name TEXT NOT NULL,
    executive_email TEXT,
    evaluator_name TEXT NOT NULL,
    evaluator_email TEXT,
    
    -- Location/Organization
    regional TEXT NOT NULL,
    team TEXT,
    
    -- Competency Scores (1-5 scale)
    product_knowledge_score INTEGER CHECK (product_knowledge_score BETWEEN 1 AND 5),
    sales_technique_score INTEGER CHECK (sales_technique_score BETWEEN 1 AND 5),
    tools_usage_score INTEGER CHECK (tools_usage_score BETWEEN 1 AND 5),
    soft_skills_score INTEGER CHECK (soft_skills_score BETWEEN 1 AND 5),
    
    -- Overall score (calculated average)
    overall_score NUMERIC(3,2) GENERATED ALWAYS AS (
        (COALESCE(product_knowledge_score, 0) + 
         COALESCE(sales_technique_score, 0) + 
         COALESCE(tools_usage_score, 0) + 
         COALESCE(soft_skills_score, 0)) / 4.0
    ) STORED,
    
    -- Qualitative feedback
    strengths TEXT,
    improvement_opportunities TEXT,
    action_plan TEXT,
    general_comments TEXT,
    
    -- Sync metadata
    google_sheets_row_id TEXT UNIQUE,
    synced_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.field_accompaniments ENABLE ROW LEVEL SECURITY;

-- Policy: Admins and creators can manage all accompaniments
CREATE POLICY "Admins and creators can manage accompaniments"
ON public.field_accompaniments
FOR ALL
USING (
    has_role(auth.uid(), 'admin'::app_role) OR 
    has_role(auth.uid(), 'creator'::app_role)
);

-- Policy: Users can view accompaniments for their regional
CREATE POLICY "Users can view regional accompaniments"
ON public.field_accompaniments
FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM public.profiles
        WHERE profiles.user_id = auth.uid()
        AND (
            profiles.regional = field_accompaniments.regional
            OR profiles.email = field_accompaniments.executive_email
        )
    )
);

-- Create indexes for performance
CREATE INDEX idx_field_accompaniments_regional ON public.field_accompaniments(regional);
CREATE INDEX idx_field_accompaniments_date ON public.field_accompaniments(accompaniment_date);
CREATE INDEX idx_field_accompaniments_executive ON public.field_accompaniments(executive_email);

-- Create a sync log table
CREATE TABLE public.sheets_sync_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sync_type TEXT NOT NULL,
    started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    completed_at TIMESTAMPTZ,
    rows_synced INTEGER DEFAULT 0,
    status TEXT DEFAULT 'running',
    error_message TEXT
);

-- Enable RLS for sync log
ALTER TABLE public.sheets_sync_log ENABLE ROW LEVEL SECURITY;

-- Only admins can view sync logs
CREATE POLICY "Admins can view sync logs"
ON public.sheets_sync_log
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));