import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface ResultsSyncConfig {
  enabled: boolean;
  sheet_url: string;
  sheet_name: string;
  last_sync_at: string | null;
  last_sync_status: "success" | "error" | null;
  last_sync_count: number | null;
  last_sync_error: string | null;
}

const DEFAULT_CONFIG: ResultsSyncConfig = {
  enabled: false,
  sheet_url: "",
  sheet_name: "Resultados",
  last_sync_at: null,
  last_sync_status: null,
  last_sync_count: null,
  last_sync_error: null,
};

const db = () => supabase as any;

export const useResultsSyncConfig = () => {
  return useQuery({
    queryKey: ["results-sync-config"],
    queryFn: async () => {
      const { data, error } = await db()
        .from("app_settings")
        .select("*")
        .eq("key", "results_sync_config")
        .maybeSingle();

      if (error) throw error;

      if (!data) return { id: null, config: DEFAULT_CONFIG };

      return {
        id: data.id as string,
        config: (data.value || DEFAULT_CONFIG) as ResultsSyncConfig,
      };
    },
  });
};

export const useSaveResultsSyncConfig = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, config }: { id: string | null; config: ResultsSyncConfig }) => {
      if (id) {
        const { error } = await db()
          .from("app_settings")
          .update({
            value: config,
            updated_at: new Date().toISOString(),
          })
          .eq("id", id);
        if (error) throw error;
      } else {
        const { error } = await db()
          .from("app_settings")
          .insert({
            key: "results_sync_config",
            value: config,
            description: "Configuración de sincronización automática de resultados desde Google Sheets",
          });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["results-sync-config"] });
      toast.success("Configuración de sincronización guardada");
    },
    onError: (error: any) => {
      toast.error(`Error al guardar: ${error.message}`);
    },
  });
};

export const useTriggerSync = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke("sync-team-results", {
        body: { force: true },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["results-sync-config"] });
      queryClient.invalidateQueries({ queryKey: ["team-results"] });
      queryClient.invalidateQueries({ queryKey: ["team-results-batches"] });
      toast.success(`Sincronización completada: ${data.count} registros actualizados`);
    },
    onError: (error: any) => {
      toast.error(`Error al sincronizar: ${error.message}`);
    },
  });
};
