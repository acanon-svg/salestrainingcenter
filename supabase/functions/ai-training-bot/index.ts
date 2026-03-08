import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { messages } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    // Get user context from auth token
    const authHeader = req.headers.get("Authorization");
    let userContext = "";

    if (authHeader) {
      const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
      const supabaseKey = Deno.env.get("SUPABASE_ANON_KEY")!;
      const supabase = createClient(supabaseUrl, supabaseKey, {
        global: { headers: { Authorization: authHeader } },
      });

      const { data: { user } } = await supabase.auth.getUser();

      if (user) {
        // Fetch profile
        const { data: profile } = await supabase
          .from("profiles")
          .select("full_name, email, points, badges_count, team, regional, company_role")
          .eq("user_id", user.id)
          .single();

        // Fetch enrollments with course titles
        const { data: enrollments } = await supabase
          .from("course_enrollments")
          .select("status, progress_percentage, score, completed_at, courses(title)")
          .eq("user_id", user.id)
          .order("updated_at", { ascending: false })
          .limit(10);

        // Fetch quiz attempts
        const { data: quizAttempts } = await supabase
          .from("quiz_attempts")
          .select("score, passed, completed_at, quizzes(title)")
          .eq("user_id", user.id)
          .order("completed_at", { ascending: false })
          .limit(10);

        // Build context summary
        const enrollmentSummary = (enrollments || []).map((e: any) => {
          const title = e.courses?.title || "Sin título";
          return `- ${title}: ${e.status}, progreso ${e.progress_percentage}%${e.score != null ? `, nota ${e.score}` : ""}`;
        }).join("\n");

        const quizSummary = (quizAttempts || []).map((q: any) => {
          const title = q.quizzes?.title || "Sin título";
          return `- ${title}: ${q.passed ? "Aprobado" : "No aprobado"}, nota ${q.score}%`;
        }).join("\n");

        const completed = (enrollments || []).filter((e: any) => e.status === "completed").length;
        const inProgress = (enrollments || []).filter((e: any) => e.status !== "completed").length;

        userContext = `
CONTEXTO DEL USUARIO:
- Nombre: ${profile?.full_name || "No disponible"}
- Email: ${profile?.email || ""}
- Equipo: ${profile?.team || "No asignado"}
- Regional: ${profile?.regional || "No asignada"}
- Rol: ${profile?.company_role || "No asignado"}
- Puntos: ${profile?.points || 0}
- Insignias: ${profile?.badges_count || 0}
- Cursos completados: ${completed}, En progreso: ${inProgress}

CURSOS RECIENTES:
${enrollmentSummary || "Sin cursos registrados"}

ÚLTIMOS QUIZZES:
${quizSummary || "Sin intentos de quiz"}
`;
      }
    }

    const systemPrompt = `Eres el Asistente de Entrenamiento de ventas de Addi. Tu nombre es "Andy". Respondes SIEMPRE en español.

Tu rol es ayudar a los vendedores a mejorar su rendimiento, revisar su progreso en cursos, recomendar entrenamientos y dar tips de ventas.

Reglas:
- Sé conciso, amigable y motivador
- Usa emojis moderadamente para ser más cercano
- Si el usuario pregunta por su progreso, usa los datos de contexto proporcionados
- Si no tienes datos suficientes, sugiere al usuario explorar los cursos disponibles
- Da recomendaciones prácticas y accionables
- No inventes datos que no tengas

${userContext}`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          ...messages,
        ],
        stream: true,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Demasiadas solicitudes. Intenta de nuevo en un momento." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Se agotaron los créditos de IA. Contacta al administrador." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      return new Response(JSON.stringify({ error: "Error al conectar con la IA" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error("ai-training-bot error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Error desconocido" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
