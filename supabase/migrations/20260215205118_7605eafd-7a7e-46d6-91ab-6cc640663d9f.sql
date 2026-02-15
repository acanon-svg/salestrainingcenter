
-- Fix overly permissive policies - restrict to service role only via a helper
-- Drop the permissive policies
DROP POLICY "Service role can manage accompaniments" ON public.followup_accompaniments;
DROP POLICY "Service role can manage universal feedback" ON public.followup_universal_feedback;
DROP POLICY "Service role can manage quality evaluations" ON public.followup_quality_evaluations;

-- These tables are only written to by the edge function using service_role key
-- which bypasses RLS entirely, so we don't need INSERT/UPDATE/DELETE policies for anon/authenticated
