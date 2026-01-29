import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { SupabaseClient } from "@supabase/supabase-js";

// Helper to get untyped supabase client for new tables
const getSupabaseClient = () => supabase as unknown as SupabaseClient;

export interface PortalSectionConfig {
  id: string;
  section_key: string;
  section_name: string;
  description: string | null;
  is_enabled: boolean;
  target_teams: string[] | null;
  target_users: string[] | null;
  target_leaders: string[] | null;
  created_at: string;
  updated_at: string;
}

export const usePortalSectionConfigs = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: configs, isLoading } = useQuery({
    queryKey: ["portal-section-configs"],
    queryFn: async () => {
      const client = getSupabaseClient();
      const { data, error } = await client
        .from("portal_section_configs")
        .select("*")
        .order("section_name");

      if (error) throw error;
      return data as PortalSectionConfig[];
    },
  });

  const updateConfig = useMutation({
    mutationFn: async ({
      id,
      ...updates
    }: Partial<PortalSectionConfig> & { id: string }) => {
      const client = getSupabaseClient();
      const { data, error } = await client
        .from("portal_section_configs")
        .update(updates)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["portal-section-configs"] });
      toast({ title: "Configuración actualizada" });
    },
    onError: (error) => {
      toast({
        title: "Error al actualizar",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Check if a section is visible for the current user
  const isSectionVisibleForUser = (
    config: PortalSectionConfig,
    userTeam: string | null,
    userId: string
  ): boolean => {
    if (!config.is_enabled) return false;

    const hasTeamTarget = config.target_teams && config.target_teams.length > 0;
    const hasUserTarget = config.target_users && config.target_users.length > 0;
    const hasLeaderTarget = config.target_leaders && config.target_leaders.length > 0;

    // If no targeting, visible to all
    if (!hasTeamTarget && !hasUserTarget && !hasLeaderTarget) {
      return true;
    }

    // Check if user is specifically targeted
    if (hasUserTarget && config.target_users!.includes(userId)) {
      return true;
    }

    // Check if user is a targeted leader
    if (hasLeaderTarget && config.target_leaders!.includes(userId)) {
      return true;
    }

    // Check if user's team is targeted
    if (hasTeamTarget && userTeam && config.target_teams!.includes(userTeam)) {
      return true;
    }

    return false;
  };

  return {
    configs,
    isLoading,
    updateConfig,
    isSectionVisibleForUser,
  };
};
