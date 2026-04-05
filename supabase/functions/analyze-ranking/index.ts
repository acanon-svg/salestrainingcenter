import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    // Authenticate the caller
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { topUsers } = await req.json();
    if (!topUsers || !Array.isArray(topUsers) || topUsers.length > 20) throw new Error("topUsers required (max 20)");

    const ANTHROPIC_API_KEY = Deno.env.get("ANTHROPIC_API_KEY");
    if (!ANTHROPIC_API_KEY) throw new Error("ANTHROPIC_API_KEY not configured");

    const summary = topUsers.map((u: any, i: number) =>
      `#${i + 1} ${u.name}: ${u.compositeScore} pts compuestos (${u.completedCourses} cursos, ${u.avgQuiz}% quiz, ${u.badges} insignias)`
    ).join("\n");

    const aiResponse = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 1024,
        system: "Eres un analista de ranking de entrenamiento corporativo. Analiza el top 5 y genera insights competitivos en español. Responde SOLO con la herramienta proporcionada.",
        messages: [{ role: "user", content: `Analiza este ranking de entrenamiento:\n${summary}` }],
        tools: [{
          name: "analyze_ranking",
          description: "Analyze ranking data and return structured insights",
          input_schema: {
            type: "object",
            properties: {
              leaderInsight: { type: "string", description: "Insight sobre el líder del ranking" },
              competitionNote: { type: "string", description: "Nota sobre la competencia y brechas" },
              risingStars: { type: "array", items: { type: "string" }, description: "Nombres de usuarios con potencial de subir" },
              teamTrend: { type: "string", description: "Tendencia general del equipo" },
              personalTip: { type: "string", description: "Consejo para mejorar en el ranking" }
            },
            required: ["leaderInsight", "competitionNote", "risingStars", "teamTrend", "personalTip"]
          }
        }],
        tool_choice: { type: "tool", name: "analyze_ranking" },
      }),
    });

    if (!aiResponse.ok) {
      const status = aiResponse.status;
      if (status === 429) {
        return new Response(JSON.stringify({ error: "Límite de solicitudes excedido." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
      }
      throw new Error(`Anthropic API error: ${status}`);
    }

    const aiData = await aiResponse.json();
    const toolUseBlock = aiData.content?.find((c: any) => c.type === "tool_use");
    if (!toolUseBlock) throw new Error("No tool use block in AI response");

    const result = toolUseBlock.input;

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Ranking analysis error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
