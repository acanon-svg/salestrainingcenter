import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const ANTHROPIC_API_KEY = Deno.env.get("ANTHROPIC_API_KEY");
    if (!ANTHROPIC_API_KEY) throw new Error("ANTHROPIC_API_KEY is not configured");

    const body = await req.json().catch(() => ({}));
    const trigger: string = body.trigger || "manual";

    // Use service role to read all data and insert courses
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    // Verify caller is admin/creator if manual trigger
    if (trigger === "manual") {
      const authHeader = req.headers.get("Authorization");
      if (authHeader) {
        const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
        const userClient = createClient(supabaseUrl, anonKey, {
          global: { headers: { Authorization: authHeader } },
        });
        const { data: { user } } = await userClient.auth.getUser();
        if (user) {
          const { data: roles } = await supabase
            .from("user_roles")
            .select("role")
            .eq("user_id", user.id);
          const userRoles = (roles || []).map((r: any) => r.role);
          if (!userRoles.includes("admin") && !userRoles.includes("creator")) {
            return new Response(JSON.stringify({ error: "No autorizado" }), {
              status: 403,
              headers: { ...corsHeaders, "Content-Type": "application/json" },
            });
          }
        }
      }
    }

    // 1. Fetch quiz attempts with quiz titles (last 500)
    const { data: quizAttempts } = await supabase
      .from("quiz_attempts")
      .select("score, passed, user_id, quizzes(title, passing_score, courses(title, dimension))")
      .order("completed_at", { ascending: false })
      .limit(500);

    // 2. Fetch course enrollments summary
    const { data: enrollments } = await supabase
      .from("course_enrollments")
      .select("status, progress_percentage, score, courses(title, dimension, difficulty)")
      .limit(500);

    // 3. Calculate weak topics
    const quizScores: Record<string, { total: number; count: number; courseName: string; dimension: string }> = {};
    for (const qa of (quizAttempts || [])) {
      const quizTitle = (qa as any).quizzes?.title || "Unknown";
      const courseName = (qa as any).quizzes?.courses?.title || "Unknown";
      const dimension = (qa as any).quizzes?.courses?.dimension || "entrenamiento";
      if (!quizScores[quizTitle]) {
        quizScores[quizTitle] = { total: 0, count: 0, courseName, dimension };
      }
      quizScores[quizTitle].total += qa.score;
      quizScores[quizTitle].count++;
    }

    const weakTopics = Object.entries(quizScores)
      .map(([topic, data]) => ({
        topic,
        avgScore: Math.round(data.total / data.count),
        courseName: data.courseName,
        dimension: data.dimension,
        attempts: data.count,
      }))
      .filter((t) => t.avgScore < 70)
      .sort((a, b) => a.avgScore - b.avgScore)
      .slice(0, 10);

    // 4. Calculate completion rates by dimension
    const dimensionStats: Record<string, { completed: number; total: number }> = {};
    for (const e of (enrollments || [])) {
      const dim = (e as any).courses?.dimension || "general";
      if (!dimensionStats[dim]) dimensionStats[dim] = { completed: 0, total: 0 };
      dimensionStats[dim].total++;
      if (e.status === "completed") dimensionStats[dim].completed++;
    }

    const analysisContext = `
TEMAS DÉBILES (quizzes con promedio < 70%):
${weakTopics.length > 0 ? weakTopics.map((t) => `- ${t.topic} (curso: ${t.courseName}): promedio ${t.avgScore}%, ${t.attempts} intentos, dimensión: ${t.dimension}`).join("\n") : "No se encontraron temas débiles significativos"}

TASAS DE COMPLETACIÓN POR DIMENSIÓN:
${Object.entries(dimensionStats).map(([dim, s]) => `- ${dim}: ${s.completed}/${s.total} completados (${s.total > 0 ? Math.round((s.completed / s.total) * 100) : 0}%)`).join("\n")}

ESTADÍSTICAS GENERALES:
- Total intentos de quiz analizados: ${(quizAttempts || []).length}
- Total inscripciones analizadas: ${(enrollments || []).length}
- Temas débiles identificados: ${weakTopics.length}
`;

    // 5. Call Anthropic Claude with tool calling
    const aiResponse = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-5",
        max_tokens: 4096,
        system: "Eres un diseñador instruccional experto en ventas. Analiza los datos de rendimiento y genera cursos que cubran las brechas identificadas. Responde siempre en español.",
        messages: [
          {
            role: "user",
            content: `Basándote en el siguiente análisis de rendimiento del equipo de ventas, genera exactamente 3 cursos nuevos que aborden las brechas de conocimiento identificadas.\n\n${analysisContext}`,
          },
        ],
        tools: [
          {
            name: "generate_courses",
            description: "Genera 3 cursos de entrenamiento basados en las brechas identificadas",
            input_schema: {
              type: "object",
              properties: {
                courses: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      title: { type: "string", description: "Título del curso" },
                      description: { type: "string", description: "Descripción detallada del curso (2-3 oraciones)" },
                      category: { type: "string", description: "Categoría: ventas, producto, procesos, habilidades_blandas" },
                      priority: { type: "string", enum: ["alta", "media"] },
                      target_audience: { type: "string", description: "Audiencia objetivo" },
                      learning_objectives: { type: "array", items: { type: "string" }, description: "3-5 objetivos de aprendizaje" },
                      suggested_modules: { type: "array", items: { type: "string" }, description: "3-5 módulos sugeridos" },
                      gap_addressed: { type: "string", description: "Brecha de conocimiento que aborda" },
                      expected_score_improvement: { type: "string", description: "Mejora esperada en scores" },
                      estimated_duration_minutes: { type: "number", description: "Duración estimada en minutos" },
                    },
                    required: ["title", "description", "category", "priority", "target_audience", "learning_objectives", "suggested_modules", "gap_addressed", "expected_score_improvement", "estimated_duration_minutes"],
                    additionalProperties: false,
                  },
                },
              },
              required: ["courses"],
              additionalProperties: false,
            },
          },
        ],
        tool_choice: { type: "tool", name: "generate_courses" },
      }),
    });

    if (!aiResponse.ok) {
      if (aiResponse.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit excedido. Intenta más tarde." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const errText = await aiResponse.text();
      console.error("Anthropic API error:", aiResponse.status, errText);
      throw new Error("Error al generar cursos con IA");
    }

    const aiData = await aiResponse.json();
    const toolUseBlock = aiData.content?.find((c: any) => c.type === "tool_use");
    if (!toolUseBlock) throw new Error("No tool use block in AI response");

    const { courses: generatedCourses } = toolUseBlock.input;

    // 6. Insert generated courses
    const insertedIds: string[] = [];
    for (const course of generatedCourses) {
      const { data: inserted, error: insertError } = await supabase
        .from("courses")
        .insert({
          title: course.title,
          description: course.description,
          status: "draft",
          is_ai_generated: true,
          ai_generation_trigger: trigger,
          ai_analysis: course.gap_addressed,
          ai_metadata: {
            category: course.category,
            priority: course.priority,
            target_audience: course.target_audience,
            learning_objectives: course.learning_objectives,
            suggested_modules: course.suggested_modules,
            gap_addressed: course.gap_addressed,
            expected_score_improvement: course.expected_score_improvement,
            estimated_duration_minutes: course.estimated_duration_minutes,
            generated_at: new Date().toISOString(),
            weak_topics_snapshot: weakTopics,
          },
          estimated_duration_minutes: course.estimated_duration_minutes,
          objectives: course.learning_objectives,
          target_audience: [course.target_audience],
        })
        .select("id")
        .single();

      if (insertError) {
        console.error("Insert error:", insertError);
        continue;
      }
      if (inserted) insertedIds.push(inserted.id);
    }

    // 7. Notify admins and creators
    const { data: adminUsers } = await supabase
      .from("user_roles")
      .select("user_id")
      .in("role", ["admin", "creator"]);

    if (adminUsers && adminUsers.length > 0) {
      const notifications = adminUsers.map((u: any) => ({
        user_id: u.user_id,
        type: "ai_course",
        title: "Nuevos cursos generados por IA",
        message: `Se generaron ${insertedIds.length} cursos basados en análisis de rendimiento. Revísalos en Cursos IA.`,
        related_id: insertedIds[0] || null,
      }));
      await supabase.from("notifications").insert(notifications);
    }

    return new Response(
      JSON.stringify({
        success: true,
        courses_generated: insertedIds.length,
        course_ids: insertedIds,
        analysis: { weak_topics: weakTopics, dimension_stats: dimensionStats },
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    console.error("generate-ai-courses error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Error desconocido" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
