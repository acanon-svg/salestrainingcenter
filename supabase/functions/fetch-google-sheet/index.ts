import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { url } = await req.json();

    if (!url || typeof url !== 'string') {
      return new Response(
        JSON.stringify({ error: 'URL del Google Sheet es requerida' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Extract sheet ID
    const idMatch = url.match(/\/d\/([a-zA-Z0-9_-]+)/);
    if (!idMatch) {
      return new Response(
        JSON.stringify({ error: 'URL de Google Sheet inválida' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const sheetId = idMatch[1];

    // Extract gid if present
    const gidMatch = url.match(/[?&#]gid=(\d+)/);
    const gid = gidMatch ? gidMatch[1] : '0';

    const csvUrl = `https://docs.google.com/spreadsheets/d/${sheetId}/export?format=csv&gid=${gid}`;

    console.log(`Fetching Google Sheet: ${csvUrl}`);

    const response = await fetch(csvUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0',
      },
      redirect: 'follow',
    });

    if (!response.ok) {
      const statusText = response.statusText || 'Unknown error';
      console.error(`Google Sheets responded with ${response.status}: ${statusText}`);
      return new Response(
        JSON.stringify({ 
          error: `No se pudo acceder al Sheet (${response.status}). Asegúrate de que sea público o esté compartido con "Cualquiera con el enlace".` 
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const csvText = await response.text();

    // Check if Google returned an HTML error page instead of CSV
    if (csvText.startsWith('<!DOCTYPE') || csvText.startsWith('<html')) {
      return new Response(
        JSON.stringify({ 
          error: 'El Sheet no es accesible. Asegúrate de que sea público o compartido con "Cualquiera con el enlace".' 
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ csv: csvText }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error fetching Google Sheet:', error);
    return new Response(
      JSON.stringify({ error: `Error al obtener el Sheet: ${error.message}` }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
