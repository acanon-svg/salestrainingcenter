import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface MemberCourseBreakdown {
  user_id: string;
  full_name: string;
  email: string;
  team: string | null;
  total_courses: number;
  completed: number;
  in_progress: number;
  not_started: number;
  failed: number;
  expired: number;
  avg_score: number;
  completion_rate: number;
}

export const useTeamMemberCourseBreakdown = (userIds: string[] | undefined) => {
  return useQuery({
    queryKey: ["team-member-course-breakdown", userIds?.sort().join(",")],
    queryFn: async (): Promise<MemberCourseBreakdown[]> => {
      if (!userIds || userIds.length === 0) return [];

      // Fetch profiles
      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, full_name, email, team")
        .in("user_id", userIds);

      if (!profiles) return [];

      // Fetch all published courses
      const { data: courses } = await supabase
        .from("courses")
        .select("id, expires_at")
        .eq("status", "published");

      const totalPublishedCourses = courses?.length || 0;
      const now = new Date();

      // Fetch enrollments for these users
      const { data: enrollments } = await supabase
        .from("course_enrollments")
        .select("user_id, course_id, status, score, completed_at, personal_expires_at")
        .in("user_id", userIds);

      const result: MemberCourseBreakdown[] = profiles.map((profile) => {
        const userEnrollments = enrollments?.filter((e) => e.user_id === profile.user_id) || [];
        const enrolledCourseIds = new Set(userEnrollments.map((e) => e.course_id));

        const completed = userEnrollments.filter((e) => e.status === "completed").length;
        const failed = userEnrollments.filter((e) => e.status === "failed").length;
        const inProgress = userEnrollments.filter(
          (e) => e.status === "in_progress" || e.status === "enrolled"
        ).length;

        // Expired: courses that have passed their expiry and user didn't complete
        let expired = 0;
        userEnrollments.forEach((enrollment) => {
          if (enrollment.status === "completed") return;
          const course = courses?.find((c) => c.id === enrollment.course_id);
          const personalExpiry = enrollment.personal_expires_at
            ? new Date(enrollment.personal_expires_at)
            : null;
          const courseExpiry = course?.expires_at ? new Date(course.expires_at) : null;
          const effectiveExpiry = personalExpiry || courseExpiry;
          if (effectiveExpiry && effectiveExpiry < now) {
            expired++;
          }
        });

        // Not started: published courses user is not enrolled in
        const notStarted = Math.max(0, totalPublishedCourses - enrolledCourseIds.size);

        const scores = userEnrollments
          .filter((e) => e.status === "completed" && e.score !== null)
          .map((e) => e.score as number);
        const avgScore =
          scores.length > 0
            ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length)
            : 0;

        const completionRate =
          totalPublishedCourses > 0
            ? Math.round((completed / totalPublishedCourses) * 100)
            : 0;

        return {
          user_id: profile.user_id,
          full_name: profile.full_name || profile.email || "Sin nombre",
          email: profile.email || "",
          team: profile.team,
          total_courses: totalPublishedCourses,
          completed,
          in_progress: inProgress - expired, // Subtract expired from in_progress
          not_started: notStarted,
          failed,
          expired,
          avg_score: avgScore,
          completion_rate: completionRate,
        };
      });

      return result.sort((a, b) => b.completion_rate - a.completion_rate);
    },
    enabled: !!userIds && userIds.length > 0,
  });
};
