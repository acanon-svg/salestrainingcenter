import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Input validation limits
const MAX_CSV_ROWS = 10000;
const MAX_FIELD_LENGTH = 2000;

function sanitizeField(val: string | undefined, maxLen = MAX_FIELD_LENGTH): string {
  if (!val) return '';
  return val.slice(0, maxLen).replace(/[<>]/g, '');
}

function sanitizeEmail(val: string | undefined): string {
  if (!val) return '';
  const trimmed = val.toLowerCase().trim().slice(0, 255);
  // Basic email format check
  if (trimmed && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) return '';
  return trimmed;
}

const SHEET_URLS = {
  accompaniments: 'https://docs.google.com/spreadsheets/d/152_aEBvS0wl3n2petIKJcCEGZGZ-wITadqhdrURt69M/gviz/tq?tqx=out:csv&gid=411783362',
  universal_feedback: 'https://docs.google.com/spreadsheets/d/1GWoyyE663HVEZoe69mYyDIHpBY-rNzZ5lqo5vaF9uqc/gviz/tq?tqx=out:csv&gid=1529236555',
  quality: 'https://docs.google.com/spreadsheets/d/1T6o1RpK8c-vfhqy6fPxb2L2D9RHSQ7xF7J2zapZeX1c/gviz/tq?tqx=out:csv&gid=1974982985',
};

function parseCSV(csv: string): string[][] {
  const rows: string[][] = [];
  let current = '';
  let inQuotes = false;
  let row: string[] = [];
  
  for (let i = 0; i < csv.length; i++) {
    const ch = csv[i];
    if (inQuotes) {
      if (ch === '"' && csv[i + 1] === '"') {
        current += '"';
        i++;
      } else if (ch === '"') {
        inQuotes = false;
      } else {
        current += ch;
      }
    } else {
      if (ch === '"') {
        inQuotes = true;
      } else if (ch === ',') {
        row.push(current.trim());
        current = '';
      } else if (ch === '\n' || (ch === '\r' && csv[i + 1] === '\n')) {
        row.push(current.trim());
        current = '';
        if (row.some(c => c !== '')) rows.push(row);
        row = [];
        if (ch === '\r') i++;
      } else {
        current += ch;
      }
    }
  }
  if (current || row.length) {
    row.push(current.trim());
    if (row.some(c => c !== '')) rows.push(row);
  }
  return rows;
}

function parseDate(dateStr: string): string | null {
  if (!dateStr) return null;
  // Try M/D/YYYY H:MM:SS format
  const match = dateStr.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})\s*(\d{1,2}):(\d{2}):(\d{2})?/);
  if (match) {
    const [, m, d, y, h, min, sec] = match;
    return `${y}-${m.padStart(2,'0')}-${d.padStart(2,'0')}T${h.padStart(2,'0')}:${min}:${(sec||'00').padStart(2,'0')}`;
  }
  // Try M/D/YYYY format
  const match2 = dateStr.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (match2) {
    const [, m, d, y] = match2;
    return `${y}-${m.padStart(2,'0')}-${d.padStart(2,'0')}`;
  }
  return null;
}

function extractCraftLevel(text: string): string {
  if (!text) return '';
  const match = text.match(/^(A\d)/);
  return match ? match[1] : text.trim();
}

async function fetchSheet(url: string): Promise<string[][]> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 30000); // 30s timeout
  const res = await fetch(url, {
    headers: { 'User-Agent': 'Mozilla/5.0 (compatible; Googlebot/2.1)' },
    redirect: 'follow',
    signal: controller.signal,
  });
  clearTimeout(timeout);
  if (!res.ok) throw new Error(`Failed to fetch sheet: ${res.status}`);
  const csv = await res.text();
  if (csv.length > 10 * 1024 * 1024) {
    throw new Error('Sheet data exceeds 10MB limit');
  }
  if (csv.startsWith('<!DOCTYPE') || csv.startsWith('<html')) {
    throw new Error('Sheet not accessible');
  }
  return parseCSV(csv);
}

async function syncAccompaniments(supabase: any) {
  const rows = await fetchSheet(SHEET_URLS.accompaniments);
  if (rows.length < 2) return { synced: 0 };
  if (rows.length > MAX_CSV_ROWS) throw new Error(`Sheet exceeds ${MAX_CSV_ROWS} row limit`);

  // Headers are row 0
  const dataRows = rows.slice(1);
  
  // Delete existing and re-insert (simpler than upsert for denormalized sheets)
  await supabase.from('followup_accompaniments').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  
  const records: any[] = [];
  
  for (let ri = 0; ri < dataRows.length; ri++) {
    const r = dataRows[ri];
    const timestamp = parseDate(r[0]);
    if (!timestamp) continue;
    
    const evaluatorEmail = sanitizeEmail(r[1]);
    const regional = sanitizeField(r[2]);
    
    // The sheet has up to 6 executive slots - find which one has data
    const execSlots = [
      { name: r[3], email: r[4] },
      { name: r[5], email: r[6] },
      { name: r[7], email: r[8] },
      { name: r[9], email: r[10] },
      { name: r[11], email: r[12] },
      { name: r[13], email: r[14] },
    ];
    
    // Find the slot that has an email
    const exec = execSlots.find(s => s.email && s.email.trim());
    if (!exec || !exec.email || !sanitizeEmail(exec.email)) continue;
    
    records.push({
      timestamp,
      evaluator_email: evaluatorEmail,
      regional,
      executive_name: (exec.name || '').trim(),
      executive_email: exec.email.toLowerCase().trim(),
      craft_negociacion: extractCraftLevel(r[15]),
      craft_manejo_objeciones: extractCraftLevel(r[16]),
      craft_persuasion: extractCraftLevel(r[17]),
      craft_herramientas: extractCraftLevel(r[18]),
      craft_conocimiento_productos: extractCraftLevel(r[19]),
      comp_abordaje: parseInt(r[20]) || null,
      comp_pitch_comercial: parseInt(r[21]) || null,
      comp_claridad_negociacion: parseInt(r[22]) || null,
      comp_conocimiento_confianza: parseInt(r[23]) || null,
      comp_objeciones_cierre: parseInt(r[24]) || null,
      comp_optimiza_zona: parseInt(r[25]) || null,
      necesidades_identificadas: r[26] || null,
      oportunidades_entrenamiento: r[27] || null,
      observaciones: r[28] || null,
      fecha_nuevo_acompanamiento: r[29] || null,
      evidencia_url: r[30] || null,
      google_sheets_row_id: `acc_${ri}`,
      synced_at: new Date().toISOString(),
    });
  }

  if (records.length > 0) {
    // Insert in batches of 50
    for (let i = 0; i < records.length; i += 50) {
      const batch = records.slice(i, i + 50);
      const { error } = await supabase.from('followup_accompaniments').insert(batch);
      if (error) console.error('Error inserting accompaniments batch:', error);
    }
  }
  
  return { synced: records.length };
}

async function syncUniversalFeedback(supabase: any) {
  const rows = await fetchSheet(SHEET_URLS.universal_feedback);
  if (rows.length < 2) return { synced: 0 };
  if (rows.length > MAX_CSV_ROWS) throw new Error(`Sheet exceeds ${MAX_CSV_ROWS} row limit`);

  const dataRows = rows.slice(1);
  await supabase.from('followup_universal_feedback').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  
  const records: any[] = [];
  
  for (let ri = 0; ri < dataRows.length; ri++) {
    const r = dataRows[ri];
    const timestamp = parseDate(r[0]);
    if (!timestamp) continue;
    
    const leaderEmail = (r[1] || '').toLowerCase().trim();
    const team = r[2] || '';
    const regional = r[3] || '';
    
    // Up to 9 executive slots (each has: name, email, date, type)
    const slotOffsets = [4, 8, 12, 16, 20, 24, 28, 32, 36];
    
    for (const offset of slotOffsets) {
      const execName = (r[offset] || '').trim();
      const execEmail = (r[offset + 1] || '').toLowerCase().trim();
      const feedbackDate = r[offset + 2] || '';
      const feedbackType = (r[offset + 3] || '').trim();
      
      if (!execEmail || !feedbackType) continue;
      
      const record: any = {
        timestamp,
        leader_email: leaderEmail,
        team,
        regional,
        executive_name: execName,
        executive_email: execEmail,
        feedback_date: parseDate(feedbackDate) || null,
        feedback_type: feedbackType,
        google_sheets_row_id: `uf_${ri}_${offset}`,
        synced_at: new Date().toISOString(),
      };
      
      // Map fields based on feedback type
      if (feedbackType === 'Feedback 1-1' || feedbackType === 'Feedback Recurrente' || feedbackType === 'Feedback de Oportunidad') {
        record.hecho_observado = r[40] || null;
        record.regla_metrica = r[41] || null;
        record.impacto_incumplimiento = r[42] || null;
        record.expectativa_clara = r[43] || null;
        record.plan_apoyo = r[44] || null;
        record.compromiso_colega = r[45] || null;
        record.consecuencia = r[46] || null;
        record.proxima_fecha_revision = r[47] || null;
      } else if (feedbackType === 'PDP Inicial' || feedbackType === 'PDP') {
        record.duracion_plan = r[48] || null;
        record.diagnostico_desempeno = r[49] || null;
        record.objetivo_metrica_exito = r[50] || null;
        record.plan_accion_semanas = r[51] || null;
        record.seguimiento_reuniones = r[52] || null;
        record.evaluacion_final = r[53] || null;
        record.conclusiones_plan = r[54] || null;
        record.acciones_resaltar = r[55] || null;
      } else if (feedbackType === 'Seguimiento al PDP' || feedbackType === 'Resultado del PDP') {
        record.regla_metrica_seguimiento = r[56] || null;
        record.impacto_seguimiento = r[57] || null;
        record.expectativa_seguimiento = r[58] || null;
        record.plan_apoyo_seguimiento = r[59] || null;
        record.compromiso_seguimiento = r[60] || null;
        record.consecuencia_seguimiento = r[61] || null;
        record.proxima_fecha_feedback = r[62] || null;
        record.oportunidades_trabajar = r[63] || null;
      }
      
      records.push(record);
    }
  }

  if (records.length > 0) {
    for (let i = 0; i < records.length; i += 50) {
      const batch = records.slice(i, i + 50);
      const { error } = await supabase.from('followup_universal_feedback').insert(batch);
      if (error) console.error('Error inserting universal feedback batch:', error);
    }
  }
  
  return { synced: records.length };
}

async function syncQualityEvaluations(supabase: any) {
  const rows = await fetchSheet(SHEET_URLS.quality);
  if (rows.length < 2) return { synced: 0 };
  if (rows.length > MAX_CSV_ROWS) throw new Error(`Sheet exceeds ${MAX_CSV_ROWS} row limit`);

  const dataRows = rows.slice(1);
  await supabase.from('followup_quality_evaluations').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  
  const records: any[] = [];
  const siNo = (val: string) => val?.toUpperCase() === 'SI';
  
  for (let ri = 0; ri < dataRows.length; ri++) {
    const r = dataRows[ri];
    const timestamp = parseDate(r[0]);
    if (!timestamp) continue;
    
    const hunterName = (r[14] || '').trim();
    const hunterEmail = (r[15] || '').toLowerCase().trim();
    if (!hunterEmail) continue;
    
    const scoreText = (r[2] || '').trim();
    const scoreMatch = scoreText.match(/(\d+)/);
    const scoreNumeric = scoreMatch ? parseInt(scoreMatch[1]) : null;
    
    records.push({
      timestamp,
      score: scoreText,
      score_numeric: scoreNumeric,
      info_comercial_correcta: siNo(r[3]),
      formatos_slug_correctos: siNo(r[4]),
      flujo_salesforce_correcto: siNo(r[5]),
      bot_actualizacion_correos: siNo(r[6]),
      valida_duplicidad_sf: siNo(r[7]),
      documentos_completos: siNo(r[8]),
      red_social_correcta: siNo(r[9]),
      fotos_correctas_primer_intento: siNo(r[10]),
      cumple_requisitos_activacion: siNo(r[11]),
      gestion_tyc_oportuna: siNo(r[12]),
      calificacion_aliados: r[13] || null,
      hunter_name: hunterName,
      hunter_email: hunterEmail,
      leader_email: (r[16] || '').toLowerCase().trim() || null,
      recomendacion_compromisos: r[17] || null,
      slug_monitoreado: r[18] || null,
      slug_monitoreado_2: r[19] || null,
      evaluation_date: parseDate(r[20]) || null,
      google_sheets_row_id: `qe_${ri}`,
      synced_at: new Date().toISOString(),
    });
  }

  if (records.length > 0) {
    for (let i = 0; i < records.length; i += 50) {
      const batch = records.slice(i, i + 50);
      const { error } = await supabase.from('followup_quality_evaluations').insert(batch);
      if (error) console.error('Error inserting quality evaluations batch:', error);
    }
  }
  
  return { synced: records.length };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // This function can be called by authenticated users or by cron
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    // Use service role to bypass RLS for inserts
    const supabase = createClient(supabaseUrl, serviceRoleKey);
    
    // Optionally verify the caller is authenticated
    const authHeader = req.headers.get('Authorization');
    if (authHeader?.startsWith('Bearer ')) {
      const anonClient = createClient(supabaseUrl, Deno.env.get('SUPABASE_ANON_KEY')!, {
        global: { headers: { Authorization: authHeader } },
      });
      const token = authHeader.replace('Bearer ', '');
      const { error } = await anonClient.auth.getClaims(token);
      if (error) {
        return new Response(JSON.stringify({ error: 'Unauthorized' }), {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
    }

    // Parse which sheets to sync
    let sheetsToSync = ['accompaniments', 'universal_feedback', 'quality'];
    try {
      const body = await req.json();
      if (body?.sheets && Array.isArray(body.sheets)) {
        sheetsToSync = body.sheets;
      }
    } catch { /* no body, sync all */ }

    const results: Record<string, any> = {};

    if (sheetsToSync.includes('accompaniments')) {
      try {
        results.accompaniments = await syncAccompaniments(supabase);
      } catch (e) {
        results.accompaniments = { error: e.message };
      }
    }

    if (sheetsToSync.includes('universal_feedback')) {
      try {
        results.universal_feedback = await syncUniversalFeedback(supabase);
      } catch (e) {
        results.universal_feedback = { error: e.message };
      }
    }

    if (sheetsToSync.includes('quality')) {
      try {
        results.quality = await syncQualityEvaluations(supabase);
      } catch (e) {
        results.quality = { error: e.message };
      }
    }

    return new Response(JSON.stringify({ success: true, results }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in sync-followups:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
