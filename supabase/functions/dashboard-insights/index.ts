import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header");

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) throw new Error("Not authenticated");

    // Check roles
    const { data: roles } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id);

    const userRoles = (roles || []).map((r: any) => r.role);
    const isManager = userRoles.some((r: string) => ["admin", "creator", "lider"].includes(r));

    // Fetch data based on role
    let enrollments: any[] = [];
    let quizAttempts: any[] = [];

    if (isManager) {
      // Get team data - leaders see regional data via RLS
      const { data: e } = await supabase
        .from("course_enrollments")
        .select("status, score, progress_percentage, courses(title)")
        .limit(500);
      enrollments = e || [];

      const { data: q } = await supabase
        .from("quiz_attempts")
        .select("score, passed, quiz_id")
        .limit(500);
      quizAttempts = q || [];
    } else {
      const { data: e } = await supabase
        .from("course_enrollments")
        .select("status, score, progress_percentage, courses(title)")
        .eq("user_id", user.id);
      enrollments = e || [];

      const { data: q } = await supabase
        .from("quiz_attempts")
        .select("score, passed, quiz_id")
        .eq("user_id", user.id);
      quizAttempts = q || [];
    }

    // Build context
    const totalEnrollments = enrollments.length;
    const completed = enrollments.filter((e: any) => e.status === "completed").length;
    const avgScore = quizAttempts.length > 0
      ? Math.round(quizAttempts.reduce((s: number, q: any) => s + (q.score || 0), 0) / quizAttempts.length)
      : 0;
    const passRate = quizAttempts.length > 0
      ? Math.round(quizAttempts.filter((q: any) => q.passed).length / quizAttempts.length * 100)
      : 0;
    const completionRate = totalEnrollments > 0 ? Math.round(completed / totalEnrollments * 100) : 0;

    const contextType = isManager ? "equipo/región" : "personal";
    const prompt = `Analiza estos datos de entrenamiento (${contextType}):
- Total inscripciones: ${totalEnrollments}
- Completados: ${completed} (${completionRate}%)
- Promedio quiz: ${avgScore}%
- Tasa aprobación: ${passRate}%
- En progreso: ${enrollments.filter((e: any) => e.status === "in_progress" || e.status === "enrolled").length}

Genera insights accionables en español.`;

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
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
            content: "Eres un analista de entrenamiento corporativo. Responde SOLO con la herramienta proporcionada."
          },
          { role: "user", content: prompt }
        ],
        tools: [{
          type: "function",
          function: {
            name: "generate_insights",
            description: "Generate dashboard insights from training data",
            parameters: {
              type: "object",
              properties: {
                teamHealthScore: { type: "number", description: "Overall health score 0-100" },
                insights: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      metric: { type: "string" },
                      value: { type: "string" },
                      trend: { type: "string", enum: ["up", "down", "neutral"] },
                      alert: { type: "boolean" },
                      description: { type: "string" }
                    },
                    required: ["metric", "value", "trend", "alert", "description"]
                  }
                },
                needsAttention: {
                  type: "array",
                  items: { type: "string" }
                },
                recommendation: { type: "string" }
              },
              required: ["teamHealthScore", "insights", "needsAttention", "recommendation"]
            }
          }
        }],
        tool_choice: { type: "function", function: { name: "generate_insights" } },
      }),
    });

    if (!aiResponse.ok) {
      const status = aiResponse.status;
      if (status === 429) {
        return new Response(JSON.stringify({ error: "Límite de solicitudes excedido. Intenta de nuevo en unos minutos." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
      }
      if (status === 402) {
        return new Response(JSON.stringify({ error: "Créditos de IA agotados." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
      }
      throw new Error(`AI gateway error: ${status}`);
    }

    const aiData = await aiResponse.json();
    const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall) throw new Error("No tool call in response");

    const result = JSON.parse(toolCall.function.arguments);

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Dashboard insights error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
