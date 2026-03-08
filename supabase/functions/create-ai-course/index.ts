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

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    // Verify caller is admin/creator
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No autorizado");

    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user } } = await userClient.auth.getUser();
    if (!user) throw new Error("No autorizado");

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

    const { prompt } = await req.json();
    if (!prompt || typeof prompt !== "string") {
      throw new Error("Se requiere un prompt para generar el curso");
    }

    // Step 1: Generate course structure via AI
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
            content: `Eres un diseñador instruccional experto. Genera cursos de capacitación completos y estructurados basándote en el prompt del usuario. Los cursos deben ser prácticos, con objetivos claros y evaluaciones efectivas. Responde siempre en español.

REGLAS IMPORTANTES:
- Los materiales deben ser de tipo "documento" con contenido textual educativo rico y detallado
- Cada material debe tener al menos 3-4 párrafos de contenido educativo real
- El quiz debe tener entre 5 y 10 preguntas variadas (multiple_choice y true_false)
- Cada pregunta multiple_choice debe tener exactamente 4 opciones, una correcta
- Los puntos del curso deben ser entre 50 y 200
- La duración estimada debe ser razonable (15-120 minutos)`,
          },
          {
            role: "user",
            content: `Genera un curso completo basado en el siguiente prompt:\n\n${prompt}`,
          },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "create_course",
              description: "Crea un curso completo con todos sus componentes",
              parameters: {
                type: "object",
                properties: {
                  title: { type: "string", description: "Título del curso (máximo 80 caracteres)" },
                  description: { type: "string", description: "Descripción detallada del curso (2-4 oraciones)" },
                  dimension: {
                    type: "string",
                    enum: ["entrenamiento", "producto", "habilidades", "procesos", "herramientas", "cultura"],
                    description: "Dimensión del entrenamiento",
                  },
                  difficulty: {
                    type: "string",
                    enum: ["basico", "intermedio", "avanzado"],
                    description: "Nivel de dificultad",
                  },
                  points: { type: "number", description: "Puntos del curso (50-200)" },
                  estimated_duration_minutes: { type: "number", description: "Duración estimada en minutos" },
                  objectives: {
                    type: "array",
                    items: { type: "string" },
                    description: "3-5 objetivos de aprendizaje",
                  },
                  cover_image_prompt: {
                    type: "string",
                    description: "Prompt en inglés para generar la imagen de portada del curso. Debe ser descriptivo y profesional, orientado a educación corporativa.",
                  },
                  materials: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        title: { type: "string", description: "Título del material/módulo" },
                        content: { type: "string", description: "Contenido educativo completo del módulo (mínimo 3 párrafos con información detallada, ejemplos y consejos prácticos)" },
                      },
                      required: ["title", "content"],
                      additionalProperties: false,
                    },
                    description: "3-6 módulos/materiales del curso",
                  },
                  quiz_questions: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        question: { type: "string" },
                        question_type: { type: "string", enum: ["multiple_choice", "true_false"] },
                        points: { type: "number", description: "Puntos de la pregunta (5-20)" },
                        options: {
                          type: "array",
                          items: {
                            type: "object",
                            properties: {
                              text: { type: "string" },
                              is_correct: { type: "boolean" },
                            },
                            required: ["text", "is_correct"],
                            additionalProperties: false,
                          },
                        },
                      },
                      required: ["question", "question_type", "points", "options"],
                      additionalProperties: false,
                    },
                    description: "5-10 preguntas de evaluación",
                  },
                },
                required: ["title", "description", "dimension", "difficulty", "points", "estimated_duration_minutes", "objectives", "cover_image_prompt", "materials", "quiz_questions"],
                additionalProperties: false,
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "create_course" } },
      }),
    });

    if (!aiResponse.ok) {
      if (aiResponse.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit excedido. Intenta más tarde." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (aiResponse.status === 402) {
        return new Response(JSON.stringify({ error: "Créditos de IA agotados." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const errText = await aiResponse.text();
      console.error("AI error:", aiResponse.status, errText);
      throw new Error("Error al generar el curso con IA");
    }

    const aiData = await aiResponse.json();
    const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall) throw new Error("No se recibió respuesta estructurada de la IA");

    const courseContent = JSON.parse(toolCall.function.arguments);

    // Step 2: Generate cover image
    let coverImageUrl: string | null = null;
    try {
      const imageResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash-image",
          messages: [
            {
              role: "user",
              content: `Create a professional, modern course cover image: ${courseContent.cover_image_prompt}. Style: clean corporate training design, vibrant colors, no text overlay.`,
            },
          ],
          modalities: ["image", "text"],
        }),
      });

      if (imageResponse.ok) {
        const imageData = await imageResponse.json();
        const base64Image = imageData.choices?.[0]?.message?.images?.[0]?.image_url?.url;

        if (base64Image) {
          // Upload to storage
          const base64Data = base64Image.replace(/^data:image\/\w+;base64,/, "");
          const imageBytes = Uint8Array.from(atob(base64Data), (c) => c.charCodeAt(0));
          const fileName = `ai-generated-${Date.now()}.png`;

          const { error: uploadError } = await supabase.storage
            .from("course-covers")
            .upload(fileName, imageBytes, { contentType: "image/png", upsert: true });

          if (!uploadError) {
            const { data: urlData } = supabase.storage.from("course-covers").getPublicUrl(fileName);
            coverImageUrl = urlData.publicUrl;
          }
        }
      }
    } catch (imgErr) {
      console.warn("Cover image generation failed, continuing without:", imgErr);
    }

    // Step 3: Insert course
    const { data: course, error: courseError } = await supabase
      .from("courses")
      .insert({
        title: courseContent.title,
        description: courseContent.description,
        dimension: courseContent.dimension,
        difficulty: courseContent.difficulty,
        points: courseContent.points,
        estimated_duration_minutes: courseContent.estimated_duration_minutes,
        objectives: courseContent.objectives,
        cover_image_url: coverImageUrl,
        status: "draft",
        created_by: user.id,
        language: "es",
        time_limit_minutes: 60,
        is_ai_generated: true,
        ai_metadata: {
          source_prompt: prompt,
          generated_at: new Date().toISOString(),
        },
      })
      .select()
      .single();

    if (courseError) throw courseError;

    // Step 4: Insert materials
    if (courseContent.materials?.length > 0) {
      const materialsToInsert = courseContent.materials.map((m: any, idx: number) => ({
        course_id: course.id,
        title: m.title,
        type: "documento",
        content_text: m.content,
        content_url: null,
        order_index: idx,
        is_required: true,
      }));

      const { error: matError } = await supabase.from("course_materials").insert(materialsToInsert);
      if (matError) console.error("Materials insert error:", matError);
    }

    // Step 5: Insert quiz
    if (courseContent.quiz_questions?.length > 0) {
      const { data: quiz, error: quizError } = await supabase
        .from("quizzes")
        .insert({
          course_id: course.id,
          title: `Quiz: ${courseContent.title}`,
          description: "Evaluación generada automáticamente",
          passing_score: 70,
          order_index: 0,
        })
        .select()
        .single();

      if (!quizError && quiz) {
        const questionsToInsert = courseContent.quiz_questions.map((q: any, idx: number) => ({
          quiz_id: quiz.id,
          question: q.question,
          question_type: q.question_type,
          options: q.options,
          points: q.points || 10,
          order_index: idx,
        }));

        const { error: qError } = await supabase.from("quiz_questions").insert(questionsToInsert);
        if (qError) console.error("Quiz questions insert error:", qError);
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        course_id: course.id,
        title: courseContent.title,
        materials_count: courseContent.materials?.length || 0,
        questions_count: courseContent.quiz_questions?.length || 0,
        has_cover_image: !!coverImageUrl,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    console.error("create-ai-course error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Error desconocido" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
