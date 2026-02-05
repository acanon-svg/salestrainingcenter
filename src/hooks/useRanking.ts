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
  roles?: string[];
}

export interface RankingCompetitor {
  name: string;
  pointsAhead: number;
}

// General ranking (all users)
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

// Ranking filtered by role type: "students_only" or "leaders"
export const useRankingByRoleType = (
  roleType: "students_only" | "leaders",
  teamFilter?: string
) => {
  return useQuery({
    queryKey: ["ranking-by-role", roleType, teamFilter],
    queryFn: async () => {
      // First get all user roles
      const { data: userRoles, error: rolesError } = await supabase
        .from("user_roles")
        .select("user_id, role");

      if (rolesError) throw rolesError;

      // Group roles by user
      const rolesByUser: Record<string, string[]> = {};
      userRoles?.forEach((ur) => {
        if (!rolesByUser[ur.user_id]) {
          rolesByUser[ur.user_id] = [];
        }
        rolesByUser[ur.user_id].push(ur.role);
      });

      // Determine which user_ids to include
      let targetUserIds: string[] = [];

      if (roleType === "students_only") {
        // Users who ONLY have the student role (no other roles)
        targetUserIds = Object.entries(rolesByUser)
          .filter(([_, roles]) => roles.length === 1 && roles[0] === "student")
          .map(([userId]) => userId);
      } else if (roleType === "leaders") {
        // Users who have the lider role (regardless of other roles)
        targetUserIds = Object.entries(rolesByUser)
          .filter(([_, roles]) => roles.includes("lider"))
          .map(([userId]) => userId);
      }

      if (targetUserIds.length === 0) {
        return [];
      }

      // Fetch profiles for these users
      let query = supabase
        .from("profiles")
        .select("id, user_id, full_name, avatar_url, team, regional, points, badges_count")
        .in("user_id", targetUserIds)
        .order("points", { ascending: false });

      // Apply team filter if provided
      if (teamFilter && teamFilter !== "all") {
        query = query.eq("team", teamFilter);
      }

      const { data, error } = await query;

      if (error) throw error;

      // Add roles to each user for display purposes
      return (data as RankingUser[]).map((user) => ({
        ...user,
        roles: rolesByUser[user.user_id] || ["student"],
      }));
    },
  });
};

// Team ranking with optional team filter
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

// Hook to get all available teams for filtering
export const useAvailableTeamsForRanking = () => {
  return useQuery({
    queryKey: ["available-teams-ranking"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("team")
        .not("team", "is", null);

      if (error) throw error;

      // Get unique teams
      const teams = [...new Set(data.map((p) => p.team).filter(Boolean))] as string[];
      return teams.sort();
    },
  });
};
