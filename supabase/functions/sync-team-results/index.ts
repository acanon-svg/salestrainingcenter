import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

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

function parseLine(line: string): string[] {
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
}

function parseCSV(csvText: string): { headers: string[]; rawRows: string[][] } {
  const lines = csvText.split('\n').filter(l => l.trim());
  if (lines.length === 0) return { headers: [], rawRows: [] };

  const headers = parseLine(lines[0]).map(h => normalizeHeader(h));
  const rawRows: string[][] = [];

  for (let i = 1; i < lines.length; i++) {
    const values = parseLine(lines[i]);
    if (values.every(v => !v)) continue;
    rawRows.push(values.map(v => v.replace(/^"|"$/g, '')));
  }

  return { headers, rawRows };
}

function isResumeFormat(headers: string[]): boolean {
  return !headers.some(h =>
    h.includes('correo') || h.includes('email') || h.includes('user_email')
  );
}

function parseNum(val: string | undefined): number {
  if (!val) return 0;
  return Number(val.replace(/%/g, '').replace(/,/g, '').replace(/\$/g, '').trim()) || 0;
}

/**
 * Parse Resume sheet format: fixed column positions
 * B(1)=Name, C(2)=Dia Meta, D(3)=Firmas Real, E(4)=Firmas Meta MtD, F(5)=Firmas Meta Mes,
 * G(6)=Cumpl MtD, H(7)=Cumpl Esperado,
 * (I=8 separator)
 * J(9)=Orig Real, K(10)=Orig Meta MtD, L(11)=Orig Meta Mes, M(12)=Cumpl MtD, N(13)=Cumpl Esperado,
 * (O=14 separator)
 * P(15)=GMV Real, Q(16)=GMV Meta MtD, R(17)=GMV Meta Mes, S(18)=Cumpl MtD, T(19)=Cumpl Esperado
 */
const EXCLUDED_NAMES = ['total', 'hunter', 'no info', ''];

function parseResumeRows(rawRows: string[][]): { data: ParsedRow[]; errors: string[] } {
  const data: ParsedRow[] = [];
  const errors: string[] = [];
  const now = new Date();
  const periodDate = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;

  for (let i = 0; i < rawRows.length; i++) {
    const cols = rawRows[i];
    const name = (cols[1] || '').trim(); // Column B - Name
    if (!name) continue;

    // Skip aggregate/invalid rows
    if (EXCLUDED_NAMES.includes(name.toLowerCase())) continue;

    // Column U (index 20) = Email of the executive
    const email = (cols[20] || '').trim().toLowerCase();
    // Use email if available, otherwise fall back to name
    const userIdentifier = email || name.toLowerCase().trim();

    const firmasReal = parseNum(cols[3]);      // D
    const firmasMetaMtd = parseNum(cols[4]);   // E
    const firmasMetaMes = parseNum(cols[5]);   // F

    const origReal = parseNum(cols[9]);        // J
    const origMetaMtd = parseNum(cols[10]);    // K
    const origMetaMes = parseNum(cols[11]);    // L

    const gmvReal = parseNum(cols[15]);        // P
    const gmvMetaMtd = parseNum(cols[16]);     // Q
    const gmvMetaMes = parseNum(cols[17]);     // R

    // Column V (index 21) = Días hábiles transcurridos from the sheet
    const diasHabilesTranscurridos = parseNum(cols[21]) || 0;

    // Back-calculate total business days from Meta MtD / Meta Mes ratio
    let diasHabilesMes = 20; // fallback
    if (diasHabilesTranscurridos > 0) {
      if (firmasMetaMes > 0 && firmasMetaMtd > 0) {
        diasHabilesMes = Math.round(diasHabilesTranscurridos / (firmasMetaMtd / firmasMetaMes));
      } else if (origMetaMes > 0 && origMetaMtd > 0) {
        diasHabilesMes = Math.round(diasHabilesTranscurridos / (origMetaMtd / origMetaMes));
      }
      if (diasHabilesMes < diasHabilesTranscurridos) diasHabilesMes = diasHabilesTranscurridos;
    }

    data.push({
      user_email: userIdentifier,
      firmas_real: firmasReal,
      firmas_meta: firmasMetaMes,
      originaciones_real: origReal,
      originaciones_meta: origMetaMes,
      gmv_real: gmvReal,
      gmv_meta: gmvMetaMes,
      period_date: periodDate,
      weeks_in_month: 4,
      dias_habiles_transcurridos: diasHabilesTranscurridos,
      dias_habiles_mes: diasHabilesMes,
      batch_id: BATCH_ID,
    });
  }

  return { data, errors };
}

/** Parse legacy format with named headers */
function parseLegacyRows(rawRows: string[][], headers: string[]): { data: ParsedRow[]; errors: string[] } {
  const data: ParsedRow[] = [];
  const errors: string[] = [];

  rawRows.forEach((values, idx) => {
    const row: Record<string, string> = {};
    headers.forEach((h, i) => { row[h] = values[i] || ''; });

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
    const anonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    let forceSync = false;
    const authHeader = req.headers.get('Authorization');

    if (authHeader?.startsWith('Bearer ')) {
      const userClient = createClient(supabaseUrl, anonKey, {
        global: { headers: { Authorization: authHeader } },
      });
      const token = authHeader.replace('Bearer ', '');
      const { data: userData, error: authError } = await userClient.auth.getUser(token);

      if (authError || !userData?.user) {
        return new Response(
          JSON.stringify({ error: 'No autorizado' }),
          { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const { data: roles } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', userData.user.id);

      const userRoles = roles?.map((r: { role: string }) => r.role) || [];
      const hasAccess = userRoles.includes('creator') || userRoles.includes('admin');

      if (!hasAccess) {
        return new Response(
          JSON.stringify({ error: 'Solo creadores y administradores pueden ejecutar la sincronización' }),
          { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      try {
        const body = await req.json();
        forceSync = body?.force === true;
      } catch {
        // No body
      }
    } else {
      return new Response(
        JSON.stringify({ error: 'Se requiere autenticación' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Read sync config
    const { data: configRow, error: configError } = await supabase
      .from('app_settings')
      .select('*')
      .eq('key', 'results_sync_config')
      .maybeSingle();

    if (configError) throw new Error(`Error reading config: ${configError.message}`);

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

    const idMatch = config.sheet_url.match(/\/d\/([a-zA-Z0-9_-]+)/);
    if (!idMatch) {
      await updateSyncStatus(supabase, configRow.id, config, 'error', 0, 'Invalid sheet URL');
      return new Response(
        JSON.stringify({ error: 'Invalid Google Sheet URL' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const sheetId = idMatch[1];
    const sheetName = config.sheet_name || 'Resume';

    const csvText = await fetchGoogleSheet(sheetId, sheetName);
    const { headers, rawRows } = parseCSV(csvText);
    console.log(`[sync] Parsed ${rawRows.length} rows with headers: ${headers.join(', ')}`);

    // Auto-detect format
    let parsedData: ParsedRow[];
    let errors: string[];

    if (isResumeFormat(headers)) {
      console.log('[sync] Detected Resume format, using position-based parsing');
      const result = parseResumeRows(rawRows);
      parsedData = result.data;
      errors = result.errors;
    } else {
      console.log('[sync] Detected legacy format, using header-based parsing');
      const result = parseLegacyRows(rawRows, headers);
      parsedData = result.data;
      errors = result.errors;
    }

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

    // Skip rows without a valid email (name-only identifiers)
    parsedData = parsedData.filter(r => r.user_email.includes('@'));

    // Enrich records with regional/team from profiles
    const { data: profilesList } = await supabase
      .from('profiles')
      .select('email, full_name, regional, team');

    const emailToProfile = new Map<string, { regional?: string; team?: string }>();
    const nameToProfile = new Map<string, { regional?: string; team?: string }>();
    for (const p of (profilesList || [])) {
      const info = { regional: p.regional || undefined, team: p.team || undefined };
      if (p.email) emailToProfile.set(p.email.toLowerCase().trim(), info);
      if (p.full_name) nameToProfile.set(p.full_name.toLowerCase().trim(), info);
    }

    for (const row of parsedData) {
      const key = row.user_email.toLowerCase().trim();
      const profileInfo = emailToProfile.get(key) || nameToProfile.get(key);
      if (profileInfo) {
        if (!row.regional && profileInfo.regional) row.regional = profileInfo.regional;
        if (!row.team && profileInfo.team) row.team = profileInfo.team;
      }
    }

    // Deduplicate by user_email + period_date (keep last occurrence)
    const deduped = new Map<string, ParsedRow>();
    for (const row of parsedData) {
      const key = `${row.user_email.toLowerCase().trim()}|${row.period_date}`;
      deduped.set(key, row);
    }
    const uniqueData = Array.from(deduped.values());
    console.log(`[sync] Deduplicated: ${parsedData.length} -> ${uniqueData.length} records`);

    // Upsert data in chunks
    const chunkSize = 500;
    let totalInserted = 0;
    for (let i = 0; i < uniqueData.length; i += chunkSize) {
      const chunk = uniqueData.slice(i, i + chunkSize);
      const { error: upsertError } = await supabase
        .from('team_results')
        .upsert(chunk, { onConflict: 'user_email,period_date' });

      if (upsertError) {
        await updateSyncStatus(supabase, configRow.id, config, 'error', totalInserted, `Upsert error: ${upsertError.message}`);
        throw new Error(`Upsert error at chunk ${i}: ${upsertError.message}`);
      }
      totalInserted += chunk.length;
    }

    await updateSyncStatus(supabase, configRow.id, config, 'success', totalInserted);
    console.log(`[sync] Successfully synced ${totalInserted} records`);

    return new Response(
      JSON.stringify({ success: true, count: totalInserted, parse_errors: errors }),
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