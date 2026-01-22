import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface RankingUser {
  id: string;
  user_id: string;
  full_name: string | null;
  avatar_url: string | null;
  team: string | null;
  regional: string | null;
  points: number;
  badges_count: number;
}

export const useRanking = (limit: number = 50) => {
  return useQuery({
    queryKey: ["ranking", limit],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, user_id, full_name, avatar_url, team, regional, points, badges_count")
        .order("points", { ascending: false })
        .limit(limit);

      if (error) throw error;
      return data as RankingUser[];
    },
  });
};

export const useTeamRanking = (team: string) => {
  return useQuery({
    queryKey: ["team-ranking", team],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, user_id, full_name, avatar_url, team, regional, points, badges_count")
        .eq("team", team)
        .order("points", { ascending: false });

      if (error) throw error;
      return data as RankingUser[];
    },
    enabled: !!team,
  });
};
