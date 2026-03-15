import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header");

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("User not authenticated");

    // Fetch all user data in parallel
    const [profileRes, enrollmentsRes, quizRes, badgesRes, allCoursesRes] = await Promise.all([
      supabase.from("profiles").select("full_name, email, points, badges_count, team, regional, company_role").eq("user_id", user.id).single(),
      supabase.from("course_enrollments").select("status, progress_percentage, score, completed_at, course_id, courses(title, difficulty, dimension, points)").eq("user_id", user.id),
      supabase.from("quiz_attempts").select("score, passed, completed_at, quizzes(title, passing_score, courses(title))").eq("user_id", user.id).order("completed_at", { ascending: false }),
      supabase.from("user_badges").select("earned_at, badges(name, description, criteria_type)").eq("user_id", user.id),
      supabase.from("courses").select("id, title, difficulty, dimension, points, description, estimated_duration_minutes").eq("status", "published"),
    ]);

    const profile = profileRes.data;
    const enrollments = enrollmentsRes.data || [];
    const quizAttempts = quizRes.data || [];
    const userBadges = badgesRes.data || [];
    const allCourses = allCoursesRes.data || [];

    // Identify courses user is NOT enrolled in
    const enrolledCourseIds = new Set(enrollments.map((e: any) => e.course_id));
    const availableCourses = allCourses.filter((c: any) => !enrolledCourseIds.has(c.id));
    const inProgressCourses = enrollments.filter((e: any) => e.status !== "completed");

    const completed = enrollments.filter((e: any) => e.status === "completed");
    const avgQuizScore = quizAttempts.length > 0
      ? Math.round(quizAttempts.reduce((sum: number, q: any) => sum + q.score, 0) / quizAttempts.length)
      : 0;

    const enrollmentDetails = enrollments.map((e: any) => {
      const c = e.courses;
      return `- [ID: ${e.course_id}] ${c?.title || "Sin título"}: ${e.status}, progreso ${e.progress_percentage}%, dificultad ${c?.difficulty || "N/A"}, dimensión ${c?.dimension || "N/A"}${e.score != null ? `, nota ${e.score}` : ""}`;
    }).join("\n");

    const quizDetails = quizAttempts.slice(0, 15).map((q: any) => {
      return `- ${q.quizzes?.title || "Quiz"} (curso: ${q.quizzes?.courses?.title || "N/A"}): ${q.passed ? "Aprobado" : "No aprobado"}, nota ${q.score}%, mínimo requerido ${q.quizzes?.passing_score || 70}%`;
    }).join("\n");

    const badgeDetails = userBadges.map((b: any) => `- ${b.badges?.name}: ${b.badges?.description || ""}`).join("\n");

    const availableCoursesDetails = availableCourses.slice(0, 20).map((c: any) => {
      return `- [ID: ${c.id}] "${c.title}" (${c.difficulty}, ${c.dimension}, ${c.points} pts${c.estimated_duration_minutes ? `, ${c.estimated_duration_minutes} min` : ""})`;
    }).join("\n");

    const inProgressDetails = inProgressCourses.map((e: any) => {
      return `- [ID: ${e.course_id}] "${e.courses?.title}" progreso: ${e.progress_percentage}%`;
    }).join("\n");

    const prompt = `Analiza el siguiente perfil de un vendedor en entrenamiento y genera un plan de entrenamiento personalizado.

PERFIL:
- Nombre: ${profile?.full_name || "Usuario"}
- Equipo: ${profile?.team || "No asignado"}
- Regional: ${profile?.regional || "No asignada"}
- Puntos: ${profile?.points || 0}
- Insignias: ${profile?.badges_count || 0}
- Cursos completados: ${completed.length} de ${enrollments.length} total
- Promedio en quizzes: ${avgQuizScore}%

DETALLE DE CURSOS INSCRITOS:
${enrollmentDetails || "Sin cursos"}

CURSOS EN PROGRESO (sin completar):
${inProgressDetails || "Ninguno"}

CURSOS DISPONIBLES (NO inscritos):
${availableCoursesDetails || "Sin cursos disponibles"}

ÚLTIMOS QUIZZES:
${quizDetails || "Sin intentos"}

INSIGNIAS OBTENIDAS:
${badgeDetails || "Sin insignias"}

INSTRUCCIONES IMPORTANTES:
- Genera un plan de entrenamiento semanal personalizado con 5 acciones.
- CRÍTICO: Para cada acción que recomiende un curso, incluye el campo "courseId" con el ID exacto del curso (UUID). Usa los IDs de la lista de cursos disponibles o en progreso.
- Prioriza cursos donde el usuario tenga bajo rendimiento en quizzes o cursos que complementen sus debilidades.
- Si el usuario no está inscrito en un curso recomendado, usa el ID de la lista de "CURSOS DISPONIBLES" para que pueda inscribirse directamente.
- Si el usuario ya está inscrito pero no ha terminado, usa el ID de "CURSOS EN PROGRESO".`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          {
            role: "system",
            content: "Eres un coach de entrenamiento de ventas experto. Responde SIEMPRE en español. Analiza el progreso del vendedor y genera recomendaciones accionables. Siempre incluye courseId cuando recomiendes un curso específico."
          },
          { role: "user", content: prompt }
        ],
        tools: [{
          type: "function",
          function: {
            name: "generate_training_plan",
            description: "Genera un plan de entrenamiento personalizado basado en el perfil del usuario",
            parameters: {
              type: "object",
              properties: {
                summary: { type: "string", description: "Resumen breve del estado actual del usuario (2-3 oraciones)" },
                strengths: {
                  type: "array",
                  items: { type: "string" },
                  description: "Lista de 2-4 fortalezas identificadas"
                },
                improvements: {
                  type: "array",
                  items: { type: "string" },
                  description: "Lista de 2-4 áreas de mejora"
                },
                weeklyPlan: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      priority: { type: "string", enum: ["alta", "media", "baja"] },
                      action: { type: "string", description: "Acción concreta a realizar" },
                      reason: { type: "string", description: "Por qué es importante" },
                      estimatedTime: { type: "string", description: "Tiempo estimado, ej: 30 min, 1 hora" },
                      impact: { type: "string", description: "Impacto esperado" },
                      courseId: { type: "string", description: "UUID del curso relacionado. Obligatorio si la acción se refiere a un curso específico." }
                    },
                    required: ["priority", "action", "reason", "estimatedTime", "impact"],
                    additionalProperties: false
                  },
                  description: "5 acciones para la semana, cada una con courseId si aplica"
                },
                motivationalMessage: { type: "string", description: "Mensaje motivacional personalizado con emojis" }
              },
              required: ["summary", "strengths", "improvements", "weeklyPlan", "motivationalMessage"],
              additionalProperties: false
            }
          }
        }],
        tool_choice: { type: "function", function: { name: "generate_training_plan" } },
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Demasiadas solicitudes. Intenta en un momento." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Créditos de IA agotados." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("AI error:", response.status, t);
      throw new Error("Error al generar el plan");
    }

    const aiData = await response.json();
    const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall) throw new Error("No tool call in AI response");

    const plan = JSON.parse(toolCall.function.arguments);

    // Build a map of enrolled course IDs for the frontend
    const enrolledMap: Record<string, boolean> = {};
    enrollments.forEach((e: any) => { enrolledMap[e.course_id] = true; });

    const result = {
      plan,
      metrics: {
        totalCourses: enrollments.length,
        completedPercentage: enrollments.length > 0 ? Math.round((completed.length / enrollments.length) * 100) : 0,
        avgQuizScore,
        badgesCount: userBadges.length,
      },
      enrolledCourseIds: Object.keys(enrolledMap),
    };

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("generate-training-plan error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Error desconocido" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
