/**
 * databricks-productivity – Supabase Edge Function
 * Extrae métricas de productividad del dashboard publicado de Databricks
 * Dashboard: https://dbc-1e362619-07d3.cloud.databricks.com/dashboardsv3/...
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const DATABRICKS_DASHBOARD_URL =
  "https://dbc-1e362619-07d3.cloud.databricks.com/dashboardsv3/01f05cda99261c0590d2e43f7d512415/published/pages/0f44cc90?o=7726698426071309&f_0f44cc90%7Ef8611e37=ferrelectricosrojass-online";

// ─── Fetch and parse Databricks published dashboard ────────────────────────────
async function fetchDatabricksData(): Promise<Record<string, any>> {
  try {
    // Fetch the published dashboard HTML
    const response = await fetch(DATABRICKS_DASHBOARD_URL, {
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; SalesTrainingBot/1.0)",
        Accept: "text/html,application/json",
      },
    });

    if (!response.ok) {
      console.warn("Databricks dashboard fetch failed:", response.status);
      return getMockProductivityData();
    }

    const html = await response.text();

    // Try to extract JSON data embedded in the page
    const jsonMatches = [
      html.match(/window\.__INITIAL_STATE__\s*=\s*({.+?});/s),
      html.match(/window\.__DATA__\s*=\s*({.+?});/s),
      html.match(/"widgets":\s*(\[.+?\])/s),
    ].filter(Boolean);

    if (jsonMatches.length > 0) {
      try {
        const parsed = JSON.parse(jsonMatches[0]![1]);
        return extractMetricsFromDatabricksJson(parsed);
      } catch {
        // JSON parse failed, use text extraction
      }
    }

    // Fallback: extract numbers from visible text
    return extractMetricsFromHtml(html);
  } catch (err) {
    console.error("Databricks fetch error:", err);
    return getMockProductivityData();
  }
}

function extractMetricsFromDatabricksJson(data: any): Record<string, any> {
  // Try to find metric values in the Databricks widget data
  const metrics: Record<string, any> = {};

  const traverse = (obj: any, path = "") => {
    if (!obj || typeof obj !== "object") return;
    if (Array.isArray(obj)) {
      obj.forEach((item, i) => traverse(item, `${path}[${i}]`));
      return;
    }
    for (const [key, value] of Object.entries(obj)) {
      if (typeof value === "number" && key.toLowerCase().includes("count")) {
        metrics[key] = value;
      }
      if (typeof value === "string" && (key === "title" || key === "label")) {
        metrics[`label_${path}`] = value;
      }
      traverse(value, `${path}.${key}`);
    }
  };

  traverse(data);
  return { raw: metrics, source: "databricks_json" };
}

function extractMetricsFromHtml(html: string): Record<string, any> {
  // Extract numbers that appear next to common metric labels
  const patterns = [
    { label: "leads", regex: /leads?[:\s]+(\d[\d,\.]*)/gi },
    { label: "oportunidades", regex: /oportunidades?[:\s]+(\d[\d,\.]*)/gi },
    { label: "conversion", regex: /conversión?[:\s]+(\d[\d,\.]*)%/gi },
    { label: "visitas", regex: /visitas?[:\s]+(\d[\d,\.]*)/gi },
    { label: "pipeline", regex: /pipeline[:\s]+\$?([\d,\.]+)/gi },
    { label: "ingresos", regex: /ingresos?[:\s]+\$?([\d,\.]+)/gi },
    { label: "tiempo_etapas", regex: /tiempo\s+(?:entre\s+)?etapas?[:\s]+(\d[\d,\.]*)/gi },
  ];

  const metrics: Record<string, string | null> = {};
  for (const { label, regex } of patterns) {
    const match = regex.exec(html);
    metrics[label] = match ? match[1].replace(/,/g, "") : null;
  }

  return { ...metrics, source: "html_extraction" };
}

function getMockProductivityData(): Record<string, any> {
  // Return structure with nulls so frontend knows data couldn't be fetched
  return {
    source: "unavailable",
    message: "Dashboard de Databricks no accesible en este momento. Verifica la URL o los permisos de acceso.",
    metrics: {
      totalLeads: null,
      leadsConvertidos: null,
      tasaConversion: null,
      visitasRealizadas: null,
      tiempoPromedioEtapas: null,
      pipelineValor: null,
      periodo: null,
    },
  };
}

// ─── Also try to get data via Databricks SQL API if token available ───────────
async function fetchViaDatabricksApi(token: string, workspaceUrl: string): Promise<any> {
  const apiUrl = `${workspaceUrl}/api/2.0/sql/statements`;

  // Query the underlying data that powers the dashboard
  const queries = [
    `SELECT COUNT(*) as total_leads,
            SUM(CASE WHEN IsConverted = true THEN 1 ELSE 0 END) as leads_convertidos,
            AVG(DATEDIFF(ConvertedDate, CreatedDate)) as dias_promedio_conversion
     FROM leads
     WHERE CreatedDate >= DATE_SUB(CURRENT_DATE, 30)`,
  ];

  const results = [];
  for (const statement of queries) {
    try {
      const resp = await fetch(apiUrl, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          statement,
          wait_timeout: "10s",
          on_wait_timeout: "CONTINUE",
        }),
      });

      if (resp.ok) {
        const data = await resp.json();
        results.push(data);
      }
    } catch {
      // Query failed silently
    }
  }

  return results;
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const DATABRICKS_TOKEN = Deno.env.get("DATABRICKS_TOKEN");
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // ── Check cache first (15 min TTL) ────────────────────────────────────────
    const today = new Date().toISOString().split("T")[0];
    const cacheKey = `databricks_${today}`;

    const { data: cached } = await supabase
      .from("productivity_cache")
      .select("data, updated_at")
      .eq("cache_key", cacheKey)
      .maybeSingle()
      .catch(() => ({ data: null }));

    if (cached?.data) {
      const updatedAt = new Date(cached.updated_at).getTime();
      const fifteenMin = 15 * 60 * 1000;
      if (Date.now() - updatedAt < fifteenMin) {
        return new Response(JSON.stringify({ success: true, data: cached.data, cached: true }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    // ── Fetch fresh data ───────────────────────────────────────────────────────
    let productivityData: Record<string, any>;

    if (DATABRICKS_TOKEN) {
      // Prefer API if token is available
      const apiData = await fetchViaDatabricksApi(
        DATABRICKS_TOKEN,
        "https://dbc-1e362619-07d3.cloud.databricks.com",
      );
      productivityData = { source: "databricks_api", data: apiData };
    } else {
      // Fallback: scrape the published dashboard
      productivityData = await fetchDatabricksData();
    }

    // ── Cache the result ───────────────────────────────────────────────────────
    await supabase
      .from("productivity_cache")
      .upsert({
        cache_key: cacheKey,
        data: productivityData,
        updated_at: new Date().toISOString(),
      })
      .catch(() => {}); // non-fatal

    return new Response(JSON.stringify({ success: true, data: productivityData, cached: false }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("databricks-productivity error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Error desconocido" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
