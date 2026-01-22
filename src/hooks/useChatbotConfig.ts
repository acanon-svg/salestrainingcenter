import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { SupabaseClient } from "@supabase/supabase-js";
import { useToast } from "@/hooks/use-toast";

const getSupabaseClient = () => supabase as unknown as SupabaseClient;

export interface ChatbotConfig {
  id: string;
  enabled: boolean;
  bot_name: string;
  welcome_message: string;
  avatar_url: string | null;
  system_prompt: string;
  primary_color: string;
  updated_at: string;
}

export const useChatbotConfig = () => {
  const [config, setConfig] = useState<ChatbotConfig | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  const fetchConfig = async () => {
    try {
      // Only query when there is an authenticated session.
      // Otherwise the backend will return an empty result due to RLS (and we would cache null forever).
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        setConfig(null);
        return;
      }

      const client = getSupabaseClient();
      const { data, error } = await client
        .from("chatbot_config")
        .select("*")
        .limit(1)
        .maybeSingle();

      if (error) throw error;
      setConfig(data as ChatbotConfig);
    } catch (error) {
      console.error("Error fetching chatbot config:", error);
    }
  };

  const updateConfig = async (updates: Partial<ChatbotConfig>) => {
    if (!config?.id) return false;

    try {
      const client = getSupabaseClient();
      const { error } = await client
        .from("chatbot_config")
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq("id", config.id);

      if (error) throw error;

      setConfig((prev) => prev ? { ...prev, ...updates } : null);
      
      toast({
        title: "Configuración guardada",
        description: "Los cambios del chatbot han sido aplicados.",
      });

      return true;
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
      return false;
    }
  };

  useEffect(() => {
    let mounted = true;

    const safeFetch = async () => {
      if (!mounted) return;
      setIsLoading(true);
      await fetchConfig();
      if (!mounted) return;
      setIsLoading(false);
    };

    // Initial load
    safeFetch();

    // Re-fetch when auth state changes (fixes refresh/F5 scenario)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_IN" || event === "TOKEN_REFRESHED") {
        safeFetch();
      }
      if (event === "SIGNED_OUT") {
        setConfig(null);
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  return {
    config,
    isLoading,
    updateConfig,
    refetch: fetchConfig,
  };
};
