import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// --- Helper: Call Anthropic Claude ---
async function callClaude(apiKey: string, systemPrompt: string, userPrompt: string, tools?: any[], toolChoice?: any) {
  const body: any = {
    model: "claude-sonnet-4-20250514",
    max_tokens: 16000,
    system: systemPrompt,
    messages: [{ role: "user", content: userPrompt }],
  };
  if (tools) body.tools = tools;
  if (toolChoice) body.tool_choice = toolChoice;

  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
      "content-type": "application/json",
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const errText = await res.text();
    console.error("Claude API error:", res.status, errText);
    if (res.status === 429) throw new Error("RATE_LIMIT");
    if (res.status === 402 || res.status === 400) throw new Error("CREDITS_EXHAUSTED");
    throw new Error(`Claude API error (${res.status})`);
  }
  return await res.json();
}

// --- Helper: Research topic using Claude's knowledge ---
async function searchWebWithLovable(lovableKey: string, query: string): Promise<string> {
  try {
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": lovableKey,
        "anthropic-version": "2023-06-01",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 2048,
        system: "Eres un investigador experto en capacitación comercial. Proporciona información detallada, ejemplos reales, técnicas probadas y mejores prácticas. Responde siempre en español con información estructurada y accionable.",
        messages: [
          {
            role: "user",
            content: `Investiga a fondo sobre el siguiente tema para crear un curso de capacitación corporativa. Incluye técnicas, ejemplos reales, estadísticas relevantes y mejores prácticas:\n\n${query}`,
          },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "web_search",
              description: "Search the web for information",
              parameters: {
                type: "object",
                properties: { query: { type: "string" } },
                required: ["query"],
              },
            },
          },
        ],
      }),
    });

    if (!res.ok) {
      console.warn("Web search failed, continuing without:", res.status);
      return "";
    }

    const data = await res.json();
    return data.content?.find((c: any) => c.type === "text")?.text || "";
  } catch (err) {
    console.warn("Web search error, continuing without:", err);
    return "";
  }
}

// --- Helper: Generate cover image (placeholder - returns null, cover can be set manually) ---
async function generateCoverImage(_apiKey: string, _supabase: any, _imagePrompt: string): Promise<string | null> {
  // Cover image generation via AI image models not available in this version
  // Admins can upload a cover image manually from the course editor
  return null;
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const ANTHROPIC_API_KEY = Deno.env.get("ANTHROPIC_API_KEY");
    if (!ANTHROPIC_API_KEY) {
      return new Response(
        JSON.stringify({ error: "Anthropic API key no configurada. Agrégala en los secretos del proyecto." }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
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
        status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { prompt, provided_materials, single_module_mode } = await req.json();
    if (!prompt || typeof prompt !== "string") {
      throw new Error("Se requiere un prompt para generar el curso");
    }

    // --- SINGLE MODULE MODE: Generate content for one module only ---
    if (single_module_mode) {
      console.log("Single module mode - generating content for:", prompt.substring(0, 80));

      let webContext = "";
      if (LOVABLE_API_KEY) {
        webContext = await searchWebWithLovable(LOVABLE_API_KEY, prompt);
      }

      const claudeRes = await callClaude(
        ANTHROPIC_API_KEY,
        `Eres un diseñador instruccional experto especializado en capacitación comercial y ventas. Genera contenido educativo de alta calidad en HTML puro (sin markdown). El contenido debe tener mínimo 1200 palabras, ser práctico y orientado a ventas de Addi (fintech de crédito digital en Colombia). Usa etiquetas HTML: <h2>, <h3>, <p>, <ul>, <li>, <ol>, <strong>, <em>, <blockquote>, <table>, <tr>, <td>, <th>. Incluye ejemplos prácticos reales, tips accionables, casos de uso y datos concretos. Responde SOLO con el HTML del contenido, sin explicaciones adicionales.`,
        `Genera el contenido educativo completo para un módulo sobre:\n\n${prompt}${webContext ? `\n\n=== INFORMACIÓN DE FUENTES EXTERNAS ===\n${webContext}` : ""}`
      );

      const content = claudeRes.content?.[0]?.text || "";
      return new Response(
        JSON.stringify({ success: true, content }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // --- FULL COURSE GENERATION ---

    // Build user-provided materials context
    let materialsContext = "";
    if (provided_materials && Array.isArray(provided_materials) && provided_materials.length > 0) {
      materialsContext = "\n\n=== MATERIALES PROPORCIONADOS POR EL USUARIO ===\n";
      for (const mat of provided_materials) {
        materialsContext += `\n--- ${mat.title || "Material"} (${mat.type === "url" ? "URL: " + mat.content : "Texto"}) ---\n`;
        materialsContext += mat.type === "text" ? mat.content + "\n" : `Referencia URL: ${mat.content}\n`;
      }
      materialsContext += "\n=== FIN DE MATERIALES ===\n";
    }

    console.log("=== STEP 1: Web search for sources ===");
    let webResearchContext = "";
    if (LOVABLE_API_KEY) {
      webResearchContext = await searchWebWithLovable(LOVABLE_API_KEY, prompt);
      console.log("Web research completed, length:", webResearchContext.length);
    } else {
      console.warn("LOVABLE_API_KEY not available, skipping web search");
    }

    // --- STEP 2: Generate course structure with Claude ---
    console.log("=== STEP 2: Generating course structure with Claude ===");

    const structureTools = [
      {
        name: "create_course",
        description: "Crea la estructura completa de un curso de capacitación",
        input_schema: {
          type: "object",
          properties: {
            title: { type: "string", description: "Týtulo del curso (máximo 80 caracteres)" },
            description: { type: "string", description: "Descripción detallada del curso (2-4 oraciones)" },
            dimension: { type: "string", enum: ["onboarding", "refuerzo", "taller", "entrenamiento"] },
            difficulty: { type: "string", enum: ["basico", "medio", "avanzado"] },
            points: { type: "number", description: "Puntos del curso (50-200)" },
            estimated_duration_minutes: { type: "number" },
            objectives: { type: "array", items: { type: "string" }, description: "3-5 objetivos de aprendizaje" },
            cover_image_prompt: { type: "string", description: "Prompt en inglés para imagen de portada" },
            module_titles: { type: "array", items: { type: "string" }, description: "3-6 týtulos de módulos" },
            module_summaries: { type: "array", items: { type: "string" }, description: "Resumen de cada módulo (1-2 oraciones)" },
            quiz_questions: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  question: { type: "string" },
                  question_type: { type: "string", enum: ["multiple_choice", "true_false"] },
                  points: { type: "number" },
                  options: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        text: { type: "string" },
                        is_correct: { type: "boolean" },
                      },
                      required: ["text", "is_correct"],
                    },
                  },
                },
                required: ["question", "question_type", "points", "options"],
              },
            },
          },
          required: ["title", "description", "dimension", "difficulty", "points", "estimated_duration_minutes", "objectives", "cover_image_prompt", "module_titles", "module_summaries", "quiz_questions"],
        },
      },
    ];

    const structureRes = await callClaude(
      ANTHROPIC_API_KEY,
      `Eres un diseñador instruccional experto especializado en capacitación comercial para Addi (fintech colombiana de crédito digital). Crea estructuras de cursos prácticos, con objetivos claros y evaluaciones efectivas. Responde siempre en español. Usa la información de fuentes externas y materiales del usuario para crear contenido relevante y actualizado. El quiz debe tener 5-10 preguntas variadas (multiple_choice con 4 opciones, true_false con 2 opciones).`,
      `Genera la estructura completa del curso basado en:\n\nPROMPT: ${prompt}${webResearchContext ? `\n\n=== INVESTIGACIÓN DE FUENTES EXTERNAS ===\n${webResearchContext}` : ""}${materialsContext}`,
      structureTools,
      { type: "tool", name: "create_course" }
    );

    const toolUseBlock = structureRes.content?.find((b: any) => b.type === "tool_use");
    if (!toolUseBlock) {
      console.error("No tool_use in Claude response");
      throw new Error("No se recibió respuesta estructurada de la IA");
    }

    const courseStructure = toolUseBlock.input;
    console.log("Course structure ready:", courseStructure.title, "Modules:", courseStructure.module_titles?.length);

    // --- STEP 3: Generate deep content for each module with Claude ---
    console.log("=== STEP 3: Generating deep module content ===");

    const moduleContents: string[] = [];
    for (let i = 0; i < courseStructure.module_titles.length; i++) {
      const moduleTitle = courseStructure.module_titles[i];
      const moduleSummary = courseStructure.module_summaries?.[i] || "";
      console.log(`Generating module ${i + 1}/${courseStructure.module_titles.length}: ${moduleTitle}`);

      const moduleRes = await callClaude(
        ANTHROPIC_API_KEY,
        `Eres un diseñador instruccional experto. Genera contenido educativo completo en HTML puro (SIN markdown). Requisitos estrictos:
- Mínimo 1200 palabras de contenido rico y educativo
- Usa SOLO etiquetas HTML: <h2>, <h3>, <p>, <ul>, <li>, <ol>, <strong>, <em>, <blockquote>, <table>, <tr>, <td>, <th>
- Incluye mínimo 5-8 secciones bien estructuradas
- Agrega ejemplos prácticos REALES del contexto de ventas de Addi (fintech de crédito digital en Colombia)
- Tips accionables y casos de uso concretos
- Datos y estadísticas cuando sea relevante
- Referencias a las fuentes encontradas
- NO uses markdown (ni #, ni **, ni -), SOLO HTML válido
- NO incluyas <html>, <head>, <body>. Solo el contenido interno.
- Responde SOLO con el HTML, sin explicaciones.`,
        `Genera el contenido educativo completo del módulo "${moduleTitle}" para el curso "${courseStructure.title}".\n\nResumen del módulo: ${moduleSummary}${webResearchContext ? `\n\n=== FUENTES EXTERNAS ===\n${webResearchContext.substring(0, 3000)}` : ""}${materialsContext ? `\n\n${materialsContext.substring(0, 3000)}` : ""}`
      );

      const moduleContent = moduleRes.content?.[0]?.text || `<h2>${moduleTitle}</h2><p>Contenido en proceso de generación.</p>`;
      moduleContents.push(moduleContent);
    }

    // --- STEP 4: Generate cover image ---
    console.log("=== STEP 4: Generating cover image ===");
    let coverImageUrl: string | null = null;
    if (LOVABLE_API_KEY) {
      coverImageUrl = await generateCoverImage(LOVABLE_API_KEY, supabase, courseStructure.cover_image_prompt);
    }

    // --- STEP 5: Insert course ---
    console.log("=== STEP 5: Saving course to database ===");
    const { data: course, error: courseError } = await supabase
      .from("courses")
      .insert({
        title: courseStructure.title,
        description: courseStructure.description,
        dimension: courseStructure.dimension,
        difficulty: courseStructure.difficulty,
        points: courseStructure.points,
        estimated_duration_minutes: courseStructure.estimated_duration_minutes,
        objectives: courseStructure.objectives,
        cover_image_url: coverImageUrl,
        status: "draft",
        created_by: user.id,
        language: "es",
        time_limit_minutes: 60,
        is_ai_generated: true,
        ai_metadata: {
          source_prompt: prompt,
          provided_materials_count: provided_materials?.length || 0,
          web_research_used: webResearchContext.length > 0,
          generated_at: new Date().toISOString(),
          model: "claude-sonnet-4",
        },
      })
      .select()
      .single();

    if (courseError) {
      console.error("Course insert error:", courseError);
      throw courseError;
    }

    // --- STEP 6: Insert materials ---
    let materialsInserted = 0;
    const materialsToInsert = courseStructure.module_titles.map((title: string, idx: number) => ({
      course_id: course.id,
      title,
      type: "documento",
      content_text: moduleContents[idx] || "",
      content_url: null,
      order_index: idx,
      is_required: true,
    }));

    const { error: matError } = await supabase.from("course_materials").insert(materialsToInsert);
    if (matError) {
      console.error("Materials insert error:", matError);
    } else {
      materialsInserted = materialsToInsert.length;
    }

    // --- STEP 7: Insert quiz ---
    let questionsInserted = 0;
    if (courseStructure.quiz_questions?.length > 0) {
      const { data: quiz, error: quizError } = await supabase
        .from("quizzes")
        .insert({
          course_id: course.id,
          title: `Quiz: ${courseStructure.title}`,
          description: "Evaluación generada automáticamente",
          passing_score: 70,
          order_index: 0,
        })
        .select()
        .single();

      if (!quizError && quiz) {
        const questionsToInsert = courseStructure.quiz_questions.map((q: any, idx: number) => ({
          quiz_id: quiz.id,
          question: q.question,
          question_type: q.question_type,
          options: q.options,
          points: q.points || 10,
          order_index: idx,
        }));

        const { error: qError } = await supabase.from("quiz_questions").insert(questionsToInsert);
        if (qError) console.error("Quiz questions insert error:", qError);
        else questionsInserted = questionsToInsert.length;
      }
    }

    console.log(`Course generation complete: ${materialsInserted} materials, ${questionsInserted} questions`);

    // Build module previews for the response
    const modulePreviews = courseStructure.module_titles.map((title: string, idx: number) => {
      const content = moduleContents[idx] || "";
      const plainText = content.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
      return { title, preview: plainText.substring(0, 200) + (plainText.length > 200 ? "..." : "") };
    });

    return new Response(
      JSON.stringify({
        success: true,
        course_id: course.id,
        title: courseStructure.title,
        materials_count: materialsInserted,
        questions_count: questionsInserted,
        has_cover_image: !!coverImageUrl,
        module_previews: modulePreviews,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e: any) {
    console.error("create-ai-course error:", e);
    if (e.message === "RATE_LIMIT") {
      return new Response(JSON.stringify({ error: "Rate limit excedido. Intenta más tarde." }), {
        status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (e.message === "CREDITS_EXHAUSTED") {
      return new Response(JSON.stringify({ error: "Créditos de IA agotados." }), {
        status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Error desconocido" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
