import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface DashboardStats {
  completedCourses: number;
  inProgressCourses: number;
  averageScore: number;
  totalPoints: number;
  badgesCount: number;
  rankingPosition: number;
  totalUsers: number;
}

export interface RecentCourse {
  id: string;
  name: string;
  progress: number;
  score: number | null;
  completedAt: string | null;
}

export interface PendingCourse {
  id: string;
  name: string;
  expiresAt: string | null;
  progress: number;
}

export interface EarnedBadge {
  id: string;
  name: string;
  icon: string | null;
  earned: boolean;
  earnedAt: string | null;
}

export const useDashboardStats = () => {
  const { user, profile } = useAuth();

  return useQuery({
    queryKey: ["dashboard-stats", user?.id],
    queryFn: async (): Promise<DashboardStats> => {
      if (!user?.id) {
        return {
          completedCourses: 0,
          inProgressCourses: 0,
          averageScore: 0,
          totalPoints: profile?.points || 0,
          badgesCount: profile?.badges_count || 0,
          rankingPosition: 0,
          totalUsers: 0,
        };
      }

      // Fetch user's enrollments
      const { data: enrollments, error: enrollmentError } = await supabase
        .from("course_enrollments")
        .select("status, score, progress_percentage")
        .eq("user_id", user.id);

      if (enrollmentError) throw enrollmentError;

      const completedCourses = enrollments?.filter((e) => e.status === "completed").length || 0;
      const inProgressCourses = enrollments?.filter((e) => e.status === "in_progress" || e.status === "enrolled").length || 0;
      
      // Calculate average score from completed courses with scores
      const scoresWithValues = enrollments
        ?.filter((e) => e.status === "completed" && e.score !== null)
        .map((e) => e.score as number) || [];
      const averageScore = scoresWithValues.length > 0
        ? Math.round(scoresWithValues.reduce((a, b) => a + b, 0) / scoresWithValues.length)
        : 0;

      // Get ranking position
      const { data: allUsers, error: usersError } = await supabase
        .from("profiles")
        .select("user_id, points")
        .order("points", { ascending: false });

      if (usersError) throw usersError;

      const rankingPosition = (allUsers?.findIndex((u) => u.user_id === user.id) ?? -1) + 1;
      const totalUsers = allUsers?.length || 0;

      return {
        completedCourses,
        inProgressCourses,
        averageScore,
        totalPoints: profile?.points || 0,
        badgesCount: profile?.badges_count || 0,
        rankingPosition: rankingPosition > 0 ? rankingPosition : totalUsers,
        totalUsers,
      };
    },
    enabled: !!user?.id,
  });
};

export const useRecentCourses = (limit: number = 5) => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["recent-courses", user?.id, limit],
    queryFn: async (): Promise<RecentCourse[]> => {
      if (!user?.id) return [];

      const { data, error } = await supabase
        .from("course_enrollments")
        .select(`
          id,
          progress_percentage,
          score,
          completed_at,
          course:courses(id, title)
        `)
        .eq("user_id", user.id)
        .order("updated_at", { ascending: false })
        .limit(limit);

      if (error) throw error;

      return (data || []).map((enrollment: any) => ({
        id: enrollment.course?.id || enrollment.id,
        name: enrollment.course?.title || "Curso sin nombre",
        progress: enrollment.progress_percentage || 0,
        score: enrollment.score,
        completedAt: enrollment.completed_at,
      }));
    },
    enabled: !!user?.id,
  });
};

export const usePendingCourses = (limit: number = 5) => {
  const { user, profile } = useAuth();

  return useQuery({
    queryKey: ["pending-courses", user?.id, profile?.team, limit],
    queryFn: async (): Promise<PendingCourse[]> => {
      if (!user?.id) return [];

      // Get all published courses that are targeted to the user
      const { data: courses, error: coursesError } = await supabase
        .from("courses")
        .select("id, title, expires_at, target_teams, target_users")
        .eq("status", "published")
        .order("created_at", { ascending: false });

      if (coursesError) throw coursesError;

      // Get user's enrollments
      const { data: enrollments, error: enrollmentError } = await supabase
        .from("course_enrollments")
        .select("course_id, status, progress_percentage")
        .eq("user_id", user.id);

      if (enrollmentError) throw enrollmentError;

      const enrollmentMap = new Map(
        (enrollments || []).map((e) => [e.course_id, e])
      );

      // Filter courses that are targeted to the user and not completed
      const pendingCourses = (courses || [])
        .filter((course: any) => {
          // Check if course is targeted to user
          const hasNoTargeting =
            (!course.target_teams || course.target_teams.length === 0) &&
            (!course.target_users || course.target_users.length === 0);
          
          const userTeamMatches =
            profile?.team && course.target_teams?.includes(profile.team);
          const userIdMatches =
            user?.id && course.target_users?.includes(user.id);

          const isTargetedToUser = hasNoTargeting || userTeamMatches || userIdMatches;
          if (!isTargetedToUser) return false;

          // Check if not completed
          const enrollment = enrollmentMap.get(course.id);
          if (enrollment?.status === "completed") return false;

          return true;
        })
        .slice(0, limit)
        .map((course: any) => {
          const enrollment = enrollmentMap.get(course.id);
          return {
            id: course.id,
            name: course.title,
            expiresAt: course.expires_at,
            progress: enrollment?.progress_percentage || 0,
          };
        });

      return pendingCourses;
    },
    enabled: !!user?.id,
  });
};

export const useUserBadgesForDashboard = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["user-badges-dashboard", user?.id],
    queryFn: async (): Promise<EarnedBadge[]> => {
      if (!user?.id) return [];

      // Get all badges
      const { data: allBadges, error: badgesError } = await supabase
        .from("badges")
        .select("id, name, icon_emoji, icon_url")
        .order("created_at", { ascending: true });

      if (badgesError) throw badgesError;

      // Get user's earned badges
      const { data: userBadges, error: userBadgesError } = await supabase
        .from("user_badges")
        .select("badge_id, earned_at")
        .eq("user_id", user.id);

      if (userBadgesError) throw userBadgesError;

      const earnedBadgesMap = new Map(
        (userBadges || []).map((ub) => [ub.badge_id, ub.earned_at])
      );

      return (allBadges || []).map((badge) => ({
        id: badge.id,
        name: badge.name,
        icon: badge.icon_emoji || badge.icon_url,
        earned: earnedBadgesMap.has(badge.id),
        earnedAt: earnedBadgesMap.get(badge.id) || null,
      }));
    },
    enabled: !!user?.id,
  });
};
