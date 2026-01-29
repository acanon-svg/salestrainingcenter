import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": Deno.env.get("ALLOWED_ORIGIN") || "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Input validation constants
const MAX_MESSAGES = 20;
const MAX_MESSAGE_LENGTH = 4000;
const VALID_ROLES = ["user", "assistant"];

interface ChatMessage {
  role: string;
  content: string;
}

interface TeamData {
  data_name: string;
  data_content: Record<string, unknown>;
  description: string | null;
}

interface Course {
  title: string;
  description: string | null;
  dimension: string;
  difficulty: string;
  points: number;
}

interface TrainingMaterial {
  title: string;
  description: string | null;
  type: string;
  keywords: string[] | null;
}

interface Announcement {
  title: string;
  content: string | null;
  type: string;
}

interface GlossaryTerm {
  term: string;
  definition: string;
  example: string | null;
}

function validateMessages(messages: unknown): { valid: boolean; error?: string } {
  if (!Array.isArray(messages)) {
    return { valid: false, error: "El formato de mensajes es inválido." };
  }

  if (messages.length === 0) {
    return { valid: false, error: "Se requiere al menos un mensaje." };
  }

  if (messages.length > MAX_MESSAGES) {
    return { valid: false, error: `Demasiados mensajes. Máximo ${MAX_MESSAGES} mensajes permitidos.` };
  }

  for (let i = 0; i < messages.length; i++) {
    const msg = messages[i];

    if (!msg || typeof msg !== "object") {
      return { valid: false, error: `Mensaje ${i + 1} tiene formato inválido.` };
    }

    if (!msg.role || typeof msg.role !== "string" || !VALID_ROLES.includes(msg.role)) {
      return { valid: false, error: `Rol de mensaje ${i + 1} es inválido.` };
    }

    if (typeof msg.content !== "string") {
      return { valid: false, error: `Contenido del mensaje ${i + 1} es inválido.` };
    }

    if (msg.content.length > MAX_MESSAGE_LENGTH) {
      return { valid: false, error: `Mensaje ${i + 1} excede el límite de ${MAX_MESSAGE_LENGTH} caracteres.` };
    }

    if (msg.role === "user" && msg.content.trim().length === 0) {
      return { valid: false, error: `El mensaje ${i + 1} no puede estar vacío.` };
    }
  }

  return { valid: true };
}

function formatTeamDataForContext(teamData: TeamData[]): string {
  if (!teamData || teamData.length === 0) {
    return "";
  }

  let context = "\n\n---\nDATOS DEL EQUIPO DISPONIBLES:\n";
  
  for (const data of teamData) {
    context += `\n### ${data.data_name}`;
    if (data.description) {
      context += ` - ${data.description}`;
    }
    context += `\n${JSON.stringify(data.data_content, null, 2)}\n`;
  }
  
  context += "\n---\n";
  context += "Puedes usar estos datos para responder preguntas sobre resultados, métricas y desempeño del equipo. ";
  context += "Cuando el usuario pregunte sobre resultados o datos del equipo, usa esta información para dar respuestas precisas.\n";
  
  return context;
}

function formatCoursesForContext(courses: Course[]): string {
  if (!courses || courses.length === 0) return "";

  let context = "\n\n---\nCURSOS DISPONIBLES EN LA PLATAFORMA:\n";
  
  for (const course of courses) {
    context += `\n### ${course.title}`;
    if (course.description) {
      context += `\n${course.description}`;
    }
    context += `\n- Dimensión: ${course.dimension}, Dificultad: ${course.difficulty}, Puntos: ${course.points}`;
  }
  
  context += "\n---\n";
  return context;
}

function formatMaterialsForContext(materials: TrainingMaterial[]): string {
  if (!materials || materials.length === 0) return "";

  let context = "\n\n---\nMATERIALES DE FORMACIÓN:\n";
  
  for (const material of materials) {
    context += `\n### ${material.title} (${material.type})`;
    if (material.description) {
      context += `\n${material.description}`;
    }
    if (material.keywords && material.keywords.length > 0) {
      context += `\n- Palabras clave: ${material.keywords.join(", ")}`;
    }
  }
  
  context += "\n---\n";
  return context;
}

function formatAnnouncementsForContext(announcements: Announcement[]): string {
  if (!announcements || announcements.length === 0) return "";

  let context = "\n\n---\nANUNCIOS RECIENTES:\n";
  
  for (const announcement of announcements) {
    context += `\n### ${announcement.title} (${announcement.type})`;
    if (announcement.content) {
      context += `\n${announcement.content.slice(0, 300)}...`;
    }
  }
  
  context += "\n---\n";
  return context;
}

function formatGlossaryForContext(terms: GlossaryTerm[]): string {
  if (!terms || terms.length === 0) return "";

  let context = "\n\n---\nGLOSARIO DE TÉRMINOS:\n";
  
  for (const term of terms) {
    context += `\n### ${term.term}`;
    context += `\n${term.definition}`;
    if (term.example) {
      context += `\nEjemplo: ${term.example}`;
    }
  }
  
  context += "\n---\n";
  context += "Usa este glosario para explicar términos técnicos cuando el usuario pregunte.\n";
  return context;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Validate authentication
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "No autorizado. Inicia sesión para usar el chatbot." }),
        {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: {
        headers: { Authorization: authHeader },
      },
    });

    // Verify JWT token
    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: "Token inválido. Por favor, inicia sesión nuevamente." }),
        {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Parse request body
    let body: { messages?: unknown };
    try {
      body = await req.json();
    } catch {
      return new Response(
        JSON.stringify({ error: "Formato de solicitud inválido." }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const { messages } = body;

    // Validate messages input
    const validation = validateMessages(messages);
    if (!validation.valid) {
      return new Response(
        JSON.stringify({ error: validation.error }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    // Fetch all context data in parallel
    const [configResult, teamDataResult, coursesResult, materialsResult, announcementsResult, glossaryResult] = await Promise.all([
      supabase.from("chatbot_config").select("system_prompt").single(),
      supabase.from("chatbot_team_data").select("data_name, data_content, description").order("created_at", { ascending: false }),
      supabase.from("courses").select("title, description, dimension, difficulty, points").eq("status", "published").limit(50),
      supabase.from("training_materials").select("title, description, type, keywords").eq("is_published", true).limit(50),
      supabase.from("announcements").select("title, content, type").order("created_at", { ascending: false }).limit(10),
      supabase.from("glossary_terms").select("term, definition, example").limit(100),
    ]);

    let systemPrompt = configResult.data?.system_prompt || 
      "Eres un asistente virtual experto en procesos comerciales. Responde de manera clara, concisa y profesional en español.";

    // Append all context to system prompt
    systemPrompt += "\n\nTienes acceso a toda la información de la plataforma de capacitación. Usa este conocimiento para ayudar a los usuarios.";
    
    const teamData = teamDataResult.data as TeamData[] | null;
    if (teamData && teamData.length > 0) {
      systemPrompt += formatTeamDataForContext(teamData);
    }

    const courses = coursesResult.data as Course[] | null;
    if (courses && courses.length > 0) {
      systemPrompt += formatCoursesForContext(courses);
    }

    const materials = materialsResult.data as TrainingMaterial[] | null;
    if (materials && materials.length > 0) {
      systemPrompt += formatMaterialsForContext(materials);
    }

    const announcements = announcementsResult.data as Announcement[] | null;
    if (announcements && announcements.length > 0) {
      systemPrompt += formatAnnouncementsForContext(announcements);
    }

    const glossary = glossaryResult.data as GlossaryTerm[] | null;
    if (glossary && glossary.length > 0) {
      systemPrompt += formatGlossaryForContext(glossary);
    }

    // Sanitize messages before sending to AI
    const sanitizedMessages = (messages as ChatMessage[]).map((msg) => ({
      role: msg.role,
      content: msg.content.slice(0, MAX_MESSAGE_LENGTH),
    }));

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
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
            content: systemPrompt 
          },
          ...sanitizedMessages,
        ],
        stream: true,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Demasiadas solicitudes. Por favor, intenta de nuevo en unos momentos." }), 
          {
            status: 429,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "Créditos de IA agotados. Contacta al administrador." }), 
          {
            status: 402,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      return new Response(
        JSON.stringify({ error: "Error al procesar la solicitud" }), 
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (error) {
    console.error("Chat error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Error desconocido" }), 
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
