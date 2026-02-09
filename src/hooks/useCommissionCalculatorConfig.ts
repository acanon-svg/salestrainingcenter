import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface CommissionCalculatorConfig {
  id: string;
  tool_id: string;
  name: string;
  description: string | null;
  meta_firmas: number;
  meta_originaciones: number;
  meta_gmv_usd: number;
  base_comisional: number;
  target_users: string[] | null;
  target_teams: string[] | null;
  is_default: boolean;
  created_at: string;
  updated_at: string;
  created_by: string | null;
}

export const useCommissionCalculatorConfigs = (toolId: string) => {
  return useQuery({
    queryKey: ["commission-calculator-configs", toolId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("commission_calculator_configs")
        .select("*")
        .eq("tool_id", toolId)
        .order("created_at", { ascending: true });

      if (error) throw error;
      return data as CommissionCalculatorConfig[];
    },
    enabled: !!toolId,
  });
};

export const useAllCommissionConfigs = () => {
  return useQuery({
    queryKey: ["commission-calculator-configs-all"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("commission_calculator_configs")
        .select("*")
        .order("created_at", { ascending: true });

      if (error) throw error;
      return data as CommissionCalculatorConfig[];
    },
  });
};

export const useMyCommissionConfig = (toolId: string, userId: string | undefined, userTeam: string | null | undefined) => {
  return useQuery({
    queryKey: ["my-commission-config", toolId, userId, userTeam],
    queryFn: async () => {
      // First try to find a config specifically for this user
      let { data, error } = await supabase
        .from("commission_calculator_configs")
        .select("*")
        .eq("tool_id", toolId)
        .contains("target_users", [userId])
        .limit(1)
        .maybeSingle();

      if (!error && data) {
        return data as CommissionCalculatorConfig;
      }

      // Then try to find a config for the user's team
      if (userTeam) {
        const { data: teamData, error: teamError } = await supabase
          .from("commission_calculator_configs")
          .select("*")
          .eq("tool_id", toolId)
          .contains("target_teams", [userTeam])
          .limit(1)
          .maybeSingle();

        if (!teamError && teamData) {
          return teamData as CommissionCalculatorConfig;
        }
      }

      // Finally, get the default config
      const { data: defaultData, error: defaultError } = await supabase
        .from("commission_calculator_configs")
        .select("*")
        .eq("tool_id", toolId)
        .eq("is_default", true)
        .limit(1)
        .maybeSingle();

      if (defaultError) throw defaultError;
      return defaultData as CommissionCalculatorConfig | null;
    },
    enabled: !!toolId && !!userId,
  });
};

export const useCreateCommissionConfig = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (config: Omit<CommissionCalculatorConfig, "id" | "created_at" | "updated_at">) => {
      const { data, error } = await supabase
        .from("commission_calculator_configs")
        .insert(config)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["commission-calculator-configs", variables.tool_id] });
    },
  });
};

export const useUpdateCommissionConfig = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<CommissionCalculatorConfig> & { id: string }) => {
      const { data, error } = await supabase
        .from("commission_calculator_configs")
        .update(updates)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["commission-calculator-configs"] });
      queryClient.invalidateQueries({ queryKey: ["my-commission-config"] });
    },
  });
};

export const useDeleteCommissionConfig = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("commission_calculator_configs")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["commission-calculator-configs"] });
    },
  });
};

export const useDuplicateCommissionConfig = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (configId: string) => {
      // Get the original config
      const { data: original, error: fetchError } = await supabase
        .from("commission_calculator_configs")
        .select("*")
        .eq("id", configId)
        .single();

      if (fetchError) throw fetchError;

      // Create a duplicate with a new name
      const { data, error } = await supabase
        .from("commission_calculator_configs")
        .insert({
          tool_id: original.tool_id,
          name: `${original.name} (Copia)`,
          description: original.description,
          meta_firmas: original.meta_firmas,
          meta_originaciones: original.meta_originaciones,
          meta_gmv_usd: original.meta_gmv_usd,
          base_comisional: original.base_comisional,
          target_users: null,
          target_teams: null,
          is_default: false,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["commission-calculator-configs"] });
    },
  });
};
