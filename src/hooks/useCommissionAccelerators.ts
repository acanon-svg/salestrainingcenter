import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface CommissionAccelerator {
  id: string;
  config_id: string;
  min_firmas: number;
  bonus_percentage: number;
  description: string | null;
  order_index: number;
  created_at: string;
}

export const useCommissionAccelerators = (configId: string | undefined) => {
  return useQuery({
    queryKey: ["commission-accelerators", configId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("commission_accelerators")
        .select("*")
        .eq("config_id", configId!)
        .order("min_firmas", { ascending: true });

      if (error) throw error;
      return data as CommissionAccelerator[];
    },
    enabled: !!configId,
  });
};

export const useCreateAccelerator = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (accelerator: Omit<CommissionAccelerator, "id" | "created_at">) => {
      const { data, error } = await supabase
        .from("commission_accelerators")
        .insert(accelerator)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["commission-accelerators", variables.config_id] });
    },
  });
};

export const useUpdateAccelerator = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<CommissionAccelerator> & { id: string }) => {
      const { data, error } = await supabase
        .from("commission_accelerators")
        .update(updates)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["commission-accelerators"] });
    },
  });
};

export const useDeleteAccelerator = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("commission_accelerators")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["commission-accelerators"] });
    },
  });
};
