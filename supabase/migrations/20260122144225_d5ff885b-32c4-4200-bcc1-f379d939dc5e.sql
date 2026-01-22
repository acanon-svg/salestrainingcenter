-- Fix 1: Remove overly permissive profile viewing policy for creators
DROP POLICY IF EXISTS "Creators can view profiles for reporting" ON public.profiles;

-- Fix 2: Restrict chatbot_config SELECT to authenticated users only
DROP POLICY IF EXISTS "Everyone can view chatbot config" ON public.chatbot_config;
CREATE POLICY "Authenticated users can view chatbot config" 
  ON public.chatbot_config 
  FOR SELECT 
  TO authenticated
  USING (true);

-- Fix 3: Replace the permissive badge insertion policy with admin-only
DROP POLICY IF EXISTS "System can award badges" ON public.user_badges;
CREATE POLICY "Only admins can award badges" 
  ON public.user_badges 
  FOR INSERT 
  TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));