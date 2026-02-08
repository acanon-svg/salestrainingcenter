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
    const { url, sheetName } = await req.json();

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

    // Extract gid if present in URL
    const gidMatch = url.match(/[?&#]gid=(\d+)/);
    const gid = gidMatch ? gidMatch[1] : null;

    // Build the gviz/tq URL - this endpoint works for "Anyone with the link" sheets
    // and returns calculated/formulated values (not raw formulas)
    let csvUrl: string;
    
    if (sheetName) {
      // Use sheet name to target specific tab
      csvUrl = `https://docs.google.com/spreadsheets/d/${sheetId}/gviz/tq?tqx=out:csv&sheet=${encodeURIComponent(sheetName)}`;
    } else if (gid) {
      // Use gid from URL
      csvUrl = `https://docs.google.com/spreadsheets/d/${sheetId}/gviz/tq?tqx=out:csv&gid=${gid}`;
    } else {
      // Default: first sheet
      csvUrl = `https://docs.google.com/spreadsheets/d/${sheetId}/gviz/tq?tqx=out:csv`;
    }

    console.log(`Fetching Google Sheet via gviz: ${csvUrl}`);

    const response = await fetch(csvUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; Googlebot/2.1)',
      },
      redirect: 'follow',
    });

    if (!response.ok) {
      const statusText = response.statusText || 'Unknown error';
      const bodyText = await response.text();
      console.error(`Google Sheets responded with ${response.status}: ${statusText}`, bodyText.substring(0, 500));
      
      // If gviz fails, try the pub endpoint as fallback
      const pubUrl = `https://docs.google.com/spreadsheets/d/${sheetId}/pub?output=csv${gid ? `&gid=${gid}` : ''}${sheetName ? `&sheet=${encodeURIComponent(sheetName)}` : ''}`;
      console.log(`Trying pub fallback: ${pubUrl}`);
      
      const pubResponse = await fetch(pubUrl, {
        headers: { 'User-Agent': 'Mozilla/5.0 (compatible; Googlebot/2.1)' },
        redirect: 'follow',
      });
      
      if (!pubResponse.ok) {
        console.error(`Pub fallback also failed with ${pubResponse.status}`);
        return new Response(
          JSON.stringify({ 
            error: `No se pudo acceder al Sheet (${response.status}). Verifica que el Sheet esté compartido con "Cualquiera con el enlace" como Lector.` 
          }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      const pubCsv = await pubResponse.text();
      if (pubCsv.startsWith('<!DOCTYPE') || pubCsv.startsWith('<html')) {
        return new Response(
          JSON.stringify({ error: 'El Sheet no es accesible. Asegúrate de compartirlo con "Cualquiera con el enlace" como Lector.' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      return new Response(
        JSON.stringify({ csv: pubCsv }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const csvText = await response.text();

    // Check if Google returned an HTML error page instead of CSV
    if (csvText.startsWith('<!DOCTYPE') || csvText.startsWith('<html')) {
      return new Response(
        JSON.stringify({ 
          error: 'El Sheet no es accesible. Asegúrate de compartirlo con "Cualquiera con el enlace" como Lector.' 
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
