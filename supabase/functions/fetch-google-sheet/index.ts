import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Verify authentication
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const token = authHeader.replace('Bearer ', '');
    const { data: claimsData, error: claimsError } = await supabase.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const userId = claimsData.claims.sub;

    // Verify user has admin or creator role
    const { data: roles, error: rolesError } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', userId);

    if (rolesError) {
      return new Response(
        JSON.stringify({ error: 'Error checking permissions' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const userRoles = roles?.map((r: any) => r.role) || [];
    if (!userRoles.includes('admin') && !userRoles.includes('creator')) {
      return new Response(
        JSON.stringify({ error: 'Only admins and creators can fetch Google Sheets' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { url, sheetName } = await req.json();

    if (!url || typeof url !== 'string') {
      return new Response(
        JSON.stringify({ error: 'URL del Google Sheet es requerida' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate URL is a Google Sheets URL
    if (!url.startsWith('https://docs.google.com/spreadsheets/')) {
      return new Response(
        JSON.stringify({ error: 'Invalid Google Sheets URL' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (url.length > 500) {
      return new Response(
        JSON.stringify({ error: 'URL too long' }),
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

    let csvUrl: string;
    
    if (sheetName) {
      csvUrl = `https://docs.google.com/spreadsheets/d/${sheetId}/gviz/tq?tqx=out:csv&sheet=${encodeURIComponent(sheetName)}`;
    } else if (gid) {
      csvUrl = `https://docs.google.com/spreadsheets/d/${sheetId}/gviz/tq?tqx=out:csv&gid=${gid}`;
    } else {
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
      JSON.stringify({ error: 'Error al obtener el Sheet' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
