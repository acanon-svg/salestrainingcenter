import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { subDays, format, eachDayOfInterval, startOfDay } from "date-fns";
import { es } from "date-fns/locale";

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

export interface TrendDataPoint {
  date: string;
  completions: number;
  enrollments: number;
}

export const useTrendData = (filters: ReportsFilters) => {
  return useQuery({
    queryKey: ["reports-trend", filters],
    queryFn: async (): Promise<TrendDataPoint[]> => {
      const endDate = new Date();
      const startDate = subDays(endDate, filters.dateRange);

      // Get all enrollments in the date range
      const { data: enrollments } = await supabase
        .from("course_enrollments")
        .select("created_at, completed_at, status")
        .gte("created_at", startDate.toISOString());

      if (!enrollments) return [];

      // Generate all days in the range
      const days = eachDayOfInterval({ start: startDate, end: endDate });

      const trendData: TrendDataPoint[] = days.map(day => {
        const dayStart = startOfDay(day);
        const dayEnd = new Date(dayStart);
        dayEnd.setDate(dayEnd.getDate() + 1);

        const dayEnrollments = enrollments.filter(e => {
          const createdAt = new Date(e.created_at);
          return createdAt >= dayStart && createdAt < dayEnd;
        }).length;

        const dayCompletions = enrollments.filter(e => {
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
  });
};

export interface StatusDistribution {
  name: string;
  value: number;
  color: string;
}

export const useStatusDistribution = (filters: ReportsFilters) => {
  return useQuery({
    queryKey: ["reports-status-distribution", filters],
    queryFn: async (): Promise<StatusDistribution[]> => {
      const { data: enrollments } = await supabase
        .from("course_enrollments")
        .select("status");

      if (!enrollments) return [];

      const statusCounts = enrollments.reduce((acc, e) => {
        acc[e.status] = (acc[e.status] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

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
  });
};

export interface MonthlyComparison {
  month: string;
  enrollments: number;
  completions: number;
  avgScore: number;
  completionRate: number;
}

export const useMonthlyComparison = () => {
  return useQuery({
    queryKey: ["reports-monthly-comparison"],
    queryFn: async (): Promise<MonthlyComparison[]> => {
      // Get data for the last 6 months
      const endDate = new Date();
      const startDate = subDays(endDate, 180);

      const { data: enrollments } = await supabase
        .from("course_enrollments")
        .select("created_at, completed_at, status, score")
        .gte("created_at", startDate.toISOString());

      if (!enrollments) return [];

      // Group by month
      const monthlyData: Record<string, {
        enrollments: number;
        completions: number;
        scores: number[];
      }> = {};

      // Initialize last 6 months
      for (let i = 5; i >= 0; i--) {
        const date = subDays(endDate, i * 30);
        const monthKey = format(date, "yyyy-MM");
        monthlyData[monthKey] = { enrollments: 0, completions: 0, scores: [] };
      }

      enrollments.forEach(enrollment => {
        const monthKey = format(new Date(enrollment.created_at), "yyyy-MM");
        
        if (monthlyData[monthKey]) {
          monthlyData[monthKey].enrollments++;
          
          if (enrollment.status === "completed") {
            monthlyData[monthKey].completions++;
            if (enrollment.score !== null) {
              monthlyData[monthKey].scores.push(enrollment.score);
            }
          }
        }
      });

      return Object.entries(monthlyData)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([monthKey, data]) => {
          const date = new Date(monthKey + "-01");
          return {
            month: format(date, "MMM yyyy", { locale: es }),
            enrollments: data.enrollments,
            completions: data.completions,
            avgScore: data.scores.length > 0
              ? Math.round(data.scores.reduce((a, b) => a + b, 0) / data.scores.length)
              : 0,
            completionRate: data.enrollments > 0
              ? Math.round((data.completions / data.enrollments) * 100)
              : 0,
          };
        });
    },
  });
};
