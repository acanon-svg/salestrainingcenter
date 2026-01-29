import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

export interface CreatorCourse {
  id: string;
  title: string;
  status: string;
  dimension: string;
  created_at: string;
  published_at: string | null;
  scheduled_at: string | null;
  enrolled_count: number;
  avg_score: number | null;
}

export const useCreatorCourses = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["creator-courses", user?.id],
    queryFn: async () => {
      // Get courses created by this user
      const { data: courses, error } = await supabase
        .from("courses")
        .select("id, title, status, dimension, created_at, published_at, scheduled_at")
        .eq("created_by", user?.id)
        .order("created_at", { ascending: false });

      if (error) throw error;

      // Get enrollment stats for each course
      const courseIds = courses?.map((c) => c.id) || [];

      if (courseIds.length === 0) return [];

      const { data: enrollments } = await supabase
        .from("course_enrollments")
        .select("course_id, status, score")
        .in("course_id", courseIds);

      // Calculate stats for each course
      const coursesWithStats: CreatorCourse[] =
        courses?.map((course) => {
          const courseEnrollments = enrollments?.filter((e) => e.course_id === course.id) || [];
          const completedEnrollments = courseEnrollments.filter((e) => e.status === "completed");
          const scores = completedEnrollments.filter((e) => e.score !== null).map((e) => e.score as number);

          return {
            ...course,
            enrolled_count: courseEnrollments.length,
            avg_score: scores.length > 0 ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : null,
          };
        }) || [];

      return coursesWithStats;
    },
    enabled: !!user?.id,
  });
};

export const useDeleteCourse = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (courseId: string) => {
      // First delete related data
      // Delete course materials
      await supabase.from("course_materials").delete().eq("course_id", courseId);

      // Delete quizzes and their questions
      const { data: quizzes } = await supabase.from("quizzes").select("id").eq("course_id", courseId);

      if (quizzes && quizzes.length > 0) {
        const quizIds = quizzes.map((q) => q.id);
        await supabase.from("quiz_questions").delete().in("quiz_id", quizIds);
        await supabase.from("quiz_attempts").delete().in("quiz_id", quizIds);
        await supabase.from("quizzes").delete().eq("course_id", courseId);
      }

      // Delete enrollments
      await supabase.from("course_enrollments").delete().eq("course_id", courseId);

      // Finally delete the course
      const { error } = await supabase.from("courses").delete().eq("id", courseId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["creator-courses"] });
      queryClient.invalidateQueries({ queryKey: ["courses"] });
      toast({
        title: "Curso eliminado",
        description: "El curso ha sido eliminado correctamente.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "No se pudo eliminar el curso",
        variant: "destructive",
      });
    },
  });
};
