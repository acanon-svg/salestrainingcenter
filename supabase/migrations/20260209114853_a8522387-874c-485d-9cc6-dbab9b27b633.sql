
-- Create audit table for impersonation attempts
CREATE TABLE public.impersonation_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  requester_id UUID NOT NULL,
  target_email TEXT NOT NULL,
  success BOOLEAN NOT NULL DEFAULT false,
  failure_reason TEXT,
  ip_address TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.impersonation_audit_log ENABLE ROW LEVEL SECURITY;

-- Only admins can read audit logs
CREATE POLICY "Admins can read impersonation audit logs"
ON public.impersonation_audit_log FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- No direct inserts from client - only edge function with service role
CREATE INDEX idx_impersonation_audit_requester ON public.impersonation_audit_log(requester_id, created_at);
