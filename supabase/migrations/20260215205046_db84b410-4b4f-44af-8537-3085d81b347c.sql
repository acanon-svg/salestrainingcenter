
-- Table for normalized accompaniment data (Sheet 1)
CREATE TABLE public.followup_accompaniments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  timestamp TIMESTAMPTZ NOT NULL,
  evaluator_email TEXT NOT NULL,
  regional TEXT NOT NULL,
  executive_name TEXT NOT NULL,
  executive_email TEXT NOT NULL,
  -- Crafts (stored as text like "A0", "A1", "A2", "A3", "A4")
  craft_negociacion TEXT,
  craft_manejo_objeciones TEXT,
  craft_persuasion TEXT,
  craft_herramientas TEXT,
  craft_conocimiento_productos TEXT,
  -- Competency scores (1-5)
  comp_abordaje INTEGER,
  comp_pitch_comercial INTEGER,
  comp_claridad_negociacion INTEGER,
  comp_conocimiento_confianza INTEGER,
  comp_objeciones_cierre INTEGER,
  comp_optimiza_zona INTEGER,
  -- Text fields
  necesidades_identificadas TEXT,
  oportunidades_entrenamiento TEXT,
  observaciones TEXT,
  fecha_nuevo_acompanamiento TEXT,
  evidencia_url TEXT,
  -- Metadata
  google_sheets_row_id TEXT,
  synced_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.followup_accompaniments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Students can view their own accompaniments"
ON public.followup_accompaniments FOR SELECT
USING (
  executive_email = (SELECT email FROM public.profiles WHERE user_id = auth.uid())
);

CREATE POLICY "Leaders can view accompaniments in their region"
ON public.followup_accompaniments FOR SELECT
USING (
  public.has_role(auth.uid(), 'lider') OR
  public.has_role(auth.uid(), 'creator') OR
  public.has_role(auth.uid(), 'admin')
);

CREATE POLICY "Service role can manage accompaniments"
ON public.followup_accompaniments FOR ALL
USING (true)
WITH CHECK (true);

-- Index for fast lookups
CREATE INDEX idx_followup_acc_executive_email ON public.followup_accompaniments(executive_email);
CREATE INDEX idx_followup_acc_regional ON public.followup_accompaniments(regional);
CREATE INDEX idx_followup_acc_timestamp ON public.followup_accompaniments(timestamp);

-- Table for normalized universal feedback data (Sheet 2)
CREATE TABLE public.followup_universal_feedback (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  timestamp TIMESTAMPTZ NOT NULL,
  leader_email TEXT NOT NULL,
  team TEXT,
  regional TEXT NOT NULL,
  executive_name TEXT NOT NULL,
  executive_email TEXT NOT NULL,
  feedback_date DATE,
  feedback_type TEXT NOT NULL, -- '1-1/Feedback recurrente', 'Feedback de Oportunidad', 'PDP', 'Seguimiento al PDP', 'Resultado del PDP'
  -- Feedback 1-1 / Oportunidad fields
  hecho_observado TEXT,
  regla_metrica TEXT,
  impacto_incumplimiento TEXT,
  expectativa_clara TEXT,
  plan_apoyo TEXT,
  compromiso_colega TEXT,
  consecuencia TEXT,
  proxima_fecha_revision TEXT,
  -- PDP fields
  duracion_plan TEXT,
  diagnostico_desempeno TEXT,
  objetivo_metrica_exito TEXT,
  plan_accion_semanas TEXT,
  seguimiento_reuniones TEXT,
  evaluacion_final TEXT,
  conclusiones_plan TEXT,
  acciones_resaltar TEXT,
  -- Seguimiento PDP fields (reuses some 1-1 fields)
  regla_metrica_seguimiento TEXT,
  impacto_seguimiento TEXT,
  expectativa_seguimiento TEXT,
  plan_apoyo_seguimiento TEXT,
  compromiso_seguimiento TEXT,
  consecuencia_seguimiento TEXT,
  proxima_fecha_feedback TEXT,
  oportunidades_trabajar TEXT,
  -- Metadata
  google_sheets_row_id TEXT,
  synced_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.followup_universal_feedback ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Students can view their own universal feedback"
ON public.followup_universal_feedback FOR SELECT
USING (
  executive_email = (SELECT email FROM public.profiles WHERE user_id = auth.uid())
);

CREATE POLICY "Leaders can view universal feedback"
ON public.followup_universal_feedback FOR SELECT
USING (
  public.has_role(auth.uid(), 'lider') OR
  public.has_role(auth.uid(), 'creator') OR
  public.has_role(auth.uid(), 'admin')
);

CREATE POLICY "Service role can manage universal feedback"
ON public.followup_universal_feedback FOR ALL
USING (true)
WITH CHECK (true);

CREATE INDEX idx_followup_uf_executive_email ON public.followup_universal_feedback(executive_email);
CREATE INDEX idx_followup_uf_regional ON public.followup_universal_feedback(regional);
CREATE INDEX idx_followup_uf_feedback_type ON public.followup_universal_feedback(feedback_type);
CREATE INDEX idx_followup_uf_timestamp ON public.followup_universal_feedback(timestamp);

-- Table for quality evaluations (Sheet 3)
CREATE TABLE public.followup_quality_evaluations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  timestamp TIMESTAMPTZ NOT NULL,
  score TEXT, -- "90 / 100" format
  score_numeric INTEGER, -- extracted numeric score
  -- Quality criteria (SI/NO)
  info_comercial_correcta BOOLEAN,
  formatos_slug_correctos BOOLEAN,
  flujo_salesforce_correcto BOOLEAN,
  bot_actualizacion_correos BOOLEAN,
  valida_duplicidad_sf BOOLEAN,
  documentos_completos BOOLEAN,
  red_social_correcta BOOLEAN,
  fotos_correctas_primer_intento BOOLEAN,
  cumple_requisitos_activacion BOOLEAN,
  gestion_tyc_oportuna BOOLEAN,
  calificacion_aliados TEXT, -- "10", etc.
  -- Hunter info
  hunter_name TEXT NOT NULL,
  hunter_email TEXT NOT NULL,
  leader_email TEXT,
  -- Feedback
  recomendacion_compromisos TEXT,
  slug_monitoreado TEXT,
  slug_monitoreado_2 TEXT,
  evaluation_date DATE,
  -- Metadata
  google_sheets_row_id TEXT,
  synced_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.followup_quality_evaluations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Students can view their own quality evaluations"
ON public.followup_quality_evaluations FOR SELECT
USING (
  hunter_email = (SELECT email FROM public.profiles WHERE user_id = auth.uid())
);

CREATE POLICY "Leaders can view quality evaluations"
ON public.followup_quality_evaluations FOR SELECT
USING (
  public.has_role(auth.uid(), 'lider') OR
  public.has_role(auth.uid(), 'creator') OR
  public.has_role(auth.uid(), 'admin')
);

CREATE POLICY "Service role can manage quality evaluations"
ON public.followup_quality_evaluations FOR ALL
USING (true)
WITH CHECK (true);

CREATE INDEX idx_followup_qe_hunter_email ON public.followup_quality_evaluations(hunter_email);
CREATE INDEX idx_followup_qe_timestamp ON public.followup_quality_evaluations(timestamp);
