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

export interface RankingCompetitor {
  name: string;
  pointsAhead: number;
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

// Hook to get the competitor immediately above the current user
export const useRankingCompetitor = (userId: string | undefined) => {
  return useQuery({
    queryKey: ["ranking-competitor", userId],
    queryFn: async (): Promise<RankingCompetitor | null> => {
      if (!userId) return null;

      // Get all users ordered by points descending
      const { data: allUsers, error } = await supabase
        .from("profiles")
        .select("user_id, full_name, points")
        .order("points", { ascending: false });

      if (error) throw error;
      if (!allUsers || allUsers.length === 0) return null;

      // Find current user's position
      const currentUserIndex = allUsers.findIndex((u) => u.user_id === userId);
      
      // If user is first or not found, no competitor above
      if (currentUserIndex <= 0) return null;

      const userAbove = allUsers[currentUserIndex - 1];
      const currentUser = allUsers[currentUserIndex];
      
      if (!userAbove || !currentUser) return null;

      const pointsAhead = userAbove.points - currentUser.points;

      return {
        name: userAbove.full_name?.split(" ")[0] || "Usuario",
        pointsAhead: pointsAhead,
      };
    },
    enabled: !!userId,
  });
};
