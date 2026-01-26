import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export interface LeaderRegion {
  id: string;
  user_id: string;
  regional: string;
  assigned_by: string | null;
  created_at: string;
  updated_at: string;
}

export const useLeaderRegion = (userId?: string) => {
  return useQuery({
    queryKey: ["leader-region", userId],
    queryFn: async () => {
      if (!userId) return null;
      
      const { data, error } = await supabase
        .from("leader_regions")
        .select("*")
        .eq("user_id", userId)
        .maybeSingle();

      if (error) throw error;
      return data as LeaderRegion | null;
    },
    enabled: !!userId,
  });
};

export const useAllLeaderRegions = () => {
  return useQuery({
    queryKey: ["all-leader-regions"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("leader_regions")
        .select("*");

      if (error) throw error;
      return data as LeaderRegion[];
    },
  });
};

export const useAssignLeaderRegion = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ userId, regional }: { userId: string; regional: string }) => {
      // Upsert: update if exists, insert if not
      const { data, error } = await supabase
        .from("leader_regions")
        .upsert(
          { user_id: userId, regional },
          { onConflict: "user_id" }
        )
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["leader-region"] });
      queryClient.invalidateQueries({ queryKey: ["all-leader-regions"] });
      toast({
        title: "Región asignada",
        description: "La región del líder ha sido actualizada correctamente.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });
};

export const useRemoveLeaderRegion = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (userId: string) => {
      const { error } = await supabase
        .from("leader_regions")
        .delete()
        .eq("user_id", userId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["leader-region"] });
      queryClient.invalidateQueries({ queryKey: ["all-leader-regions"] });
      toast({
        title: "Región removida",
        description: "La asignación de región ha sido eliminada.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });
};
