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

// Rate limiting: 15 requests per minute per user (in-memory, resets on cold start)
const RATE_LIMIT_WINDOW_MS = 60 * 1000;
const MAX_REQUESTS_PER_WINDOW = 15;
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();

function checkRateLimit(userId: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(userId);
  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(userId, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return true;
  }
  if (entry.count >= MAX_REQUESTS_PER_WINDOW) return false;
  entry.count++;
  return true;
}

interface ChatMessage {
  role: string;
  content: string;
}

interface TeamDataRaw {
  data_name: string;
  data_content: Record<string, unknown>;
  description: string | null;
}

interface TeamDataProcessed {
  data_name: string;
  data_content: Record<string, unknown> | unknown[];
  description: string | null;
  source_type: "json" | "google_sheet";
}

interface CourseMaterial {
  title: string;
  type: string;
}

interface QuizQuestion {
  question: string;
}

interface Quiz {
  title: string;
  passing_score: number;
  questions: QuizQuestion[] | null;
}

interface CourseWithDetails {
  title: string;
  description: string | null;
  dimension: string;
  difficulty: string;
  points: number;
  estimated_duration_minutes: number | null;
  objectives: string[] | null;
  tags: string[] | null;
  materials: CourseMaterial[] | null;
  quizzes: Quiz[] | null;
}

interface MaterialCategory {
  name: string;
}

interface TrainingMaterialWithCategory {
  title: string;
  description: string | null;
  type: string;
  keywords: string[] | null;
  content_text: string | null;
  category: MaterialCategory | null;
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

function formatTeamDataForContext(teamData: TeamDataProcessed[]): string {
  if (!teamData || teamData.length === 0) {
    return "";
  }

  let context = "\n\n---\nDATOS DEL EQUIPO DISPONIBLES:\n";
  
  for (const data of teamData) {
    context += `\n### ${data.data_name}`;
    if (data.description) {
      context += ` - ${data.description}`;
    }
    if (data.source_type === "google_sheet") {
      context += ` (Fuente: Google Sheets)`;
    }
    context += `\n${JSON.stringify(data.data_content, null, 2)}\n`;
  }
  
  context += "\n---\n";
  context += "Puedes usar estos datos para responder preguntas sobre resultados, métricas y desempeño del equipo. ";
  context += "Cuando el usuario pregunte sobre resultados o datos del equipo, usa esta información para dar respuestas precisas.\n";
  
  return context;
}

// Convert CSV text to array of objects
function csvToJson(csvText: string): Record<string, string>[] {
  const lines = csvText.trim().split("\n");
  if (lines.length < 2) return [];
  
  // Parse headers - handle quoted values
  const parseRow = (row: string): string[] => {
    const result: string[] = [];
    let current = "";
    let inQuotes = false;
    
    for (let i = 0; i < row.length; i++) {
      const char = row[i];
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === "," && !inQuotes) {
        result.push(current.trim());
        current = "";
      } else {
        current += char;
      }
    }
    result.push(current.trim());
    return result;
  };
  
  const headers = parseRow(lines[0]);
  const data: Record<string, string>[] = [];
  
  for (let i = 1; i < lines.length; i++) {
    if (!lines[i].trim()) continue;
    const values = parseRow(lines[i]);
    const row: Record<string, string> = {};
    
    headers.forEach((header, index) => {
      row[header] = values[index] || "";
    });
    
    data.push(row);
  }
  
  return data;
}

// Extract Google Sheet ID from URL and generate CSV export URL
function getGoogleSheetCsvUrl(url: string): string | null {
  try {
    const match = url.match(/\/spreadsheets\/d\/([a-zA-Z0-9_-]+)/);
    if (match && match[1]) {
      const sheetId = match[1];
      // Try to extract gid (sheet tab id) if present
      const gidMatch = url.match(/gid=(\d+)/);
      const gid = gidMatch ? gidMatch[1] : "0";
      return `https://docs.google.com/spreadsheets/d/${sheetId}/export?format=csv&gid=${gid}`;
    }
    return null;
  } catch {
    return null;
  }
}

// Fetch and parse Google Sheet data
async function fetchGoogleSheetData(url: string): Promise<Record<string, string>[] | null> {
  try {
    const csvUrl = getGoogleSheetCsvUrl(url);
    if (!csvUrl) {
      console.error("Could not extract Google Sheet ID from URL:", url);
      return null;
    }
    
    const response = await fetch(csvUrl, {
      headers: {
        "Accept": "text/csv",
      },
    });
    
    if (!response.ok) {
      console.error("Failed to fetch Google Sheet:", response.status, response.statusText);
      return null;
    }
    
    const csvText = await response.text();
    return csvToJson(csvText);
  } catch (error) {
    console.error("Error fetching Google Sheet:", error);
    return null;
  }
}

// Process team data, fetching Google Sheets content as needed
async function processTeamData(rawData: TeamDataRaw[]): Promise<TeamDataProcessed[]> {
  const processed: TeamDataProcessed[] = [];
  
  for (const data of rawData) {
    const content = data.data_content as Record<string, unknown>;
    
    if (content.__type === "google_sheet" && typeof content.url === "string") {
      // Fetch Google Sheet data
      const sheetData = await fetchGoogleSheetData(content.url);
      if (sheetData && sheetData.length > 0) {
        processed.push({
          data_name: data.data_name,
          data_content: sheetData,
          description: data.description,
          source_type: "google_sheet",
        });
      } else {
        // If fetch fails, still include a note
        processed.push({
          data_name: data.data_name,
          data_content: { error: "No se pudo cargar el Google Sheet. Verifica que esté publicado." },
          description: data.description,
          source_type: "google_sheet",
        });
      }
    } else {
      // Regular JSON data
      processed.push({
        data_name: data.data_name,
        data_content: content,
        description: data.description,
        source_type: "json",
      });
    }
  }
  
  return processed;
}

function formatCoursesForContext(courses: CourseWithDetails[]): string {
  if (!courses || courses.length === 0) return "";

  let context = "\n\n---\nCURSOS DISPONIBLES EN LA PLATAFORMA:\n";
  context += `Total de cursos: ${courses.length}\n`;
  
  for (const course of courses) {
    context += `\n### ${course.title}`;
    if (course.description) {
      context += `\n${course.description}`;
    }
    context += `\n- Dimensión: ${course.dimension}, Dificultad: ${course.difficulty}, Puntos: ${course.points}`;
    if (course.estimated_duration_minutes) {
      context += `, Duración: ${course.estimated_duration_minutes} minutos`;
    }
    if (course.objectives && course.objectives.length > 0) {
      context += `\n- Objetivos: ${course.objectives.join(", ")}`;
    }
    if (course.tags && course.tags.length > 0) {
      context += `\n- Etiquetas: ${course.tags.join(", ")}`;
    }
    if (course.materials && course.materials.length > 0) {
      context += `\n- Contenidos (${course.materials.length}):`;
      for (const mat of course.materials) {
        context += `\n  * ${mat.title} (${mat.type})`;
      }
    }
    if (course.quizzes && course.quizzes.length > 0) {
      context += `\n- Evaluaciones (${course.quizzes.length}):`;
      for (const quiz of course.quizzes) {
        context += `\n  * ${quiz.title} - Puntaje mínimo: ${quiz.passing_score}%`;
        if (quiz.questions && quiz.questions.length > 0) {
          context += ` (${quiz.questions.length} preguntas)`;
        }
      }
    }
  }
  
  context += "\n---\n";
  context += "Usa esta información para responder preguntas sobre cursos, contenidos, evaluaciones y requisitos de capacitación.\n";
  return context;
}

function formatMaterialsForContext(materials: TrainingMaterialWithCategory[]): string {
  if (!materials || materials.length === 0) return "";

  let context = "\n\n---\nMATERIALES DE FORMACIÓN:\n";
  context += `Total de materiales: ${materials.length}\n`;
  
  // Group by category for better organization
  const byCategory = new Map<string, TrainingMaterialWithCategory[]>();
  for (const material of materials) {
    const categoryName = material.category?.name || "Sin categoría";
    if (!byCategory.has(categoryName)) {
      byCategory.set(categoryName, []);
    }
    byCategory.get(categoryName)!.push(material);
  }
  
  for (const [categoryName, categoryMaterials] of byCategory) {
    context += `\n## ${categoryName} (${categoryMaterials.length} materiales)`;
    for (const material of categoryMaterials) {
      context += `\n### ${material.title} (${material.type})`;
      if (material.description) {
        context += `\n${material.description}`;
      }
      if (material.keywords && material.keywords.length > 0) {
        context += `\n- Palabras clave: ${material.keywords.join(", ")}`;
      }
      if (material.content_text) {
        // Include a summary of the content if available (limit to avoid too much text)
        const contentPreview = material.content_text.slice(0, 500);
        context += `\n- Contenido: ${contentPreview}${material.content_text.length > 500 ? "..." : ""}`;
      }
    }
  }
  
  context += "\n---\n";
  context += "Usa estos materiales para responder preguntas sobre documentación, guías, videos y recursos de capacitación.\n";
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

    // Rate limiting per user
    if (!checkRateLimit(user.id)) {
      return new Response(
        JSON.stringify({ error: "Demasiadas solicitudes. Por favor, intenta de nuevo en un momento." }),
        {
          status: 429,
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

    // Fetch all context data in parallel - no limits to include ALL content
    const [configResult, teamDataResult, coursesResult, materialsResult, announcementsResult, glossaryResult] = await Promise.all([
      supabase.from("chatbot_config").select("system_prompt, auto_generated_prompt").single(),
      supabase.from("chatbot_team_data").select("data_name, data_content, description").order("created_at", { ascending: false }),
      supabase.from("courses").select(`
        title, description, dimension, difficulty, points, estimated_duration_minutes, objectives, tags,
        course_materials:course_materials(title, type),
        quizzes:quizzes(title, passing_score, questions:quiz_questions(question))
      `).eq("status", "published"),
      supabase.from("training_materials").select(`
        title, description, type, keywords, content_text,
        category:material_categories(name)
      `).eq("is_published", true),
      supabase.from("announcements").select("title, content, type").order("created_at", { ascending: false }).limit(20),
      supabase.from("glossary_terms").select("term, definition, example"),
    ]);

    const configData = configResult.data as { system_prompt?: string; auto_generated_prompt?: string } | null;
    const manualPrompt = configData?.system_prompt || 
      "Eres un asistente virtual experto en procesos comerciales. Responde de manera clara, concisa y profesional en español.";
    const autoPrompt = configData?.auto_generated_prompt || "";

    // Use auto-generated prompt as base if available, otherwise fall back to manual + dynamic
    let systemPrompt = autoPrompt 
      ? `${manualPrompt}\n\n${autoPrompt}` 
      : manualPrompt;

    // Always append dynamic context on top of stored prompt
    systemPrompt += "\n\nTienes acceso a toda la información de la plataforma de capacitación. Usa este conocimiento para ayudar a los usuarios.";
    
    // Process team data (including fetching Google Sheets)
    const rawTeamData = teamDataResult.data as TeamDataRaw[] | null;
    if (rawTeamData && rawTeamData.length > 0) {
      const processedTeamData = await processTeamData(rawTeamData);
      if (processedTeamData.length > 0) {
        systemPrompt += formatTeamDataForContext(processedTeamData);
      }
    }

    // Process courses with nested data
    const coursesRaw = coursesResult.data;
    if (coursesRaw && coursesRaw.length > 0) {
      const courses: CourseWithDetails[] = coursesRaw.map((c: Record<string, unknown>) => ({
        title: c.title as string,
        description: c.description as string | null,
        dimension: c.dimension as string,
        difficulty: c.difficulty as string,
        points: c.points as number,
        estimated_duration_minutes: c.estimated_duration_minutes as number | null,
        objectives: c.objectives as string[] | null,
        tags: c.tags as string[] | null,
        materials: c.course_materials as CourseMaterial[] | null,
        quizzes: c.quizzes as Quiz[] | null,
      }));
      systemPrompt += formatCoursesForContext(courses);
    }

    // Process materials with category
    const materialsRaw = materialsResult.data;
    if (materialsRaw && materialsRaw.length > 0) {
      const materials: TrainingMaterialWithCategory[] = materialsRaw.map((m: Record<string, unknown>) => ({
        title: m.title as string,
        description: m.description as string | null,
        type: m.type as string,
        keywords: m.keywords as string[] | null,
        content_text: m.content_text as string | null,
        category: m.category as MaterialCategory | null,
      }));
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
