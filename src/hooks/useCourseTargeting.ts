import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { SupabaseClient } from "@supabase/supabase-js";

const getSupabaseClient = () => supabase as unknown as SupabaseClient;

export interface UserOption {
  user_id: string;
  full_name: string | null;
  email: string;
  team: string | null;
  regional: string | null;
}

// Hook to get unique teams from profiles
export const useAvailableTeams = () => {
  return useQuery({
    queryKey: ["available-teams"],
    queryFn: async () => {
      const client = getSupabaseClient();
      const { data, error } = await client
        .from("profiles")
        .select("team")
        .not("team", "is", null);

      if (error) throw error;

      // Extract unique teams
      const teams = [...new Set(data.map((p: { team: string }) => p.team).filter(Boolean))] as string[];
      return teams.sort();
    },
  });
};

// Hook to get all users for individual assignment
export const useAvailableUsers = () => {
  return useQuery({
    queryKey: ["available-users-for-targeting"],
    queryFn: async () => {
      const client = getSupabaseClient();
      const { data, error } = await client
        .from("profiles")
        .select("user_id, full_name, email, team, regional")
        .order("full_name");

      if (error) throw error;
      return data as UserOption[];
    },
  });
};

// Hook to get users filtered by team
export const useUsersByTeam = (team: string | null) => {
  return useQuery({
    queryKey: ["users-by-team", team],
    queryFn: async () => {
      if (!team) return [];
      
      const client = getSupabaseClient();
      const { data, error } = await client
        .from("profiles")
        .select("user_id, full_name, email, team, regional")
        .eq("team", team)
        .order("full_name");

      if (error) throw error;
      return data as UserOption[];
    },
    enabled: !!team,
  });
};
