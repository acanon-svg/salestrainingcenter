import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "No autorizado" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabaseAnon = Deno.env.get("SUPABASE_ANON_KEY")!;

    // Verify user is admin
    const userClient = createClient(supabaseUrl, supabaseAnon, {
      global: { headers: { Authorization: authHeader } },
    });
    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await userClient.auth.getUser(token);
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Token inválido" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Check admin role
    const { data: roles } = await userClient.from("user_roles").select("role").eq("user_id", user.id);
    const isAdmin = roles?.some((r: { role: string }) => r.role === "admin");
    if (!isAdmin) {
      return new Response(JSON.stringify({ error: "Solo administradores pueden generar el prompt" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Use service role to fetch all data
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Fetch all platform data in parallel
    const [coursesRes, materialsRes, glossaryRes, announcementsRes, teamDataRes] = await Promise.all([
      supabase.from("courses").select(`
        title, description, dimension, difficulty, points, estimated_duration_minutes, objectives, tags,
        course_materials:course_materials(title, type),
        quizzes:quizzes(title, passing_score, questions:quiz_questions(question))
      `).eq("status", "published"),
      supabase.from("training_materials").select(`
        title, description, type, keywords, content_text,
        category:material_categories(name)
      `).eq("is_published", true),
      supabase.from("glossary_terms").select("term, definition, example"),
      supabase.from("announcements").select("title, content, type").order("created_at", { ascending: false }).limit(30),
      supabase.from("chatbot_team_data").select("data_name, description").order("created_at", { ascending: false }),
    ]);

    const courses = coursesRes.data || [];
    const materials = materialsRes.data || [];
    const glossary = glossaryRes.data || [];
    const announcements = announcementsRes.data || [];
    const teamData = teamDataRes.data || [];

    // Build the comprehensive prompt
    let prompt = `Eres Andy, el asistente virtual de la plataforma de capacitación comercial de Addi. Responde de manera clara, concisa y profesional en español. Tienes acceso completo a toda la información de la plataforma.\n`;
    prompt += `\nFecha de última actualización del conocimiento: ${new Date().toLocaleString("es-CO", { timeZone: "America/Bogota" })}\n`;

    // Courses section
    if (courses.length > 0) {
      prompt += `\n\n===== CURSOS DISPONIBLES (${courses.length}) =====\n`;
      for (const c of courses) {
        prompt += `\n## ${c.title}`;
        if (c.description) prompt += `\n${c.description}`;
        prompt += `\n- Dimensión: ${c.dimension} | Dificultad: ${c.difficulty} | Puntos: ${c.points}`;
        if (c.estimated_duration_minutes) prompt += ` | Duración: ${c.estimated_duration_minutes} min`;
        if (c.objectives?.length) prompt += `\n- Objetivos: ${c.objectives.join(", ")}`;
        if (c.tags?.length) prompt += `\n- Tags: ${c.tags.join(", ")}`;
        const mats = c.course_materials as any[];
        if (mats?.length) {
          prompt += `\n- Contenidos (${mats.length}):`;
          for (const m of mats) prompt += ` ${m.title} (${m.type});`;
        }
        const quizzes = c.quizzes as any[];
        if (quizzes?.length) {
          for (const q of quizzes) {
            const questions = q.questions as any[];
            prompt += `\n- Quiz: ${q.title} (mín: ${q.passing_score}%, ${questions?.length || 0} preguntas)`;
          }
        }
      }
    }

    // Materials section
    if (materials.length > 0) {
      prompt += `\n\n===== MATERIALES DE FORMACIÓN (${materials.length}) =====\n`;
      const byCategory = new Map<string, any[]>();
      for (const m of materials) {
        const cat = (m.category as any)?.name || "Sin categoría";
        if (!byCategory.has(cat)) byCategory.set(cat, []);
        byCategory.get(cat)!.push(m);
      }
      for (const [cat, mats] of byCategory) {
        prompt += `\n## ${cat} (${mats.length})`;
        for (const m of mats) {
          prompt += `\n- ${m.title} (${m.type})`;
          if (m.description) prompt += `: ${m.description}`;
          if (m.keywords?.length) prompt += ` [${m.keywords.join(", ")}]`;
          if (m.content_text) {
            prompt += `\n  Contenido: ${m.content_text.slice(0, 400)}${m.content_text.length > 400 ? "..." : ""}`;
          }
        }
      }
    }

    // Glossary section
    if (glossary.length > 0) {
      prompt += `\n\n===== GLOSARIO (${glossary.length} términos) =====\n`;
      for (const t of glossary) {
        prompt += `\n- **${t.term}**: ${t.definition}`;
        if (t.example) prompt += ` (Ej: ${t.example})`;
      }
    }

    // Announcements section
    if (announcements.length > 0) {
      prompt += `\n\n===== ANUNCIOS RECIENTES (${announcements.length}) =====\n`;
      for (const a of announcements) {
        prompt += `\n- ${a.title} (${a.type})`;
        if (a.content) prompt += `: ${a.content.slice(0, 200)}`;
      }
    }

    // Team data references
    if (teamData.length > 0) {
      prompt += `\n\n===== DATOS DE EQUIPO DISPONIBLES (${teamData.length}) =====\n`;
      prompt += `Nota: Los datos del equipo se cargan en tiempo real cuando el usuario hace preguntas.\n`;
      for (const td of teamData) {
        prompt += `\n- ${td.data_name}`;
        if (td.description) prompt += `: ${td.description}`;
      }
    }

    prompt += `\n\n===== INSTRUCCIONES =====\n`;
    prompt += `- Responde siempre en español.\n`;
    prompt += `- Si el usuario pregunta sobre un curso o material específico, usa la información proporcionada.\n`;
    prompt += `- Si no tienes la respuesta, indica que no tienes esa información disponible.\n`;
    prompt += `- Sé amable, profesional y conciso.\n`;

    // Save to chatbot_config
    const { data: config } = await supabase.from("chatbot_config").select("id").limit(1).single();
    if (config) {
      await supabase.from("chatbot_config").update({
        auto_generated_prompt: prompt,
        updated_at: new Date().toISOString(),
      }).eq("id", config.id);
    }

    // Save to history
    await supabase.from("chatbot_prompt_history").insert({
      generated_prompt: prompt,
      courses_count: courses.length,
      materials_count: materials.length,
      glossary_count: glossary.length,
      announcements_count: announcements.length,
      team_data_count: teamData.length,
      generated_by: user.id,
    });

    return new Response(JSON.stringify({
      success: true,
      stats: {
        courses: courses.length,
        materials: materials.length,
        glossary: glossary.length,
        announcements: announcements.length,
        teamData: teamData.length,
      },
      promptLength: prompt.length,
      generatedAt: new Date().toISOString(),
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error generating prompt:", error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Error desconocido" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
