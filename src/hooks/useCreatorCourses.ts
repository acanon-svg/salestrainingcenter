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
  expires_at: string | null;
  enrolled_count: number;
  avg_score: number | null;
  order_index: number;
  folder_id: string | null;
}

export const useCreatorCourses = () => {
  const { user, profile } = useAuth();

  return useQuery({
    queryKey: ["creator-courses", user?.id, profile?.team],
    queryFn: async () => {
      // Get courses created by this user
      const { data: courses, error } = await supabase
        .from("courses")
        .select("id, title, status, dimension, created_at, published_at, scheduled_at, expires_at, order_index, target_teams, folder_id")
        .eq("created_by", user?.id)
        .order("order_index", { ascending: false })
        .order("created_at", { ascending: false });

      if (error) throw error;

      // Filter by creator's team - only show courses targeted to their team
      let filteredCourses = courses || [];
      if (profile?.team) {
        filteredCourses = filteredCourses.filter((c: any) => {
          const targetTeams = c.target_teams || [];
          return targetTeams.length === 0 || targetTeams.includes(profile.team);
        });
      }

      // Get enrollment stats for each course
      const courseIds = filteredCourses.map((c: any) => c.id);

      if (courseIds.length === 0) return [];

      const { data: enrollments } = await supabase
        .from("course_enrollments")
        .select("course_id, status, score")
        .in("course_id", courseIds);

      // Calculate stats for each course
      const coursesWithStats: CreatorCourse[] =
        filteredCourses.map((course: any) => {
          const courseEnrollments = enrollments?.filter((e) => e.course_id === course.id) || [];
          const completedEnrollments = courseEnrollments.filter((e) => e.status === "completed");
          const scores = completedEnrollments.filter((e) => e.score !== null).map((e) => e.score as number);

          return {
            ...course,
            order_index: course.order_index || 0,
            enrolled_count: courseEnrollments.length,
            avg_score: scores.length > 0 ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : null,
          };
        }) || [];

      return coursesWithStats;
    },
    enabled: !!user?.id,
  });
};

export const useUpdateCourseOrder = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ courseId, newOrder }: { courseId: string; newOrder: number }) => {
      const { error } = await supabase
        .from("courses")
        .update({ order_index: newOrder })
        .eq("id", courseId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["creator-courses"] });
      queryClient.invalidateQueries({ queryKey: ["courses"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "No se pudo actualizar el orden",
        variant: "destructive",
      });
    },
  });
};

export const useBulkUpdateCourseOrder = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (updates: { id: string; order_index: number }[]) => {
      // Update each course's order
      for (const update of updates) {
        const { error } = await supabase
          .from("courses")
          .update({ order_index: update.order_index })
          .eq("id", update.id);

        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["creator-courses"] });
      queryClient.invalidateQueries({ queryKey: ["courses"] });
      toast({
        title: "Orden actualizado",
        description: "El orden de los cursos se ha guardado correctamente.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "No se pudo actualizar el orden",
        variant: "destructive",
      });
    },
  });
};

export const usePublishCourse = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (courseId: string) => {
      const { error } = await supabase
        .from("courses")
        .update({ 
          status: "published",
          published_at: new Date().toISOString(),
          scheduled_at: null
        })
        .eq("id", courseId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["creator-courses"] });
      queryClient.invalidateQueries({ queryKey: ["courses"] });
      toast({
        title: "Curso publicado",
        description: "El curso está ahora visible para los estudiantes.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "No se pudo publicar el curso",
        variant: "destructive",
      });
    },
  });
};

export const useArchiveCourse = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (courseId: string) => {
      const { error } = await supabase
        .from("courses")
        .update({ status: "archived" })
        .eq("id", courseId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["creator-courses"] });
      queryClient.invalidateQueries({ queryKey: ["courses"] });
      toast({
        title: "Curso archivado",
        description: "El curso ha sido archivado correctamente.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "No se pudo archivar el curso",
        variant: "destructive",
      });
    },
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
