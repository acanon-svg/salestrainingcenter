import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export const useBulkArchiveCourses = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (courseIds: string[]) => {
      for (const id of courseIds) {
        const { error } = await supabase
          .from("courses")
          .update({ status: "archived" } as any)
          .eq("id", id);
        if (error) throw error;
      }
    },
    onSuccess: (_, courseIds) => {
      queryClient.invalidateQueries({ queryKey: ["creator-courses"] });
      queryClient.invalidateQueries({ queryKey: ["courses"] });
      toast({
        title: "Cursos archivados",
        description: `${courseIds.length} curso(s) archivado(s) correctamente.`,
      });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });
};

export const useBulkReactivateCourses = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (courseIds: string[]) => {
      for (const id of courseIds) {
        const { error } = await supabase
          .from("courses")
          .update({ status: "published", published_at: new Date().toISOString() } as any)
          .eq("id", id);
        if (error) throw error;
      }
    },
    onSuccess: (_, courseIds) => {
      queryClient.invalidateQueries({ queryKey: ["creator-courses"] });
      queryClient.invalidateQueries({ queryKey: ["courses"] });
      toast({
        title: "Cursos reactivados",
        description: `${courseIds.length} curso(s) reactivado(s) correctamente.`,
      });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });
};

export const useBulkDeleteCourses = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (courseIds: string[]) => {
      for (const id of courseIds) {
        await supabase.from("course_materials").delete().eq("course_id", id);
        const { data: quizzes } = await supabase.from("quizzes").select("id").eq("course_id", id);
        if (quizzes && quizzes.length > 0) {
          const quizIds = quizzes.map((q) => q.id);
          await supabase.from("quiz_questions").delete().in("quiz_id", quizIds);
          await supabase.from("quiz_attempts").delete().in("quiz_id", quizIds);
          await supabase.from("quizzes").delete().eq("course_id", id);
        }
        await supabase.from("course_enrollments").delete().eq("course_id", id);
        const { error } = await supabase.from("courses").delete().eq("id", id);
        if (error) throw error;
      }
    },
    onSuccess: (_, courseIds) => {
      queryClient.invalidateQueries({ queryKey: ["creator-courses"] });
      queryClient.invalidateQueries({ queryKey: ["courses"] });
      toast({
        title: "Cursos eliminados",
        description: `${courseIds.length} curso(s) eliminado(s) correctamente.`,
      });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });
};

export const useBulkClassifyCourses = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({
      courseIds,
      segment,
      category,
      difficulty,
    }: {
      courseIds: string[];
      segment?: string;
      category?: string;
      difficulty?: string;
    }) => {
      for (const id of courseIds) {
        const updates: Record<string, any> = {};
        if (segment) updates.segment = segment;
        if (category) updates.category = category;
        if (difficulty) updates.difficulty = difficulty;

        if (Object.keys(updates).length > 0) {
          const { error } = await supabase
            .from("courses")
            .update(updates as any)
            .eq("id", id);
          if (error) throw error;
        }
      }
    },
    onSuccess: (_, { courseIds }) => {
      queryClient.invalidateQueries({ queryKey: ["creator-courses"] });
      queryClient.invalidateQueries({ queryKey: ["courses"] });
      toast({
        title: "Cursos clasificados",
        description: `${courseIds.length} curso(s) clasificado(s) correctamente.`,
      });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });
};

export const useBulkAssignCourses = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({
      courseIds,
      userIds,
      assignedBy,
    }: {
      courseIds: string[];
      userIds: string[];
      assignedBy: string;
    }) => {
      // For each course-user pair, insert enrollment if not exists
      for (const courseId of courseIds) {
        for (const userId of userIds) {
          // Check if enrollment already exists
          const { data: existing } = await supabase
            .from("course_enrollments")
            .select("id")
            .eq("course_id", courseId)
            .eq("user_id", userId)
            .maybeSingle();

          if (!existing) {
            const { error } = await supabase
              .from("course_enrollments")
              .insert({
                course_id: courseId,
                user_id: userId,
                status: "enrolled",
                started_at: new Date().toISOString(),
              });
            if (error) throw error;
          }
        }

        // Also update target_users on the course to include new users
        const { data: course } = await supabase
          .from("courses")
          .select("target_users")
          .eq("id", courseId)
          .single();

        const existingTargetUsers = (course?.target_users as string[]) || [];
        const mergedUsers = [...new Set([...existingTargetUsers, ...userIds])];

        await supabase
          .from("courses")
          .update({ target_users: mergedUsers } as any)
          .eq("id", courseId);
      }
    },
    onSuccess: (_, { courseIds, userIds }) => {
      queryClient.invalidateQueries({ queryKey: ["creator-courses"] });
      queryClient.invalidateQueries({ queryKey: ["courses"] });
      queryClient.invalidateQueries({ queryKey: ["enrollments"] });
      toast({
        title: "Usuarios asignados",
        description: `${userIds.length} usuario(s) asignado(s) a ${courseIds.length} curso(s).`,
      });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });
};
