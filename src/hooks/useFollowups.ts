import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

// Types
export interface FollowupAccompaniment {
  id: string;
  timestamp: string;
  evaluator_email: string;
  regional: string;
  executive_name: string;
  executive_email: string;
  craft_negociacion: string | null;
  craft_manejo_objeciones: string | null;
  craft_persuasion: string | null;
  craft_herramientas: string | null;
  craft_conocimiento_productos: string | null;
  comp_abordaje: number | null;
  comp_pitch_comercial: number | null;
  comp_claridad_negociacion: number | null;
  comp_conocimiento_confianza: number | null;
  comp_objeciones_cierre: number | null;
  comp_optimiza_zona: number | null;
  necesidades_identificadas: string | null;
  oportunidades_entrenamiento: string | null;
  observaciones: string | null;
  fecha_nuevo_acompanamiento: string | null;
  evidencia_url: string | null;
}

export interface FollowupUniversalFeedback {
  id: string;
  timestamp: string;
  leader_email: string;
  team: string | null;
  regional: string;
  executive_name: string;
  executive_email: string;
  feedback_date: string | null;
  feedback_type: string;
  hecho_observado: string | null;
  regla_metrica: string | null;
  impacto_incumplimiento: string | null;
  expectativa_clara: string | null;
  plan_apoyo: string | null;
  compromiso_colega: string | null;
  consecuencia: string | null;
  proxima_fecha_revision: string | null;
  duracion_plan: string | null;
  diagnostico_desempeno: string | null;
  objetivo_metrica_exito: string | null;
  plan_accion_semanas: string | null;
  seguimiento_reuniones: string | null;
  evaluacion_final: string | null;
  conclusiones_plan: string | null;
  acciones_resaltar: string | null;
  regla_metrica_seguimiento: string | null;
  impacto_seguimiento: string | null;
  expectativa_seguimiento: string | null;
  plan_apoyo_seguimiento: string | null;
  compromiso_seguimiento: string | null;
  consecuencia_seguimiento: string | null;
  proxima_fecha_feedback: string | null;
  oportunidades_trabajar: string | null;
}

export interface FollowupQualityEvaluation {
  id: string;
  timestamp: string;
  score: string | null;
  score_numeric: number | null;
  info_comercial_correcta: boolean | null;
  formatos_slug_correctos: boolean | null;
  flujo_salesforce_correcto: boolean | null;
  bot_actualizacion_correos: boolean | null;
  valida_duplicidad_sf: boolean | null;
  documentos_completos: boolean | null;
  red_social_correcta: boolean | null;
  fotos_correctas_primer_intento: boolean | null;
  cumple_requisitos_activacion: boolean | null;
  gestion_tyc_oportuna: boolean | null;
  calificacion_aliados: string | null;
  hunter_name: string;
  hunter_email: string;
  leader_email: string | null;
  recomendacion_compromisos: string | null;
  slug_monitoreado: string | null;
  slug_monitoreado_2: string | null;
  evaluation_date: string | null;
}

const getClient = () => supabase as any;

export const useAccompaniments = () => {
  const { user, profile } = useAuth();
  return useQuery({
    queryKey: ["followup-accompaniments", user?.id],
    queryFn: async () => {
      const { data, error } = await getClient()
        .from("followup_accompaniments")
        .select("*")
        .order("timestamp", { ascending: true });
      if (error) throw error;
      return (data || []) as FollowupAccompaniment[];
    },
    enabled: !!user?.id,
    refetchInterval: 60000,
  });
};

export const useUniversalFeedback = () => {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["followup-universal-feedback", user?.id],
    queryFn: async () => {
      const { data, error } = await getClient()
        .from("followup_universal_feedback")
        .select("*")
        .order("timestamp", { ascending: true });
      if (error) throw error;
      return (data || []) as FollowupUniversalFeedback[];
    },
    enabled: !!user?.id,
    refetchInterval: 60000,
  });
};

export const useQualityEvaluations = () => {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["followup-quality-evaluations", user?.id],
    queryFn: async () => {
      const { data, error } = await getClient()
        .from("followup_quality_evaluations")
        .select("*")
        .order("timestamp", { ascending: true });
      if (error) throw error;
      return (data || []) as FollowupQualityEvaluation[];
    },
    enabled: !!user?.id,
    refetchInterval: 60000,
  });
};

export const useSyncFollowups = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (sheets?: string[]) => {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await supabase.functions.invoke("sync-followups", {
        body: sheets ? { sheets } : {},
      });
      if (res.error) throw res.error;
      return res.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["followup-accompaniments"] });
      queryClient.invalidateQueries({ queryKey: ["followup-universal-feedback"] });
      queryClient.invalidateQueries({ queryKey: ["followup-quality-evaluations"] });
      toast({
        title: "Sincronización completada",
        description: "Los datos de seguimiento han sido actualizados.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error de sincronización",
        description: error.message,
        variant: "destructive",
      });
    },
  });
};
