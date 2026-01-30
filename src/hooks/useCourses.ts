import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getSupabaseClient, Course, CourseEnrollment } from "@/lib/types";
import { useAuth } from "@/contexts/AuthContext";

const client = getSupabaseClient();

export const useCourses = (filters?: { status?: string; dimension?: string }) => {
  const { profile, user } = useAuth();

  return useQuery({
    queryKey: ["courses", filters, profile?.team, user?.id],
    queryFn: async () => {
      let query = client
        .from("courses")
        .select("*, process:processes(*)")
        .order("created_at", { ascending: false });

      if (filters?.status) {
        query = query.eq("status", filters.status);
      }
      if (filters?.dimension) {
        query = query.eq("dimension", filters.dimension);
      }

      const { data, error } = await query;
      if (error) throw error;

      // Filter courses by target_teams and target_users on the client
      // A course is visible if:
      // 1. No target_teams AND no target_users (available to all)
      // 2. User's team is in target_teams
      // 3. User's ID is in target_users
      const filteredCourses = (data as Course[]).filter((course) => {
        const hasNoTargeting =
          (!course.target_teams || course.target_teams.length === 0) &&
          (!course.target_users || course.target_users.length === 0);

        if (hasNoTargeting) return true;

        const userTeamMatches =
          profile?.team && course.target_teams?.includes(profile.team);

        const userIdMatches =
          user?.id && course.target_users?.includes(user.id);

        return userTeamMatches || userIdMatches;
      });

      return filteredCourses;
    },
  });
};

export const useCourse = (courseId: string) => {
  return useQuery({
    queryKey: ["course", courseId],
    queryFn: async () => {
      const { data, error } = await client
        .from("courses")
        .select("*, process:processes(*)")
        .eq("id", courseId)
        .single();

      if (error) throw error;
      return data as Course;
    },
    enabled: !!courseId,
  });
};

export const useMyEnrollments = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["enrollments", user?.id],
    queryFn: async () => {
      if (!user?.id) return [];

      const { data, error } = await client
        .from("course_enrollments")
        .select("*, course:courses(*, process:processes(*))")
        .eq("user_id", user.id)
        .order("updated_at", { ascending: false });

      if (error) throw error;
      return data as CourseEnrollment[];
    },
    enabled: !!user?.id,
  });
};

export const useEnrollInCourse = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (courseId: string) => {
      if (!user?.id) throw new Error("User not authenticated");

      const { data, error } = await client
        .from("course_enrollments")
        .insert({
          user_id: user.id,
          course_id: courseId,
          status: "enrolled",
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["enrollments"] });
    },
  });
};

export const useUpdateEnrollmentProgress = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      enrollmentId,
      progress,
      status,
    }: {
      enrollmentId: string;
      progress: number;
      status?: string;
    }) => {
      const updates: any = { progress_percentage: progress };
      if (status) updates.status = status;
      if (progress === 100 && !updates.completed_at) {
        updates.completed_at = new Date().toISOString();
        updates.status = "completed";
      }

      const { data, error } = await client
        .from("course_enrollments")
        .update(updates)
        .eq("id", enrollmentId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["enrollments"] });
    },
  });
};

export const useCourseMaterials = (courseId: string) => {
  return useQuery({
    queryKey: ["course-materials", courseId],
    queryFn: async () => {
      const { data, error } = await client
        .from("course_materials")
        .select("*")
        .eq("course_id", courseId)
        .order("order_index");

      if (error) throw error;
      return data;
    },
    enabled: !!courseId,
  });
};

export const useCourseQuizzes = (courseId: string) => {
  return useQuery({
    queryKey: ["course-quizzes", courseId],
    queryFn: async () => {
      const { data, error } = await client
        .from("quizzes")
        .select("*, questions:quiz_questions(*)")
        .eq("course_id", courseId)
        .order("order_index");

      if (error) throw error;
      return data;
    },
    enabled: !!courseId,
  });
};

export const useCourseResources = (courseId: string) => {
  return useQuery({
    queryKey: ["course-resources", courseId],
    queryFn: async () => {
      const { data, error } = await client
        .from("course_resources")
        .select("*")
        .eq("course_id", courseId)
        .order("order_index");

      if (error) throw error;
      return data as { id: string; course_id: string; title: string; url: string; order_index: number; created_at: string }[];
    },
    enabled: !!courseId,
  });
};
