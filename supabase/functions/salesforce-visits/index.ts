/**
 * salesforce-visits – Supabase Edge Function
 * Obtiene las visitas diarias del equipo Field Sales desde Salesforce
 * Consulta el objeto Task (y Events) filtrado por los user IDs del equipo FS
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// ─── Salesforce OAuth2 (username + password flow) ─────────────────────────────
async function getSalesforceToken(
  username: string,
  password: string,
  securityToken: string,
  domain: string,
): Promise<{ access_token: string; instance_url: string }> {
  const loginUrl = `https://${domain}.salesforce.com/services/oauth2/token`;
  const body = new URLSearchParams({
    grant_type: "password",
    client_id: "3MVG9HxRZv05HarQMpYoJj3gDSl77E4eMf.JvCZJjg4XmrqDBGRjZp5JkfXGKXRGzqCa",
    client_secret: "placeholder",
    username,
    password: password + securityToken,
  });

  // Use simple_salesforce-compatible approach: REST API with user/pass
  const resp = await fetch(loginUrl, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: body.toString(),
  });

  if (!resp.ok) {
    // Try alternative: use the SOAP login
    const soapBody = `<?xml version="1.0" encoding="utf-8"?>
<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:url="urn:partner.soap.sforce.com">
  <soapenv:Body>
    <urn:login>
      <urn:username>${username}</urn:username>
      <urn:password>${password}${securityToken}</urn:password>
    </urn:login>
  </soapenv:Body>
</soapenv:Envelope>`;

    const soapResp = await fetch(`https://${domain}.salesforce.com/services/Soap/u/58.0`, {
      method: "POST",
      headers: {
        "Content-Type": "text/xml",
        SOAPAction: "login",
      },
      body: soapBody,
    });

    const soapText = await soapResp.text();
    const sessionMatch = soapText.match(/<sessionId>([^<]+)<\/sessionId>/);
    const serverUrlMatch = soapText.match(/<serverUrl>([^<]+)<\/serverUrl>/);

    if (!sessionMatch || !serverUrlMatch) {
      throw new Error(`Salesforce login failed: ${soapText.substring(0, 200)}`);
    }

    const instanceUrl = serverUrlMatch[1].split("/services/")[0];
    return { access_token: sessionMatch[1], instance_url: instanceUrl };
  }

  return await resp.json();
}

// ─── SOQL query via Salesforce REST API ───────────────────────────────────────
async function soqlQuery(
  instanceUrl: string,
  accessToken: string,
  query: string,
): Promise<any[]> {
  const url = `${instanceUrl}/services/data/v58.0/query/?q=${encodeURIComponent(query)}`;
  const resp = await fetch(url, {
    headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" },
  });

  if (!resp.ok) {
    const err = await resp.text();
    throw new Error(`SOQL error ${resp.status}: ${err.substring(0, 200)}`);
  }

  const data = await resp.json();
  return data.records || [];
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    // ── Env vars ──────────────────────────────────────────────────────────────
    const SF_USERNAME = Deno.env.get("SF_USERNAME") || "";
    const SF_PASSWORD = Deno.env.get("SF_PASSWORD") || "";
    const SF_SECURITY_TOKEN = Deno.env.get("SF_SECURITY_TOKEN") || "";
    const SF_DOMAIN = Deno.env.get("SF_DOMAIN") || "addi.my";

    if (!SF_USERNAME || !SF_PASSWORD) {
      return new Response(JSON.stringify({ error: "Salesforce credentials not configured" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ── Parse request ─────────────────────────────────────────────────────────
    const { days = 7, teamUserIds } = await req.json().catch(() => ({}));
    const daysBack = Math.min(Number(days) || 7, 30);

    // ── Connect to Supabase ────────────────────────────────────────────────────
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // ── Load team from Google Sheet fallback config ──────────────────────────
    // FS Team user IDs hardcoded from config (same as QA bot HUNTERS_FALLBACK)
    const FS_TEAM_SF_IDS: string[] = teamUserIds || [
      "005UJ000003LwX8YAK","005UJ000007PLDJYA4","005UJ000008At8HYAS",
      "005UJ000009lVJJYA2","005UJ0000098GwrYAE","005UJ0000098N0fYAE",
      "005UJ000007wcgnYAA","005UJ000004Im77YAC","005UJ000003KUxuYAG",
      "005UJ000004cTwLYAU","005UJ000007ouUQYAY","005UJ000009LmE9YAK",
      "005UJ0000098N3tYAE","005UJ000008LPMzYAO","005UJ000003F2UPYA0",
      "005UJ000004Im3tYAC","005UJ000007DNh7YAG","005UJ000008jklFYAQ",
      "005UJ000004cU1BYAU","005UJ0000060p3tYAA","005UJ000006p07NYAQ",
      "005UJ000007PLmnYAG","005UJ000007PLejYAG","005UJ000008MIKTYA4",
      "005UJ000008jtlJYAQ","005UJ000009haZJYAY","005UJ000006ZZ2gYAG",
      "005UJ000005WDX7YAO","005UJ000007PK9BYAW","005UJ000007ox7JYAQ",
      "005UJ000009GTdZYAW","005UJ000008BS9FYAW","005UJ000005aPJZYA2",
      "005UJ000007PKCPYA4","005UJ000007ovaAYAQ","005UJ000009JgsnYAC",
      "005UJ000009hae9YAA","005UJ00000BEpVlYAL","005UJ00000BEog9YAD",
      "005UJ000009GRNGYA4","005UJ00000BEqRpYAL","005UJ000007NDbdYAG",
    ];

    const idList = FS_TEAM_SF_IDS.map((id) => `'${id}'`).join(",");
    const dateFrom = new Date(Date.now() - daysBack * 24 * 60 * 60 * 1000)
      .toISOString()
      .split("T")[0];

    // ── Authenticate to Salesforce ────────────────────────────────────────────
    const { access_token, instance_url } = await getSalesforceToken(
      SF_USERNAME, SF_PASSWORD, SF_SECURITY_TOKEN, SF_DOMAIN,
    );

    // ── Query Tasks (visitas de campo) ─────────────────────────────────────────
    // Visitas se registran como Tasks de tipo "Visita" o Activities con subject containing "Visit"
    const tasksQuery = `
      SELECT OwnerId, Owner.Name, Owner.Email, ActivityDate, Subject, Status, Type, WhatId
      FROM Task
      WHERE OwnerId IN (${idList})
        AND ActivityDate >= ${dateFrom}
        AND (
          Type = 'Visit' OR
          Subject LIKE '%visita%' OR
          Subject LIKE '%visit%' OR
          Subject LIKE '%Visita%'
        )
      ORDER BY ActivityDate DESC
      LIMIT 2000
    `;

    // ── Query Events (meetings/visits) ────────────────────────────────────────
    const eventsQuery = `
      SELECT OwnerId, Owner.Name, Owner.Email, ActivityDate, Subject, StartDateTime, EndDateTime
      FROM Event
      WHERE OwnerId IN (${idList})
        AND ActivityDate >= ${dateFrom}
        AND (
          Subject LIKE '%visita%' OR
          Subject LIKE '%visit%' OR
          Subject LIKE '%Visita%' OR
          Type = 'Visit'
        )
      ORDER BY ActivityDate DESC
      LIMIT 2000
    `;

    const [tasks, events] = await Promise.all([
      soqlQuery(instance_url, access_token, tasksQuery).catch(() => []),
      soqlQuery(instance_url, access_token, eventsQuery).catch(() => []),
    ]);

    // ── Also query ALL tasks to count total daily activity ────────────────────
    const allTasksQuery = `
      SELECT OwnerId, Owner.Name, Owner.Email, ActivityDate, Subject, Status, Type
      FROM Task
      WHERE OwnerId IN (${idList})
        AND ActivityDate >= ${dateFrom}
        AND Status = 'Completed'
      ORDER BY ActivityDate DESC
      LIMIT 5000
    `;
    const allTasks = await soqlQuery(instance_url, access_token, allTasksQuery).catch(() => []);

    // ── Aggregate visits per user per day ─────────────────────────────────────
    const visitsByUserDay: Record<string, Record<string, number>> = {};
    const activityByUserDay: Record<string, Record<string, number>> = {};
    const userInfo: Record<string, { name: string; email: string }> = {};

    const processRecord = (record: any, map: Record<string, Record<string, number>>) => {
      const ownerId = record.OwnerId;
      const date = record.ActivityDate?.split("T")[0] || "";
      if (!ownerId || !date) return;

      if (!map[ownerId]) map[ownerId] = {};
      map[ownerId][date] = (map[ownerId][date] || 0) + 1;

      if (record.Owner) {
        userInfo[ownerId] = {
          name: record.Owner.Name || ownerId,
          email: record.Owner.Email || "",
        };
      }
    };

    [...tasks, ...events].forEach((r) => processRecord(r, visitsByUserDay));
    allTasks.forEach((r) => processRecord(r, activityByUserDay));

    // ── Build response ─────────────────────────────────────────────────────────
    const result = FS_TEAM_SF_IDS.map((sfId) => ({
      sfUserId: sfId,
      name: userInfo[sfId]?.name || sfId,
      email: userInfo[sfId]?.email || "",
      visitsByDay: visitsByUserDay[sfId] || {},
      activitiesByDay: activityByUserDay[sfId] || {},
      totalVisits: Object.values(visitsByUserDay[sfId] || {}).reduce((a, b) => a + b, 0),
      totalActivities: Object.values(activityByUserDay[sfId] || {}).reduce((a, b) => a + b, 0),
    }));

    // ── Cache in Supabase (optional) ───────────────────────────────────────────
    const cacheKey = `sf_visits_${daysBack}d_${new Date().toISOString().split("T")[0]}`;
    await supabase
      .from("productivity_cache")
      .upsert({ cache_key: cacheKey, data: result, updated_at: new Date().toISOString() })
      .select()
      .maybeSingle()
      .catch(() => {}); // non-fatal if table doesn't exist yet

    return new Response(JSON.stringify({ success: true, data: result, dateFrom, daysBack }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("salesforce-visits error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Error desconocido" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
