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

function validateMessages(messages: unknown): { valid: boolean; error?: string } {
  // Check if messages is an array
  if (!Array.isArray(messages)) {
    return { valid: false, error: "El formato de mensajes es inválido." };
  }

  // Check if array is empty
  if (messages.length === 0) {
    return { valid: false, error: "Se requiere al menos un mensaje." };
  }

  // Check message count limit
  if (messages.length > MAX_MESSAGES) {
    return { valid: false, error: `Demasiados mensajes. Máximo ${MAX_MESSAGES} mensajes permitidos.` };
  }

  // Validate each message
  for (let i = 0; i < messages.length; i++) {
    const msg = messages[i];

    // Check message structure
    if (!msg || typeof msg !== "object") {
      return { valid: false, error: `Mensaje ${i + 1} tiene formato inválido.` };
    }

    // Check role
    if (!msg.role || typeof msg.role !== "string" || !VALID_ROLES.includes(msg.role)) {
      return { valid: false, error: `Rol de mensaje ${i + 1} es inválido.` };
    }

    // Check content
    if (typeof msg.content !== "string") {
      return { valid: false, error: `Contenido del mensaje ${i + 1} es inválido.` };
    }

    // Check content length
    if (msg.content.length > MAX_MESSAGE_LENGTH) {
      return { valid: false, error: `Mensaje ${i + 1} excede el límite de ${MAX_MESSAGE_LENGTH} caracteres.` };
    }

    // Check for empty content in user messages
    if (msg.role === "user" && msg.content.trim().length === 0) {
      return { valid: false, error: `El mensaje ${i + 1} no puede estar vacío.` };
    }
  }

  return { valid: true };
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
    const supabase = createClient(supabaseUrl, supabaseAnonKey);

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

    // Parse request body with size limit check
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

    // Fetch system prompt server-side (don't trust client input)
    const { data: config } = await supabase
      .from("chatbot_config")
      .select("system_prompt")
      .single();

    const systemPrompt = config?.system_prompt || 
      "Eres un asistente virtual experto en procesos comerciales. Responde de manera clara, concisa y profesional en español.";

    // Sanitize messages before sending to AI (only keep role and content)
    const sanitizedMessages = (messages as ChatMessage[]).map((msg) => ({
      role: msg.role,
      content: msg.content.slice(0, MAX_MESSAGE_LENGTH), // Extra safety trim
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
