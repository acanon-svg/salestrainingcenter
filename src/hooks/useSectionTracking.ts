import { useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

// Map routes to section keys and labels
const SECTION_MAP: Record<string, { key: string; label: string }> = {
  "/dashboard": { key: "dashboard", label: "Dashboard" },
  "/courses": { key: "courses", label: "Mis Cursos" },
  "/materials": { key: "training_materials", label: "Material Formativo" },
  "/personalized-training": { key: "personalized_training", label: "Mi Plan IA" },
  "/tools": { key: "tools", label: "Herramientas" },
  "/results": { key: "results", label: "Resultados" },
  "/ranking": { key: "ranking", label: "Ranking" },
  "/badges": { key: "badges", label: "Insignias" },
  "/followups": { key: "followups", label: "Seguimientos" },
  "/notifications": { key: "notifications", label: "Notificaciones" },
  "/feedback": { key: "feedback", label: "Feedback" },
  "/ai-courses": { key: "ai_courses", label: "Cursos IA" },
  "/courses/create": { key: "create_course", label: "Crear Curso" },
  "/my-courses": { key: "my_courses", label: "Mis Creaciones" },
  "/announcements": { key: "announcements", label: "Anuncios" },
  "/team": { key: "team", label: "Mi Equipo" },
  "/reports": { key: "reports", label: "Reportes" },
  "/team-feedback-forms": { key: "team_feedback_forms", label: "Feedbacks al Equipo" },
  "/team-feedback": { key: "team_feedback", label: "Feedback del Equipo" },
  "/profile": { key: "profile", label: "Mi Perfil" },
};

function resolveSection(pathname: string): { key: string; label: string } | null {
  // Direct match first
  if (SECTION_MAP[pathname]) return SECTION_MAP[pathname];

  // Course detail pages
  if (/^\/courses\/[^/]+$/.test(pathname) && pathname !== "/courses/create") {
    return { key: "course_detail", label: "Detalle de Curso" };
  }
  // Course edit
  if (/^\/courses\/[^/]+\/edit$/.test(pathname)) {
    return { key: "course_edit", label: "Editar Curso" };
  }
  // Material detail
  if (/^\/materials\/[^/]+$/.test(pathname)) {
    return { key: "material_detail", label: "Detalle de Material" };
  }

  return null;
}

export const useSectionTracking = () => {
  const location = useLocation();
  const { user } = useAuth();
  const visitIdRef = useRef<string | null>(null);
  const startTimeRef = useRef<number>(Date.now());

  useEffect(() => {
    if (!user?.id) return;

    const section = resolveSection(location.pathname);
    if (!section) return;

    // Record the start time for duration
    startTimeRef.current = Date.now();
    visitIdRef.current = null;

    // Insert visit record
    const insertVisit = async () => {
      const { data, error } = await supabase
        .from("section_visits")
        .insert({
          user_id: user.id,
          section_key: section.key,
          section_label: section.label,
        })
        .select("id")
        .single();

      if (!error && data) {
        visitIdRef.current = data.id;
      }
    };

    insertVisit();

    // Update duration on cleanup (navigation away)
    return () => {
      const visitId = visitIdRef.current;
      if (visitId) {
        const durationSeconds = Math.round((Date.now() - startTimeRef.current) / 1000);
        // Fire-and-forget update
        supabase
          .from("section_visits")
          .update({ duration_seconds: durationSeconds })
          .eq("id", visitId)
          .then(() => {});
      }
    };
  }, [location.pathname, user?.id]);
};
