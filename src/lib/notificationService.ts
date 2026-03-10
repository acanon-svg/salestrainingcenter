import { supabase } from "@/integrations/supabase/client";

export const NotificationService = {
  /**
   * Notifica al admin que un curso generado por IA está listo para revisión.
   */
  async courseReadyForReview(courseId: string, adminId: string, courseTitle: string, materialsCount: number, questionsCount: number) {
    const { error } = await supabase.from("notifications").insert({
      user_id: adminId,
      title: "📚 Nuevo curso listo para revisión",
      message: `El curso "${courseTitle}" (${materialsCount} módulos, ${questionsCount} preguntas) ha sido generado y está listo para tu revisión. Revísalo y publícalo cuando esté listo.`,
      type: "course_ready",
      related_id: courseId,
      is_read: false,
    });
    if (error) console.error("NotificationService.courseReadyForReview error:", error);
    return !error;
  },

  /**
   * Envía solicitud de curso al administrador desde un usuario no-admin.
   */
  async requestCourse(topic: string, segment: string, requestedBy: { id: string; fullName: string }) {
    // Find all admin/creator users
    const { data: adminRoles } = await supabase
      .from("user_roles")
      .select("user_id")
      .in("role", ["admin", "creator"]);

    const adminIds = [...new Set((adminRoles || []).map((r) => r.user_id))];

    const notifications = adminIds.map((adminId) => ({
      user_id: adminId,
      title: "📬 Solicitud de curso",
      message: `${requestedBy.fullName} del segmento ${segment || "no identificado"} solicita un curso sobre "${topic}". ¿Deseas crearlo?`,
      type: "course_request",
      related_id: null,
      is_read: false,
    }));

    if (notifications.length > 0) {
      const { error } = await supabase.from("notifications").insert(notifications);
      if (error) console.error("NotificationService.requestCourse error:", error);
      return !error;
    }
    return false;
  },

  /**
   * Envía una notificación genérica a un usuario.
   */
  async send(userId: string, title: string, message: string, type: string = "general", relatedId?: string) {
    const { error } = await supabase.from("notifications").insert({
      user_id: userId,
      title,
      message,
      type,
      related_id: relatedId || null,
      is_read: false,
    });
    if (error) console.error("NotificationService.send error:", error);
    return !error;
  },
};
