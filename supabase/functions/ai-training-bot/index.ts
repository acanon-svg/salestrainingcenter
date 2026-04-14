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
    const ANTHROPIC_API_KEY = Deno.env.get("ANTHROPIC_API_KEY");
    if (!ANTHROPIC_API_KEY) throw new Error("ANTHROPIC_API_KEY is not configured");

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    // Get user context from auth token
    const authHeader = req.headers.get("Authorization");
    let userContext = "";
    let userId: string | null = null;
    let userTeam: string | null = null;
    let userSegment = "";
    let userFullName = "";
    let existingCourseTitles: string[] = [];
    let isAdmin = false;
    let isCreator = false;

    if (authHeader) {
      const supabase = createClient(supabaseUrl, supabaseAnonKey, {
        global: { headers: { Authorization: authHeader } },
      });

      const { data: { user } } = await supabase.auth.getUser();

      if (user) {
        userId = user.id;

        // Fetch user roles, profile, enrollments in parallel
        const [rolesRes, profileRes, enrollmentsRes, quizRes, coursesRes] = await Promise.all([
          supabase.from("user_roles").select("role").eq("user_id", user.id),
          supabase.from("profiles").select("full_name, email, points, badges_count, team, regional, company_role").eq("user_id", user.id).single(),
          supabase.from("course_enrollments").select("status, progress_percentage, score, completed_at, courses(title)").eq("user_id", user.id).order("updated_at", { ascending: false }).limit(10),
          supabase.from("quiz_attempts").select("score, passed, completed_at, quizzes(title)").eq("user_id", user.id).order("completed_at", { ascending: false }).limit(10),
          supabase.from("courses").select("title").eq("status", "published").limit(100),
        ]);

        const roles = (rolesRes.data || []).map((r: any) => r.role);
        isAdmin = roles.includes("admin");
        isCreator = roles.includes("creator");
        const profile = profileRes.data;

        userTeam = profile?.team || null;
        userFullName = profile?.full_name || profile?.email || "Usuario";

        // Determine segment from team
        if (userTeam) {
          const teamLower = userTeam.toLowerCase();
          if (teamLower.includes("field") || teamLower.includes("calle") || teamLower.includes("s1") || teamLower.includes("segmento 1")) {
            userSegment = "calle";
          } else if (teamLower.includes("mediano") || teamLower.includes("s2") || teamLower.includes("segmento 2")) {
            userSegment = "mediano";
          } else if (teamLower.includes("grande") || teamLower.includes("enterprise") || teamLower.includes("s3") || teamLower.includes("segmento 3")) {
            userSegment = "grande";
          } else if (teamLower.includes("lider") || teamLower.includes("leader") || teamLower.includes("líder")) {
            userSegment = "lider";
          }
        }

        existingCourseTitles = (coursesRes.data || []).map((c: any) => c.title);

        const enrollments = enrollmentsRes.data || [];
        const quizAttempts = quizRes.data || [];

        const enrollmentSummary = enrollments.map((e: any) => {
          const title = e.courses?.title || "Sin título";
          return `- ${title}: ${e.status}, progreso ${e.progress_percentage}%${e.score != null ? `, nota ${e.score}` : ""}`;
        }).join("\n");

        const quizSummary = quizAttempts.map((q: any) => {
          const title = q.quizzes?.title || "Sin título";
          return `- ${title}: ${q.passed ? "Aprobado" : "No aprobado"}, nota ${q.score}%`;
        }).join("\n");

        const completed = enrollments.filter((e: any) => e.status === "completed").length;
        const inProgress = enrollments.filter((e: any) => e.status !== "completed").length;

        userContext = `
CONTEXTO DEL USUARIO:
- Nombre: ${profile?.full_name || "No disponible"}
- Email: ${profile?.email || ""}
- Equipo: ${profile?.team || "No asignado"}
- Regional: ${profile?.regional || "No asignada"}
- Rol: ${profile?.company_role || "No asignado"}
- Roles en plataforma: ${roles.join(", ") || "student"}
- Es administrador/creador: ${isAdmin || isCreator ? "SÍ" : "NO"}
- Segmento detectado: ${userSegment || "No identificado"}
- Puntos: ${profile?.points || 0}
- Insignias: ${profile?.badges_count || 0}
- Cursos completados: ${completed}, En progreso: ${inProgress}

CURSOS RECIENTES DEL USUARIO:
${enrollmentSummary || "Sin cursos registrados"}

ÚLTIMOS QUIZZES:
${quizSummary || "Sin intentos de quiz"}

CURSOS EXISTENTES EN LA PLATAFORMA (solo menciona estos si recomiendas cursos existentes):
${existingCourseTitles.length > 0 ? existingCourseTitles.map(t => `- ${t}`).join("\n") : "No hay cursos publicados actualmente"}
`;
      }
    }

    const canCreateCourses = isAdmin || isCreator;

    const systemPrompt = `Eres el Asistente de Entrenamiento de ventas de Addi. Tu nombre es "Andy". Respondes SIEMPRE en español.

Tu público está segmentado así:
- Ventas en calle (0-400M COP): vendedores de campo, lenguaje práctico y directo
- Medianos negocios (400M-2000M COP): perfil mixto estrategia + ejecución
- Grandes negocios (+4000M COP): perfil consultivo y estratégico
- Líderes comerciales: gestión de equipos, coaching, liderazgo

REGLAS CRÍTICAS:
1. NUNCA recomiendes ni menciones cursos que no existen en la plataforma. Solo puedes recomendar cursos de la lista "CURSOS EXISTENTES EN LA PLATAFORMA".
2. Sé conciso, amigable y motivador. Usa emojis moderadamente.
3. Adapta tu tono según el segmento:
   - Ventas en calle: directo, práctico, ejemplos del día a día
   - Medianos: balance entre estrategia y táctica
   - Grandes: consultivo, datos, impacto en el negocio
   - Líderes: enfoque en gestión, métricas de equipo, desarrollo de talento

REGLAS DE CREACIÓN DE CURSOS:
- NUNCA generes ni muestres el contenido de un curso directamente en el chat.
- NUNCA renderices módulos, videos, quizzes ni estructura de curso en el chat.
${canCreateCourses ? `- Este usuario ES administrador/creador. Si solicita crear un curso, usa la herramienta "create_training_course" para generarlo en la plataforma directamente. NO muestres el contenido en el chat.
- Si el usuario pide revisar, modificar o ver un curso existente, redirige a la sección de cursos de la plataforma.` : `- Este usuario NO es administrador/creador. NO puede crear cursos. Si solicita crear un curso, indícale que debe contactar a un administrador.`}

${userContext}`;

    // Build tools array for course creation
    const tools: any[] = [];

    if (canCreateCourses) {
      tools.push({
        name: "create_training_course",
        description: "Crea un nuevo curso de entrenamiento en la plataforma. Usar cuando el usuario solicite crear un curso. NO mostrar contenido del curso en el chat.",
        input_schema: {
          type: "object",
          properties: {
            title: { type: "string", description: "Título del curso" },
            description: { type: "string", description: "Descripción breve del curso" },
            segment: { type: "string", description: "Segmento objetivo: calle, mediano, grande, lider, todos" },
          },
          required: ["title", "description"],
        },
      });

      tools.push({
        name: "recommend_existing_course",
        description: "Recomienda un curso existente de la plataforma al usuario. Solo usar con cursos que existen en la lista de cursos publicados.",
        input_schema: {
          type: "object",
          properties: {
            title: { type: "string", description: "Título exacto del curso existente" },
            reason: { type: "string", description: "Razón de la recomendación" },
          },
          required: ["title", "reason"],
        },
      });
    }

    // Call Anthropic API
    const anthropicBody: any = {
      model: "claude-sonnet-4-20250514",
      max_tokens: 1500,
      system: systemPrompt,
      messages: messages.map((m: any) => ({
        role: m.role,
        content: m.content,
      })),
    };

    if (tools.length > 0) {
      anthropicBody.tools = tools;
    }

    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify(anthropicBody),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Anthropic API error [${response.status}]: ${errorText}`);
    }

    const result = await response.json();

    // Handle tool use responses
    if (result.stop_reason === "tool_use") {
      const toolUseBlock = result.content.find((b: any) => b.type === "tool_use");
      if (toolUseBlock) {
        const toolName = toolUseBlock.name;
        const toolInput = toolUseBlock.input;

        if (toolName === "create_training_course") {
          // Create the course via Supabase
          const adminSupabase = createClient(supabaseUrl, serviceRoleKey);
          const { data: courseData, error: courseError } = await adminSupabase
            .from("courses")
            .insert({
              title: toolInput.title,
              description: toolInput.description,
              segment: toolInput.segment || "todos",
              created_by: userId,
              status: "draft",
              is_ai_generated: true,
              ai_generation_trigger: `Creado via Andy: ${toolInput.title}`,
            })
            .select()
            .single();

          if (courseError) {
            return new Response(JSON.stringify({
              text: `❌ Error al crear el curso: ${courseError.message}. Intenta de nuevo.`,
            }), {
              status: 200,
              headers: { ...corsHeaders, "Content-Type": "application/json" },
            });
          }

          return new Response(JSON.stringify({
            text: `✅ ¡Curso "${toolInput.title}" creado exitosamente como borrador! Puedes encontrarlo en la sección de cursos para editarlo y publicarlo.`,
            courseCreated: {
              id: courseData.id,
              title: toolInput.title,
            },
          }), {
            status: 200,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        if (toolName === "recommend_existing_course") {
          return new Response(JSON.stringify({
            text: `📚 Te recomiendo el curso: **${toolInput.title}**\n\n${toolInput.reason}`,
          }), {
            status: 200,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
      }
    }

    // Extract text from response
    const textBlock = result.content?.find((b: any) => b.type === "text");
    const text = textBlock?.text || "Lo siento, no pude generar una respuesta. Intenta de nuevo.";

    return new Response(JSON.stringify({ text }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("AI Training Bot error:", error);
    const errorMessage = error instanceof Error ? error.message : "Error desconocido";
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
