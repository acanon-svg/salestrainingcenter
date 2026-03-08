import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { topUsers } = await req.json();
    if (!topUsers || !Array.isArray(topUsers)) throw new Error("topUsers required");

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const summary = topUsers.map((u: any, i: number) =>
      `#${i + 1} ${u.name}: ${u.compositeScore} pts compuestos (${u.completedCourses} cursos, ${u.avgQuiz}% quiz, ${u.badges} insignias)`
    ).join("\n");

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
            content: "Eres un analista de ranking de entrenamiento corporativo. Analiza el top 5 y genera insights competitivos en español. Responde SOLO con la herramienta proporcionada."
          },
          {
            role: "user",
            content: `Analiza este ranking de entrenamiento:\n${summary}`
          }
        ],
        tools: [{
          type: "function",
          function: {
            name: "analyze_ranking",
            description: "Analyze ranking data and return structured insights",
            parameters: {
              type: "object",
              properties: {
                leaderInsight: { type: "string", description: "Insight sobre el líder del ranking" },
                competitionNote: { type: "string", description: "Nota sobre la competencia y brechas" },
                risingStars: {
                  type: "array",
                  items: { type: "string" },
                  description: "Nombres de usuarios con potencial de subir"
                },
                teamTrend: { type: "string", description: "Tendencia general del equipo" },
                personalTip: { type: "string", description: "Consejo para mejorar en el ranking" }
              },
              required: ["leaderInsight", "competitionNote", "risingStars", "teamTrend", "personalTip"]
            }
          }
        }],
        tool_choice: { type: "function", function: { name: "analyze_ranking" } },
      }),
    });

    if (!aiResponse.ok) {
      const status = aiResponse.status;
      if (status === 429) {
        return new Response(JSON.stringify({ error: "Límite de solicitudes excedido." }), {
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
    if (!toolCall) throw new Error("No tool call in AI response");

    const result = JSON.parse(toolCall.function.arguments);

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
