import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const MAX_ATTEMPTS_PER_HOUR = 5;

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(
        JSON.stringify({ error: "No autorizado" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const universalPassword = Deno.env.get("UNIVERSAL_PASSWORD");

    if (!universalPassword) {
      return new Response(
        JSON.stringify({ error: "Contraseña universal no configurada" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Create client with user's token to verify their role
    const userClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    // CRITICAL: Must pass token explicitly when verify_jwt=false (Lovable Cloud uses ES256)
    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await userClient.auth.getUser(token);

    if (claimsError || !claimsData?.user) {
      return new Response(
        JSON.stringify({ error: "Token inválido" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const requesterId = claimsData.user.id;
    const clientIp = req.headers.get("x-forwarded-for") || req.headers.get("cf-connecting-ip") || "unknown";

    // Check if requester has creator or admin role
    const adminClient = createClient(supabaseUrl, supabaseServiceKey);
    
    const { data: roles, error: rolesError } = await adminClient
      .from("user_roles")
      .select("role")
      .eq("user_id", requesterId);

    if (rolesError) {
      return new Response(
        JSON.stringify({ error: "Error verificando roles" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const userRoles = roles?.map((r: { role: string }) => r.role) || [];
    const hasCreatorAccess = userRoles.includes("creator") || userRoles.includes("admin");

    if (!hasCreatorAccess) {
      return new Response(
        JSON.stringify({ error: "Solo creadores y administradores pueden usar esta función" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Parse request body
    const { targetEmail, password } = await req.json();

    if (!targetEmail || !password) {
      return new Response(
        JSON.stringify({ error: "Email y contraseña requeridos" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Rate limiting: check recent attempts by this requester
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
    const { count: recentAttempts } = await adminClient
      .from("impersonation_audit_log")
      .select("*", { count: "exact", head: true })
      .eq("requester_id", requesterId)
      .gte("created_at", oneHourAgo);

    if ((recentAttempts ?? 0) >= MAX_ATTEMPTS_PER_HOUR) {
      // Log the rate-limited attempt
      await adminClient.from("impersonation_audit_log").insert({
        requester_id: requesterId,
        target_email: targetEmail,
        success: false,
        failure_reason: "rate_limited",
        ip_address: clientIp,
      });

      return new Response(
        JSON.stringify({ error: "Demasiados intentos. Intenta de nuevo más tarde." }),
        { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Verify universal password
    if (password !== universalPassword) {
      // Log failed attempt
      await adminClient.from("impersonation_audit_log").insert({
        requester_id: requesterId,
        target_email: targetEmail,
        success: false,
        failure_reason: "invalid_password",
        ip_address: clientIp,
      });

      return new Response(
        JSON.stringify({ error: "Contraseña universal incorrecta" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get target user by looking up user_id from profiles table first (avoids listUsers pagination issues)
    const { data: targetProfile, error: profileError } = await adminClient
      .from("profiles")
      .select("user_id, email")
      .ilike("email", targetEmail)
      .maybeSingle();

    if (profileError || !targetProfile) {
      await adminClient.from("impersonation_audit_log").insert({
        requester_id: requesterId,
        target_email: targetEmail,
        success: false,
        failure_reason: "user_not_found",
        ip_address: clientIp,
      });

      return new Response(
        JSON.stringify({ error: "Usuario no encontrado" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Verify the user exists in auth
    const { data: targetUserData, error: targetUserError } = await adminClient.auth.admin.getUserById(targetProfile.user_id);

    if (targetUserError || !targetUserData?.user) {
      await adminClient.from("impersonation_audit_log").insert({
        requester_id: requesterId,
        target_email: targetEmail,
        success: false,
        failure_reason: "auth_user_not_found",
        ip_address: clientIp,
      });

      return new Response(
        JSON.stringify({ error: "Usuario no encontrado en el sistema de autenticación" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const targetUser = targetUserData.user;

    // Generate a magic link for the target user
    const { data: linkData, error: linkError } = await adminClient.auth.admin.generateLink({
      type: "magiclink",
      email: targetUser.email!,
    });

    if (linkError || !linkData) {
      await adminClient.from("impersonation_audit_log").insert({
        requester_id: requesterId,
        target_email: targetEmail,
        success: false,
        failure_reason: "link_generation_failed",
        ip_address: clientIp,
      });

      return new Response(
        JSON.stringify({ error: "Error generando acceso" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get the email_otp from the response - this is the raw token for verifyOtp
    const emailOtp = linkData.properties?.email_otp;
    
    if (!emailOtp) {
      await adminClient.from("impersonation_audit_log").insert({
        requester_id: requesterId,
        target_email: targetEmail,
        success: false,
        failure_reason: "no_otp_generated",
        ip_address: clientIp,
      });

      return new Response(
        JSON.stringify({ error: "No se pudo generar el código de acceso" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Log successful impersonation
    await adminClient.from("impersonation_audit_log").insert({
      requester_id: requesterId,
      target_email: targetEmail,
      success: true,
      ip_address: clientIp,
    });

    return new Response(
      JSON.stringify({
        success: true,
        email: targetUser.email,
        token: emailOtp,
        type: "email",
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error in creator-impersonate:", error);
    return new Response(
      JSON.stringify({ error: "Error interno del servidor" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
