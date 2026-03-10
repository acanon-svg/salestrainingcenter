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

        // Fetch user roles
        const { data: userRoles } = await supabase
          .from("user_roles")
          .select("role")
          .eq("user_id", user.id);

        const roles = (userRoles || []).map((r: any) => r.role);
        isAdmin = roles.includes("admin");
        isCreator = roles.includes("creator");

        // Fetch profile
        const { data: profile } = await supabase
          .from("profiles")
          .select("full_name, email, points, badges_count, team, regional, company_role")
          .eq("user_id", user.id)
          .single();

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

        // Fetch existing published course titles
        const { data: publishedCourses } = await supabase
          .from("courses")
          .select("title")
          .eq("status", "published")
          .limit(100);

        existingCourseTitles = (publishedCourses || []).map((c: any) => c.title);

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
${canCreateCourses ? `- Este usuario ES administrador/creador. Si solicita crear un curso, usa la herramienta "create_training_course" para generarlo en segundo plano. Responde SOLO con un mensaje de confirmación breve.
- Cuando uses la herramienta, responde: "Entendido. Voy a generar el curso '[tema]' para el segmento [segmento]. Lo encontrarás listo para revisar en tus notificaciones en unos segundos. Una vez lo apruebes, quedará disponible para asignar."` : `- Este usuario NO es administrador. NO puedes crear cursos para él.
- Si solicita un curso, responde: "La creación de cursos es una función exclusiva del administrador. Si necesitas un curso sobre [tema], puedo notificarle al administrador para que lo evalúe. ¿Quieres que le envíe la solicitud?"
- Si el usuario confirma que quiere enviar la solicitud, usa la herramienta "request_course" para notificar al admin.`}

Cuando detectes que el usuario quiere aprender sobre un tema:
1. Verifica si existe un curso publicado sobre ese tema en la lista
2. Si existe, recomiéndalo con su nombre exacto
3. Si NO existe y el usuario es admin/creador, usa create_training_course
4. Si NO existe y el usuario NO es admin, ofrece enviar solicitud al administrador

${userContext}`;

    // Define tools based on user role
    const tools: any[] = [];

    if (canCreateCourses) {
      tools.push({
        type: "function",
        function: {
          name: "create_training_course",
          description: "Crea un curso de capacitación en segundo plano como borrador y notifica al administrador para revisión. Solo usar cuando un administrador/creador solicita explícitamente un curso.",
          parameters: {
            type: "object",
            properties: {
              topic: { type: "string", description: "Tema principal del curso" },
              segment: {
                type: "string",
                enum: ["calle", "mediano", "grande", "lider"],
                description: "Segmento del público objetivo",
              },
              difficulty: {
                type: "string",
                enum: ["basico", "intermedio", "avanzado"],
                description: "Nivel de dificultad",
              },
            },
            required: ["topic", "segment", "difficulty"],
            additionalProperties: false,
          },
        },
      });
    } else {
      tools.push({
        type: "function",
        function: {
          name: "request_course",
          description: "Envía una solicitud al administrador para que evalúe la creación de un curso sobre un tema específico. Usar cuando un usuario no-admin confirma que quiere solicitar un curso.",
          parameters: {
            type: "object",
            properties: {
              topic: { type: "string", description: "Tema del curso solicitado" },
              segment: {
                type: "string",
                enum: ["calle", "mediano", "grande", "lider"],
                description: "Segmento del solicitante",
              },
            },
            required: ["topic"],
            additionalProperties: false,
          },
        },
      });
    }

    // First AI call with tool definition
    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          ...messages,
        ],
        tools,
      }),
    });

    if (!aiResponse.ok) {
      if (aiResponse.status === 429) {
        return new Response(JSON.stringify({ error: "Demasiadas solicitudes. Intenta de nuevo en un momento." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (aiResponse.status === 402) {
        return new Response(JSON.stringify({ error: "Se agotaron los créditos de IA. Contacta al administrador." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await aiResponse.text();
      console.error("AI gateway error:", aiResponse.status, t);
      return new Response(JSON.stringify({ error: "Error al conectar con la IA" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const aiData = await aiResponse.json();
    const choice = aiData.choices?.[0];
    const toolCall = choice?.message?.tool_calls?.[0];

    // Handle course request from non-admin
    if (toolCall && toolCall.function?.name === "request_course") {
      const toolArgs = JSON.parse(toolCall.function.arguments);
      const { topic, segment: reqSegment } = toolArgs;

      const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);

      // Find all admin/creator users to notify
      const { data: adminRoles } = await supabaseAdmin
        .from("user_roles")
        .select("user_id")
        .in("role", ["admin", "creator"]);

      const adminUserIds = [...new Set((adminRoles || []).map((r: any) => r.user_id))];

      // Insert notification for each admin
      for (const adminId of adminUserIds) {
        await supabaseAdmin.from("notifications").insert({
          user_id: adminId,
          title: "📬 Solicitud de curso",
          message: `${userFullName} del segmento ${reqSegment || userSegment || "no identificado"} solicita un curso sobre "${topic}". ¿Deseas crearlo?`,
          type: "course_request",
          related_id: null,
          is_read: false,
        });
      }

      // Return text-only response — no course content in chat
      return new Response(JSON.stringify({
        type: "text",
        content: `✅ ¡Listo! He enviado tu solicitud al administrador. Le notifiqué que necesitas un curso sobre **"${topic}"**. Te avisaré cuando esté disponible. 💪`,
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Handle course creation from admin
    if (toolCall && toolCall.function?.name === "create_training_course") {
      console.log("Admin requested course creation via tool call");

      const toolArgs = JSON.parse(toolCall.function.arguments);
      const { topic, segment, difficulty } = toolArgs;

      const segmentDescriptions: Record<string, string> = {
        calle: "Vendedores de campo (0-400M COP). Lenguaje directo, práctico, con ejemplos del día a día.",
        mediano: "Negocios medianos (400M-2000M COP). Balance entre estrategia y ejecución.",
        grande: "Grandes negocios (+4000M COP). Perfil consultivo y estratégico.",
        lider: "Líderes comerciales. Gestión de equipos, coaching, métricas de rendimiento.",
      };

      const difficultyMap: Record<string, string> = {
        basico: "basico",
        intermedio: "medio",
        avanzado: "avanzado",
      };

      // Return confirmation immediately — course generation happens in background
      // We use a fire-and-forget pattern: return the text response first
      const confirmationMessage = `✅ Entendido. Voy a generar el curso **"${topic}"** para el segmento **${segment}**.\n\n📩 Lo encontrarás listo para revisar en tus **notificaciones** en unos segundos. Una vez lo apruebes, quedará disponible para asignar.`;

      // Start async course generation (fire-and-forget)
      const generateCourseAsync = async () => {
        try {
          console.log(`Generating course async: "${topic}" for segment "${segment}"`);

          const courseGenResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
            method: "POST",
            headers: {
              Authorization: `Bearer ${LOVABLE_API_KEY}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              model: "google/gemini-2.5-flash",
              messages: [
                {
                  role: "system",
                  content: `Eres un diseñador instruccional experto en capacitación comercial. Genera cursos prácticos y motivadores en español.

CONTEXTO DEL SEGMENTO: ${segmentDescriptions[segment] || "Ventas general"}

REGLAS:
- Contenido 100% en español
- Los materiales deben ser tipo "documento" con contenido HTML rico
- Usa <h2>, <h3>, <p>, <ul>, <li>, <ol>, <strong>, <em>, <blockquote>, <table> para estructurar
- Cada material debe tener mínimo 600 palabras con información práctica y accionable
- Incluye ejemplos reales, scripts de venta, role plays o ejercicios prácticos
- Incluye videos de YouTube reales y relevantes cuando sea posible
- El quiz debe tener 5-8 preguntas basadas en el contenido
- Adapta el tono al segmento del vendedor
- NO uses markdown, SOLO HTML válido`,
                },
                {
                  role: "user",
                  content: `Genera un curso completo sobre: "${topic}"
Segmento: ${segment}
Nivel: ${difficulty}
Incluye módulos prácticos con contenido extenso, ejemplos y evaluación.`,
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
                        description: { type: "string", description: "Descripción del curso (2 líneas máximo)" },
                        dimension: { type: "string", enum: ["onboarding", "refuerzo", "taller", "entrenamiento"] },
                        difficulty: { type: "string", enum: ["basico", "medio", "avanzado"] },
                        points: { type: "number", description: "Puntos del curso (50-200)" },
                        estimated_duration_minutes: { type: "number" },
                        objectives: { type: "array", items: { type: "string" }, description: "3-5 objetivos de aprendizaje" },
                        materials: {
                          type: "array",
                          items: {
                            type: "object",
                            properties: {
                              title: { type: "string" },
                              content: { type: "string", description: "Contenido HTML rico, mínimo 600 palabras" },
                              youtube_url: { type: "string", description: "URL de YouTube relevante (opcional)" },
                            },
                            required: ["title", "content"],
                            additionalProperties: false,
                          },
                          description: "3-6 módulos del curso",
                        },
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
                                  additionalProperties: false,
                                },
                              },
                            },
                            required: ["question", "question_type", "points", "options"],
                            additionalProperties: false,
                          },
                        },
                      },
                      required: ["title", "description", "dimension", "difficulty", "points", "estimated_duration_minutes", "objectives", "materials", "quiz_questions"],
                      additionalProperties: false,
                    },
                  },
                },
              ],
              tool_choice: { type: "function", function: { name: "create_course" } },
            }),
          });

          if (!courseGenResponse.ok) {
            console.error("Course generation failed:", courseGenResponse.status);
            return;
          }

          const courseGenData = await courseGenResponse.json();
          const courseToolCall = courseGenData.choices?.[0]?.message?.tool_calls?.[0];
          if (!courseToolCall) {
            console.error("No tool call in course generation response");
            return;
          }

          const courseContent = JSON.parse(courseToolCall.function.arguments);
          console.log("Course content generated:", courseContent.title);

          const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);

          const targetTeams: string[] = [];
          if (segment === "calle") targetTeams.push("Field Sales");
          if (segment === "lider") targetTeams.push("Líderes");

          const { data: course, error: courseError } = await supabaseAdmin
            .from("courses")
            .insert({
              title: courseContent.title,
              description: courseContent.description,
              dimension: courseContent.dimension || "entrenamiento",
              difficulty: difficultyMap[difficulty] || courseContent.difficulty || "basico",
              points: courseContent.points || 100,
              estimated_duration_minutes: courseContent.estimated_duration_minutes || 30,
              objectives: courseContent.objectives,
              status: "draft",
              created_by: userId,
              language: "es",
              is_ai_generated: true,
              target_teams: targetTeams.length > 0 ? targetTeams : null,
              segment: segment,
              ai_metadata: {
                source: "ai-training-bot",
                topic,
                segment,
                difficulty,
                generated_at: new Date().toISOString(),
                requested_by: userId,
              },
            })
            .select()
            .single();

          if (courseError) {
            console.error("Course insert error:", courseError);
            return;
          }

          console.log("Course created:", course.id);

          // Insert materials
          let materialsInserted = 0;
          if (courseContent.materials?.length > 0) {
            const materialsToInsert = courseContent.materials.map((m: any, idx: number) => ({
              course_id: course.id,
              title: m.title,
              type: "documento",
              content_text: m.content,
              content_url: m.youtube_url || null,
              order_index: idx,
              is_required: true,
            }));

            const { error: matError } = await supabaseAdmin.from("course_materials").insert(materialsToInsert);
            if (matError) console.error("Materials insert error:", matError);
            else materialsInserted = materialsToInsert.length;
          }

          // Insert quiz
          let questionsInserted = 0;
          if (courseContent.quiz_questions?.length > 0) {
            const { data: quiz, error: quizError } = await supabaseAdmin
              .from("quizzes")
              .insert({
                course_id: course.id,
                title: `Quiz: ${courseContent.title}`,
                description: "Evaluación generada por el asistente de IA",
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

              const { error: qError } = await supabaseAdmin.from("quiz_questions").insert(questionsToInsert);
              if (!qError) questionsInserted = questionsToInsert.length;
            }
          }

          console.log(`Course creation complete: ${materialsInserted} materials, ${questionsInserted} questions`);

          // Send notification to the admin who requested it
          await supabaseAdmin.from("notifications").insert({
            user_id: userId,
            title: "📚 Nuevo curso listo para revisión",
            message: `El curso "${courseContent.title}" (${materialsInserted} módulos, ${questionsInserted} preguntas) ha sido generado y está listo para tu revisión. Revísalo y publícalo cuando esté listo.`,
            type: "course_ready",
            related_id: course.id,
            is_read: false,
          });

          console.log("Admin notification sent for course:", course.id);
        } catch (err) {
          console.error("Async course generation error:", err);
        }
      };

      // Fire and forget — don't await
      generateCourseAsync();

      // Return immediate confirmation — no course content in chat
      return new Response(JSON.stringify({
        type: "text",
        content: confirmationMessage,
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // No tool call — regular streaming response
    const streamResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
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

    if (!streamResponse.ok) {
      const t = await streamResponse.text();
      console.error("Stream error:", streamResponse.status, t);
      return new Response(JSON.stringify({ error: "Error al conectar con la IA" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(streamResponse.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error("ai-training-bot error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Error desconocido" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
