import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface CommissionMonthlyConfig {
  id: string;
  config_id: string;
  month: number;
  year: number;
  meta_firmas: number;
  meta_originaciones: number;
  meta_gmv_usd: number;
  base_comisional: number;
  created_at: string;
  updated_at: string;
  created_by: string | null;
}

const MONTH_NAMES = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
];

export const getMonthName = (month: number) => MONTH_NAMES[month - 1] || "";

export const useMonthlyConfigs = (configId: string | undefined) => {
  return useQuery({
    queryKey: ["commission-monthly-configs", configId],
    queryFn: async () => {
      if (!configId) return [];
      
      const { data, error } = await supabase
        .from("commission_monthly_configs")
        .select("*")
        .eq("config_id", configId)
        .order("year", { ascending: true })
        .order("month", { ascending: true });

      if (error) throw error;
      return data as CommissionMonthlyConfig[];
    },
    enabled: !!configId,
  });
};

export const useMonthlyConfigForMonth = (
  configId: string | undefined,
  month: number,
  year: number
) => {
  return useQuery({
    queryKey: ["commission-monthly-config", configId, month, year],
    queryFn: async () => {
      if (!configId) return null;

      const { data, error } = await supabase
        .from("commission_monthly_configs")
        .select("*")
        .eq("config_id", configId)
        .eq("month", month)
        .eq("year", year)
        .maybeSingle();

      if (error) throw error;
      return data as CommissionMonthlyConfig | null;
    },
    enabled: !!configId && month >= 1 && month <= 12 && year >= 2024,
  });
};

export const useCreateMonthlyConfig = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (config: Omit<CommissionMonthlyConfig, "id" | "created_at" | "updated_at">) => {
      const { data, error } = await supabase
        .from("commission_monthly_configs")
        .insert(config)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["commission-monthly-configs", variables.config_id] });
      queryClient.invalidateQueries({ queryKey: ["commission-monthly-config"] });
    },
  });
};

export const useUpdateMonthlyConfig = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<CommissionMonthlyConfig> & { id: string }) => {
      const { data, error } = await supabase
        .from("commission_monthly_configs")
        .update(updates)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["commission-monthly-configs"] });
      queryClient.invalidateQueries({ queryKey: ["commission-monthly-config"] });
    },
  });
};

export const useUpsertMonthlyConfig = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (config: Omit<CommissionMonthlyConfig, "id" | "created_at" | "updated_at">) => {
      const { data, error } = await supabase
        .from("commission_monthly_configs")
        .upsert(config, { 
          onConflict: "config_id,month,year",
          ignoreDuplicates: false 
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["commission-monthly-configs", variables.config_id] });
      queryClient.invalidateQueries({ queryKey: ["commission-monthly-config"] });
    },
  });
};

export const useDeleteMonthlyConfig = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("commission_monthly_configs")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["commission-monthly-configs"] });
      queryClient.invalidateQueries({ queryKey: ["commission-monthly-config"] });
    },
  });
};
