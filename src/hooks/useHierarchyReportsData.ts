import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useLeaderHierarchy } from "./useLeaderHierarchy";
import { subDays, format, eachDayOfInterval, startOfDay } from "date-fns";
import { es } from "date-fns/locale";

interface HierarchyReportsFilters {
  dateRange: number;
}

export interface HierarchyOverviewStats {
  totalCourses: number;
  totalEnrollments: number;
  avgCompletionRate: number;
  avgScore: number;
  activeUsers: number;
  completedThisPeriod: number;
  teamName: string;
  isOwnTeam: boolean;
}

export interface HierarchyTeamData {
  team: string;
  regional: string | null;
  users: number;
  avg_score: number;
  completion_rate: number;
  courses_completed: number;
  subordinate_name?: string;
}

/**
 * Hook to get user IDs that a leader should see in reports
 * - If the leader is a supervisor (has subordinates), return users from subordinate leaders' teams
 * - If the leader is a regular leader (no subordinates), return users from their own team
 */
export const useLeaderReportUserIds = () => {
  const { user, profile, hasRole } = useAuth();
  const { hierarchies } = useLeaderHierarchy();
  const isLeader = hasRole("lider");

  return useQuery({
    queryKey: ["leader-report-user-ids", user?.id, hierarchies],
    queryFn: async () => {
      if (!user?.id || !isLeader) return null;

      // Check if this leader is a supervisor (has subordinates assigned to them)
      const subordinateLeaderIds = hierarchies
        ?.filter((h) => h.supervisor_id === user.id)
        .map((h) => h.subordinate_id) || [];

      const isSupervisor = subordinateLeaderIds.length > 0;

      if (isSupervisor) {
        // Get all profiles from subordinate leaders' teams
        const { data: subordinateProfiles, error } = await supabase
          .from("profiles")
          .select("user_id, team, regional, full_name")
          .in("user_id", subordinateLeaderIds);

        if (error) throw error;

        // Get subordinate teams
        const subordinateTeams = [...new Set(subordinateProfiles?.map((p) => p.team).filter(Boolean))];

        // Get all users from those teams
        const { data: teamUsers, error: teamError } = await supabase
          .from("profiles")
          .select("user_id, team, regional, full_name")
          .in("team", subordinateTeams as string[]);

        if (teamError) throw teamError;

        return {
          userIds: teamUsers?.map((u) => u.user_id) || [],
          teams: subordinateTeams as string[],
          isSupervisor: true,
          subordinateLeaders: subordinateProfiles || [],
        };
      } else {
        // Regular leader - only see their own team
        if (!profile?.team) return null;

        const { data: teamUsers, error } = await supabase
          .from("profiles")
          .select("user_id, team, regional, full_name")
          .eq("team", profile.team);

        if (error) throw error;

        return {
          userIds: teamUsers?.map((u) => u.user_id) || [],
          teams: [profile.team],
          isSupervisor: false,
          subordinateLeaders: [],
        };
      }
    },
    enabled: !!user?.id && isLeader,
  });
};

export const useHierarchyOverviewStats = (filters: HierarchyReportsFilters) => {
  const { data: leaderData } = useLeaderReportUserIds();

  return useQuery({
    queryKey: ["hierarchy-reports-overview", filters, leaderData?.userIds],
    queryFn: async (): Promise<HierarchyOverviewStats | null> => {
      if (!leaderData) return null;

      const { userIds, teams, isSupervisor } = leaderData;
      const startDate = subDays(new Date(), filters.dateRange).toISOString();

      // Get total published courses
      const { count: totalCourses } = await supabase
        .from("courses")
        .select("*", { count: "exact", head: true })
        .eq("status", "published");

      // Get enrollments for these users
      const { data: enrollments } = await supabase
        .from("course_enrollments")
        .select("id, status, score, completed_at, user_id")
        .in("user_id", userIds);

      const totalEnrollments = enrollments?.length || 0;
      const completedEnrollments = enrollments?.filter((e) => e.status === "completed") || [];
      const avgCompletionRate =
        totalEnrollments > 0 ? Math.round((completedEnrollments.length / totalEnrollments) * 100) : 0;

      const scores = completedEnrollments.filter((e) => e.score !== null).map((e) => e.score as number);
      const avgScore = scores.length > 0 ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0;

      const completedThisPeriod =
        enrollments?.filter((e) => e.completed_at && new Date(e.completed_at) >= new Date(startDate)).length || 0;

      // Active users
      const { data: activeProfiles } = await supabase
        .from("profiles")
        .select("id")
        .in("user_id", userIds)
        .gte("last_login", startDate);

      return {
        totalCourses: totalCourses || 0,
        totalEnrollments,
        avgCompletionRate,
        avgScore,
        activeUsers: activeProfiles?.length || 0,
        completedThisPeriod,
        teamName: isSupervisor ? "Equipos Supervisados" : teams[0] || "Mi Equipo",
        isOwnTeam: !isSupervisor,
      };
    },
    enabled: !!leaderData?.userIds?.length,
  });
};

export const useHierarchyTeamData = (filters: HierarchyReportsFilters) => {
  const { data: leaderData } = useLeaderReportUserIds();

  return useQuery({
    queryKey: ["hierarchy-reports-teams", filters, leaderData?.userIds],
    queryFn: async (): Promise<HierarchyTeamData[]> => {
      if (!leaderData) return [];

      const { userIds, teams, isSupervisor, subordinateLeaders } = leaderData;

      // Get all profiles for these users
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, user_id, team, regional")
        .in("user_id", userIds);

      if (!profiles) return [];

      // Group by team
      const teamGroups = profiles.reduce(
        (acc, profile) => {
          const team = profile.team || "Sin Equipo";
          if (!acc[team]) {
            acc[team] = { users: [], userIds: [], regional: profile.regional };
          }
          acc[team].users.push(profile);
          acc[team].userIds.push(profile.user_id);
          return acc;
        },
        {} as Record<string, { users: typeof profiles; userIds: string[]; regional: string | null }>
      );

      // Get enrollments for all these users
      const { data: enrollments } = await supabase
        .from("course_enrollments")
        .select("user_id, status, score")
        .in("user_id", userIds);

      const result: HierarchyTeamData[] = [];

      for (const [team, group] of Object.entries(teamGroups)) {
        const userEnrollments = enrollments?.filter((e) => group.userIds.includes(e.user_id)) || [];
        const completedEnrollments = userEnrollments.filter((e) => e.status === "completed");
        const scores = completedEnrollments.filter((e) => e.score !== null).map((e) => e.score as number);

        // Find the subordinate leader for this team (if supervisor)
        const subordinateLeader = subordinateLeaders.find((l) => l.team === team);

        result.push({
          team,
          regional: group.regional,
          users: group.users.length,
          courses_completed: completedEnrollments.length,
          avg_score: scores.length > 0 ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0,
          completion_rate:
            userEnrollments.length > 0 ? Math.round((completedEnrollments.length / userEnrollments.length) * 100) : 0,
          subordinate_name: subordinateLeader?.full_name || undefined,
        });
      }

      return result.sort((a, b) => b.completion_rate - a.completion_rate);
    },
    enabled: !!leaderData?.userIds?.length,
  });
};

export interface HierarchyTrendDataPoint {
  date: string;
  completions: number;
  enrollments: number;
}

export const useHierarchyTrendData = (filters: HierarchyReportsFilters) => {
  const { data: leaderData } = useLeaderReportUserIds();

  return useQuery({
    queryKey: ["hierarchy-reports-trend", filters, leaderData?.userIds],
    queryFn: async (): Promise<HierarchyTrendDataPoint[]> => {
      if (!leaderData) return [];

      const { userIds } = leaderData;
      const endDate = new Date();
      const startDate = subDays(endDate, filters.dateRange);

      // Get all enrollments in the date range for these users
      const { data: enrollments } = await supabase
        .from("course_enrollments")
        .select("created_at, completed_at, status, user_id")
        .in("user_id", userIds)
        .gte("created_at", startDate.toISOString());

      if (!enrollments) return [];

      // Generate all days in the range
      const days = eachDayOfInterval({ start: startDate, end: endDate });

      const trendData: HierarchyTrendDataPoint[] = days.map((day) => {
        const dayStart = startOfDay(day);
        const dayEnd = new Date(dayStart);
        dayEnd.setDate(dayEnd.getDate() + 1);

        const dayEnrollments = enrollments.filter((e) => {
          const createdAt = new Date(e.created_at);
          return createdAt >= dayStart && createdAt < dayEnd;
        }).length;

        const dayCompletions = enrollments.filter((e) => {
          if (!e.completed_at) return false;
          const completedAt = new Date(e.completed_at);
          return completedAt >= dayStart && completedAt < dayEnd;
        }).length;

        return {
          date: format(day, "dd MMM", { locale: es }),
          enrollments: dayEnrollments,
          completions: dayCompletions,
        };
      });

      return trendData;
    },
    enabled: !!leaderData?.userIds?.length,
  });
};

export interface HierarchyStatusDistribution {
  name: string;
  value: number;
  color: string;
}

export const useHierarchyStatusDistribution = (filters: HierarchyReportsFilters) => {
  const { data: leaderData } = useLeaderReportUserIds();

  return useQuery({
    queryKey: ["hierarchy-reports-status-distribution", filters, leaderData?.userIds],
    queryFn: async (): Promise<HierarchyStatusDistribution[]> => {
      if (!leaderData) return [];

      const { userIds } = leaderData;

      const { data: enrollments } = await supabase
        .from("course_enrollments")
        .select("status, user_id")
        .in("user_id", userIds);

      if (!enrollments) return [];

      const statusCounts = enrollments.reduce(
        (acc, e) => {
          acc[e.status] = (acc[e.status] || 0) + 1;
          return acc;
        },
        {} as Record<string, number>
      );

      const statusConfig: Record<string, { label: string; color: string }> = {
        enrolled: { label: "Inscrito", color: "hsl(var(--primary))" },
        in_progress: { label: "En Progreso", color: "hsl(var(--addi-yellow))" },
        completed: { label: "Completado", color: "hsl(var(--success))" },
        failed: { label: "No Aprobado", color: "hsl(var(--destructive))" },
      };

      return Object.entries(statusCounts).map(([status, count]) => ({
        name: statusConfig[status]?.label || status,
        value: count,
        color: statusConfig[status]?.color || "hsl(var(--muted))",
      }));
    },
    enabled: !!leaderData?.userIds?.length,
  });
};
