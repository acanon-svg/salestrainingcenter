import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { SupabaseClient } from "@supabase/supabase-js";
import { useToast } from "@/hooks/use-toast";

// Helper to get untyped supabase client
const getSupabaseClient = () => supabase as unknown as SupabaseClient;

interface AppSetting {
  id: string;
  key: string;
  value: boolean | string | number | object;
  description: string | null;
  updated_at: string;
}

export const useAppSettings = () => {
  const [settings, setSettings] = useState<Record<string, any>>({});
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  const fetchSettings = async () => {
    try {
      const client = getSupabaseClient();
      const { data, error } = await client
        .from("app_settings")
        .select("*");

      if (error) throw error;

      const settingsMap: Record<string, any> = {};
      (data as AppSetting[])?.forEach((setting) => {
        settingsMap[setting.key] = setting.value;
      });
      setSettings(settingsMap);
    } catch (error) {
      console.error("Error fetching app settings:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const updateSetting = async (key: string, value: any) => {
    try {
      const client = getSupabaseClient();
      const { error } = await client
        .from("app_settings")
        .update({ 
          value: JSON.stringify(value),
          updated_at: new Date().toISOString()
        })
        .eq("key", key);

      if (error) throw error;

      setSettings((prev) => ({ ...prev, [key]: value }));
      
      toast({
        title: "Configuración actualizada",
        description: `La configuración "${key}" ha sido actualizada.`,
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

  const getSetting = (key: string, defaultValue: any = null) => {
    const value = settings[key];
    if (value === undefined) return defaultValue;
    
    // Handle string "true"/"false" for booleans
    if (value === "true") return true;
    if (value === "false") return false;
    
    return value;
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  return {
    settings,
    isLoading,
    updateSetting,
    getSetting,
    refetch: fetchSettings,
  };
};
