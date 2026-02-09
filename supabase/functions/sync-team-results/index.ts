import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

// Fixed UUID for auto-sync batch (deterministic, won't conflict with random UUIDs)
const BATCH_ID = '00000000-0000-0000-0000-000000000001';

function normalizeHeader(h: string): string {
  return h
    .toLowerCase()
    .trim()
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/"/g, "")
    .replace(/\s+/g, "_");
}

interface ParsedRow {
  user_email: string;
  regional?: string;
  team?: string;
  firmas_real: number;
  firmas_meta: number;
  originaciones_real: number;
  originaciones_meta: number;
  gmv_real: number;
  gmv_meta: number;
  period_date: string;
  weeks_in_month: number;
  dias_habiles_transcurridos: number;
  dias_habiles_mes: number;
  batch_id: string;
}

function parseCSV(csvText: string): { headers: string[]; rows: Record<string, string>[] } {
  const lines = csvText.split('\n').filter(l => l.trim());
  if (lines.length === 0) return { headers: [], rows: [] };

  // Parse CSV respecting quoted fields
  const parseLine = (line: string): string[] => {
    const result: string[] = [];
    let current = '';
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (ch === '"') {
        if (inQuotes && line[i + 1] === '"') {
          current += '"';
          i++;
        } else {
          inQuotes = !inQuotes;
        }
      } else if (ch === ',' && !inQuotes) {
        result.push(current.trim());
        current = '';
      } else {
        current += ch;
      }
    }
    result.push(current.trim());
    return result;
  };

  const headers = parseLine(lines[0]).map(h => normalizeHeader(h));
  const rows: Record<string, string>[] = [];

  for (let i = 1; i < lines.length; i++) {
    const values = parseLine(lines[i]);
    if (values.every(v => !v)) continue; // skip empty rows
    const row: Record<string, string> = {};
    headers.forEach((h, idx) => {
      row[h] = (values[idx] || '').replace(/^"|"$/g, '');
    });
    rows.push(row);
  }

  return { headers, rows };
}

function parseRows(rows: Record<string, string>[]): { data: ParsedRow[]; errors: string[] } {
  const data: ParsedRow[] = [];
  const errors: string[] = [];

  rows.forEach((row, idx) => {
    const email = row.correo || row.email || row.user_email;
    if (!email) {
      errors.push(`Fila ${idx + 2}: Falta correo`);
      return;
    }

    let periodDate: string;
    const mes = row.mes || row.month;
    const ano = row.ano || row.año || row.year;

    if (mes && ano) {
      const monthNum = Number(mes);
      const yearNum = Number(ano);
      if (monthNum < 1 || monthNum > 12 || isNaN(monthNum)) {
        errors.push(`Fila ${idx + 2}: Mes inválido "${mes}"`);
        return;
      }
      if (yearNum < 2020 || yearNum > 2100 || isNaN(yearNum)) {
        errors.push(`Fila ${idx + 2}: Año inválido "${ano}"`);
        return;
      }
      periodDate = `${yearNum}-${String(monthNum).padStart(2, "0")}-01`;
    } else {
      const dateVal = row.fecha || row.date || row.period_date;
      if (!dateVal) {
        errors.push(`Fila ${idx + 2}: Falta mes/año o fecha`);
        return;
      }
      const parsed = new Date(dateVal);
      if (isNaN(parsed.getTime())) {
        errors.push(`Fila ${idx + 2}: Fecha inválida "${dateVal}"`);
        return;
      }
      periodDate = parsed.toISOString().split("T")[0];
    }

    const weeksRaw = row.semanas || row.weeks || row.weeks_in_month;
    const weeksInMonth = weeksRaw ? Number(weeksRaw) : 4;

    const diasTranscurridos = Number(row.dias_habiles_transcurridos) || 0;
    const diasMes = Number(row.dias_habiles_mes) || 0;

    data.push({
      user_email: String(email).trim().toLowerCase(),
      regional: row.regional || undefined,
      team: row.equipo || row.team || undefined,
      firmas_real: Number(row.firmas_real) || 0,
      firmas_meta: Number(row.firmas_meta) || 0,
      originaciones_real: Number(row.originaciones_real) || 0,
      originaciones_meta: Number(row.originaciones_meta) || 0,
      gmv_real: Number(row.gmv_real) || 0,
      gmv_meta: Number(row.gmv_meta) || 0,
      period_date: periodDate,
      weeks_in_month: weeksInMonth < 1 || weeksInMonth > 6 ? 4 : weeksInMonth,
      dias_habiles_transcurridos: diasTranscurridos,
      dias_habiles_mes: diasMes,
      batch_id: BATCH_ID,
    });
  });

  return { data, errors };
}

async function fetchGoogleSheet(sheetId: string, sheetName: string): Promise<string> {
  const csvUrl = `https://docs.google.com/spreadsheets/d/${sheetId}/gviz/tq?tqx=out:csv&sheet=${encodeURIComponent(sheetName)}`;
  console.log(`[sync] Fetching Google Sheet: ${csvUrl}`);

  const response = await fetch(csvUrl, {
    headers: { 'User-Agent': 'Mozilla/5.0 (compatible; Googlebot/2.1)' },
    redirect: 'follow',
  });

  if (!response.ok) {
    // Try pub fallback
    const pubUrl = `https://docs.google.com/spreadsheets/d/${sheetId}/pub?output=csv&sheet=${encodeURIComponent(sheetName)}`;
    const pubResponse = await fetch(pubUrl, {
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; Googlebot/2.1)' },
      redirect: 'follow',
    });
    if (!pubResponse.ok) {
      throw new Error(`Could not access sheet (${response.status})`);
    }
    return await pubResponse.text();
  }

  const text = await response.text();
  if (text.startsWith('<!DOCTYPE') || text.startsWith('<html')) {
    throw new Error('Sheet is not accessible. Make sure it is shared with "Anyone with the link".');
  }
  return text;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    // Check if called manually (with body) or by cron (no body)
    let forceSync = false;
    try {
      const body = await req.json();
      forceSync = body?.force === true;
    } catch {
      // No body = cron call
    }

    // Read sync config from app_settings
    const { data: configRow, error: configError } = await supabase
      .from('app_settings')
      .select('*')
      .eq('key', 'results_sync_config')
      .maybeSingle();

    if (configError) {
      throw new Error(`Error reading config: ${configError.message}`);
    }

    if (!configRow) {
      return new Response(
        JSON.stringify({ message: 'No sync config found. Set up auto-sync first.' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const config = configRow.value as any;

    if (!config.enabled && !forceSync) {
      return new Response(
        JSON.stringify({ message: 'Auto-sync is disabled' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!config.sheet_url) {
      return new Response(
        JSON.stringify({ message: 'No sheet URL configured' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Extract sheet ID
    const idMatch = config.sheet_url.match(/\/d\/([a-zA-Z0-9_-]+)/);
    if (!idMatch) {
      await updateSyncStatus(supabase, configRow.id, config, 'error', 0, 'Invalid sheet URL');
      return new Response(
        JSON.stringify({ error: 'Invalid Google Sheet URL' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const sheetId = idMatch[1];
    const sheetName = config.sheet_name || 'Resultados';

    // Fetch the sheet
    const csvText = await fetchGoogleSheet(sheetId, sheetName);

    // Parse CSV
    const { headers, rows } = parseCSV(csvText);
    console.log(`[sync] Parsed ${rows.length} rows with headers: ${headers.join(', ')}`);

    const { data: parsedData, errors } = parseRows(rows);

    if (errors.length > 0) {
      console.warn(`[sync] Parse warnings: ${errors.join('; ')}`);
    }

    if (parsedData.length === 0) {
      await updateSyncStatus(supabase, configRow.id, config, 'error', 0, 'No valid data found in sheet');
      return new Response(
        JSON.stringify({ error: 'No valid data found', parse_errors: errors }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Upsert data in chunks (uses unique index on user_email + period_date)
    const chunkSize = 500;
    let totalInserted = 0;
    for (let i = 0; i < parsedData.length; i += chunkSize) {
      const chunk = parsedData.slice(i, i + chunkSize);
      const { error: upsertError } = await supabase
        .from('team_results')
        .upsert(chunk, { onConflict: 'user_email,period_date' });

      if (upsertError) {
        await updateSyncStatus(supabase, configRow.id, config, 'error', totalInserted, `Upsert error: ${upsertError.message}`);
        throw new Error(`Upsert error at chunk ${i}: ${upsertError.message}`);
      }
      totalInserted += chunk.length;
    }

    // Update sync status
    await updateSyncStatus(supabase, configRow.id, config, 'success', totalInserted);

    console.log(`[sync] Successfully synced ${totalInserted} records`);

    return new Response(
      JSON.stringify({
        success: true,
        count: totalInserted,
        parse_errors: errors,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('[sync] Error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

async function updateSyncStatus(
  supabase: any,
  settingId: string,
  currentConfig: any,
  status: 'success' | 'error',
  count: number,
  errorMsg?: string
) {
  const updatedConfig = {
    ...currentConfig,
    last_sync_at: new Date().toISOString(),
    last_sync_status: status,
    last_sync_count: count,
    last_sync_error: errorMsg || null,
  };

  await supabase
    .from('app_settings')
    .update({ value: updatedConfig, updated_at: new Date().toISOString() })
    .eq('id', settingId);
}
