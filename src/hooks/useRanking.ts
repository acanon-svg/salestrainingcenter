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
  completedCourses?: number;
  avgQuizScore?: number;
  compositeScore?: number;
}

export interface RankingCompetitor {
  name: string;
  pointsAhead: number;
}

// Compute composite score: (completedCourses × 30) + (avgQuiz × 0.4) + (badges × 10)
function computeComposite(completed: number, avgQuiz: number, badges: number): number {
  return Math.round((completed * 30) + (avgQuiz * 0.4) + (badges * 10));
}

// Ranking filtered by role type with composite scoring
export const useRankingByRoleType = (
  roleType: "students_only" | "leaders",
  teamFilter?: string
) => {
  return useQuery({
    queryKey: ["ranking-by-role", roleType, teamFilter],
    queryFn: async () => {
      // Get user roles
      const { data: userRoles, error: rolesError } = await supabase
        .from("user_roles")
        .select("user_id, role");
      if (rolesError) throw rolesError;

      const rolesByUser: Record<string, string[]> = {};
      userRoles?.forEach((ur) => {
        if (!rolesByUser[ur.user_id]) rolesByUser[ur.user_id] = [];
        rolesByUser[ur.user_id].push(ur.role);
      });

      let targetUserIds: string[] = [];
      if (roleType === "students_only") {
        targetUserIds = Object.entries(rolesByUser)
          .filter(([_, roles]) => roles.length === 1 && roles[0] === "student")
          .map(([userId]) => userId);
      } else {
        targetUserIds = Object.entries(rolesByUser)
          .filter(([_, roles]) => roles.includes("lider"))
          .map(([userId]) => userId);
      }

      if (targetUserIds.length === 0) return [];

      // Fetch profiles
      let query = supabase
        .from("profiles")
        .select("id, user_id, full_name, avatar_url, team, regional, points, badges_count")
        .in("user_id", targetUserIds)
        .order("points", { ascending: false });

      if (teamFilter && teamFilter !== "all") {
        query = query.eq("team", teamFilter);
      }

      const { data, error } = await query;
      if (error) throw error;

      // Fetch enrollments for completed count and quiz scores
      const { data: enrollments } = await supabase
        .from("course_enrollments")
        .select("user_id, status, score")
        .in("user_id", targetUserIds);

      const { data: quizAttempts } = await supabase
        .from("quiz_attempts")
        .select("user_id, score")
        .in("user_id", targetUserIds);

      // Aggregate per user
      const completedByUser: Record<string, number> = {};
      const quizScoresByUser: Record<string, number[]> = {};

      (enrollments || []).forEach((e: any) => {
        if (e.status === "completed") {
          completedByUser[e.user_id] = (completedByUser[e.user_id] || 0) + 1;
        }
      });

      (quizAttempts || []).forEach((q: any) => {
        if (!quizScoresByUser[q.user_id]) quizScoresByUser[q.user_id] = [];
        quizScoresByUser[q.user_id].push(q.score || 0);
      });

      // Build enriched ranking
      const enriched = (data as RankingUser[]).map((user) => {
        const completed = completedByUser[user.user_id] || 0;
        const scores = quizScoresByUser[user.user_id] || [];
        const avgQuiz = scores.length > 0 ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0;
        const composite = computeComposite(completed, avgQuiz, user.badges_count);

        return {
          ...user,
          roles: rolesByUser[user.user_id] || ["student"],
          completedCourses: completed,
          avgQuizScore: avgQuiz,
          compositeScore: composite,
        };
      });

      // Sort by composite score descending
      enriched.sort((a, b) => (b.compositeScore || 0) - (a.compositeScore || 0));

      return enriched;
    },
  });
};

// General ranking
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

// Team ranking
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

// Competitor hook
export const useRankingCompetitor = (userId: string | undefined) => {
  return useQuery({
    queryKey: ["ranking-competitor", userId],
    queryFn: async (): Promise<RankingCompetitor | null> => {
      if (!userId) return null;
      const { data: allUsers, error } = await supabase
        .from("profiles")
        .select("user_id, full_name, points")
        .order("points", { ascending: false });
      if (error) throw error;
      if (!allUsers || allUsers.length === 0) return null;

      const idx = allUsers.findIndex((u) => u.user_id === userId);
      if (idx <= 0) return null;

      const above = allUsers[idx - 1];
      const current = allUsers[idx];
      if (!above || !current) return null;

      return {
        name: above.full_name?.split(" ")[0] || "Usuario",
        pointsAhead: above.points - current.points,
      };
    },
    enabled: !!userId,
  });
};

// Available teams
export const useAvailableTeamsForRanking = () => {
  return useQuery({
    queryKey: ["available-teams-ranking"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("team")
        .not("team", "is", null);
      if (error) throw error;
      const teams = [...new Set(data.map((p) => p.team).filter(Boolean))] as string[];
      return teams.sort();
    },
  });
};
