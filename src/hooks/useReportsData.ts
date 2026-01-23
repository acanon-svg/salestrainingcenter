import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { subDays } from "date-fns";

export interface OverviewStats {
  totalCourses: number;
  totalEnrollments: number;
  avgCompletionRate: number;
  avgScore: number;
  activeUsers: number;
  completedThisPeriod: number;
}

export interface RegionalData {
  name: string;
  users: number;
  courses_completed: number;
  avg_score: number;
  completion_rate: number;
}

export interface TeamData {
  team: string;
  regional: string | null;
  users: number;
  avg_score: number;
  completion_rate: number;
  courses_completed: number;
}

export interface CoursePerformance {
  id: string;
  name: string;
  enrollments: number;
  completions: number;
  avg_score: number;
}

interface ReportsFilters {
  dateRange: number;
  regional?: string;
  team?: string;
}

export const useOverviewStats = (filters: ReportsFilters) => {
  return useQuery({
    queryKey: ["reports-overview", filters],
    queryFn: async (): Promise<OverviewStats> => {
      const startDate = subDays(new Date(), filters.dateRange).toISOString();

      // Get total published courses
      const { count: totalCourses } = await supabase
        .from("courses")
        .select("*", { count: "exact", head: true })
        .eq("status", "published");

      // Get enrollments data
      const { data: enrollments } = await supabase
        .from("course_enrollments")
        .select("id, status, score, completed_at");

      const totalEnrollments = enrollments?.length || 0;
      const completedEnrollments = enrollments?.filter(e => e.status === "completed") || [];
      const avgCompletionRate = totalEnrollments > 0 
        ? Math.round((completedEnrollments.length / totalEnrollments) * 100) 
        : 0;
      
      const scores = completedEnrollments.filter(e => e.score !== null).map(e => e.score as number);
      const avgScore = scores.length > 0 
        ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) 
        : 0;

      const completedThisPeriod = enrollments?.filter(
        e => e.completed_at && new Date(e.completed_at) >= new Date(startDate)
      ).length || 0;

      // Get active users (users with recent enrollments)
      const { data: activeProfiles } = await supabase
        .from("profiles")
        .select("id")
        .gte("last_login", startDate);

      return {
        totalCourses: totalCourses || 0,
        totalEnrollments,
        avgCompletionRate,
        avgScore,
        activeUsers: activeProfiles?.length || 0,
        completedThisPeriod,
      };
    },
  });
};

export const useRegionalData = (filters: ReportsFilters) => {
  return useQuery({
    queryKey: ["reports-regional", filters],
    queryFn: async (): Promise<RegionalData[]> => {
      // Get all profiles with regional data
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, user_id, regional");

      if (!profiles) return [];

      // Group by regional
      const regionalGroups = profiles.reduce((acc, profile) => {
        const regional = profile.regional || "Sin Regional";
        if (!acc[regional]) {
          acc[regional] = { users: [], userIds: [] };
        }
        acc[regional].users.push(profile);
        acc[regional].userIds.push(profile.user_id);
        return acc;
      }, {} as Record<string, { users: typeof profiles; userIds: string[] }>);

      // Get enrollments for all users
      const { data: enrollments } = await supabase
        .from("course_enrollments")
        .select("user_id, status, score");

      const result: RegionalData[] = [];

      for (const [regional, group] of Object.entries(regionalGroups)) {
        if (filters.regional && filters.regional !== "all" && 
            regional.toLowerCase() !== filters.regional.toLowerCase()) {
          continue;
        }

        const userEnrollments = enrollments?.filter(e => 
          group.userIds.includes(e.user_id)
        ) || [];

        const completedEnrollments = userEnrollments.filter(e => e.status === "completed");
        const scores = completedEnrollments.filter(e => e.score !== null).map(e => e.score as number);

        result.push({
          name: regional,
          users: group.users.length,
          courses_completed: completedEnrollments.length,
          avg_score: scores.length > 0 
            ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) 
            : 0,
          completion_rate: userEnrollments.length > 0
            ? Math.round((completedEnrollments.length / userEnrollments.length) * 100)
            : 0,
        });
      }

      return result.sort((a, b) => b.courses_completed - a.courses_completed);
    },
  });
};

export const useTeamData = (filters: ReportsFilters) => {
  return useQuery({
    queryKey: ["reports-teams", filters],
    queryFn: async (): Promise<TeamData[]> => {
      // Get all profiles with team data
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, user_id, team, regional");

      if (!profiles) return [];

      // Group by team
      const teamGroups = profiles.reduce((acc, profile) => {
        const team = profile.team || "Sin Equipo";
        if (!acc[team]) {
          acc[team] = { users: [], userIds: [], regional: profile.regional };
        }
        acc[team].users.push(profile);
        acc[team].userIds.push(profile.user_id);
        return acc;
      }, {} as Record<string, { users: typeof profiles; userIds: string[]; regional: string | null }>);

      // Get enrollments for all users
      const { data: enrollments } = await supabase
        .from("course_enrollments")
        .select("user_id, status, score");

      const result: TeamData[] = [];

      for (const [team, group] of Object.entries(teamGroups)) {
        // Apply filters
        if (filters.regional && filters.regional !== "all" && 
            group.regional?.toLowerCase() !== filters.regional.toLowerCase()) {
          continue;
        }
        if (filters.team && filters.team !== "all" && team !== filters.team) {
          continue;
        }

        const userEnrollments = enrollments?.filter(e => 
          group.userIds.includes(e.user_id)
        ) || [];

        const completedEnrollments = userEnrollments.filter(e => e.status === "completed");
        const scores = completedEnrollments.filter(e => e.score !== null).map(e => e.score as number);

        result.push({
          team,
          regional: group.regional,
          users: group.users.length,
          courses_completed: completedEnrollments.length,
          avg_score: scores.length > 0 
            ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) 
            : 0,
          completion_rate: userEnrollments.length > 0
            ? Math.round((completedEnrollments.length / userEnrollments.length) * 100)
            : 0,
        });
      }

      return result.sort((a, b) => b.completion_rate - a.completion_rate);
    },
  });
};

export const useCoursePerformance = (filters: ReportsFilters) => {
  return useQuery({
    queryKey: ["reports-courses", filters],
    queryFn: async (): Promise<CoursePerformance[]> => {
      // Get all published courses
      const { data: courses } = await supabase
        .from("courses")
        .select("id, title")
        .eq("status", "published");

      if (!courses) return [];

      // Get all enrollments
      const { data: enrollments } = await supabase
        .from("course_enrollments")
        .select("course_id, status, score");

      const result: CoursePerformance[] = courses.map(course => {
        const courseEnrollments = enrollments?.filter(e => e.course_id === course.id) || [];
        const completedEnrollments = courseEnrollments.filter(e => e.status === "completed");
        const scores = completedEnrollments.filter(e => e.score !== null).map(e => e.score as number);

        return {
          id: course.id,
          name: course.title,
          enrollments: courseEnrollments.length,
          completions: completedEnrollments.length,
          avg_score: scores.length > 0 
            ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) 
            : 0,
        };
      });

      return result
        .filter(c => c.enrollments > 0)
        .sort((a, b) => b.enrollments - a.enrollments);
    },
  });
};

export const useAvailableTeams = () => {
  return useQuery({
    queryKey: ["available-teams"],
    queryFn: async () => {
      const { data } = await supabase
        .from("profiles")
        .select("team")
        .not("team", "is", null);

      const teams = [...new Set(data?.map(p => p.team).filter(Boolean))];
      return teams as string[];
    },
  });
};

export const useAvailableRegionals = () => {
  return useQuery({
    queryKey: ["available-regionals"],
    queryFn: async () => {
      const { data } = await supabase
        .from("profiles")
        .select("regional")
        .not("regional", "is", null);

      const regionals = [...new Set(data?.map(p => p.regional).filter(Boolean))];
      return regionals as string[];
    },
  });
};
