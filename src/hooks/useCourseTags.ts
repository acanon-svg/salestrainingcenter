import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

export interface CourseTag {
  id: string;
  name: string;
  color: string;
  priority: number;
  created_by: string | null;
  created_at: string;
}

export interface CourseTagAssignment {
  id: string;
  course_id: string;
  tag_id: string;
  created_at: string;
}

export function useCourseTags() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["course-tags"],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("course_tags")
        .select("*")
        .order("priority", { ascending: false })
        .order("name", { ascending: true });

      if (error) throw error;
      return data as CourseTag[];
    },
    enabled: !!user,
  });
}

export function useCreateCourseTag() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (tag: Omit<CourseTag, "id" | "created_at" | "created_by">) => {
      const { data, error } = await (supabase as any)
        .from("course_tags")
        .insert({
          ...tag,
          created_by: user?.id,
        })
        .select()
        .single();

      if (error) throw error;
      return data as CourseTag;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["course-tags"] });
      toast({
        title: "Etiqueta creada",
        description: "La etiqueta de curso se ha creado correctamente.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message?.includes("duplicate") 
          ? "Ya existe una etiqueta con ese nombre." 
          : "No se pudo crear la etiqueta.",
        variant: "destructive",
      });
    },
  });
}

export function useUpdateCourseTag() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<CourseTag> & { id: string }) => {
      const { data, error } = await (supabase as any)
        .from("course_tags")
        .update(updates)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data as CourseTag;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["course-tags"] });
      toast({
        title: "Etiqueta actualizada",
        description: "La etiqueta se ha actualizado correctamente.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "No se pudo actualizar la etiqueta.",
        variant: "destructive",
      });
    },
  });
}

export function useDeleteCourseTag() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await (supabase as any)
        .from("course_tags")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["course-tags"] });
      toast({
        title: "Etiqueta eliminada",
        description: "La etiqueta se ha eliminado correctamente.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "No se pudo eliminar la etiqueta.",
        variant: "destructive",
      });
    },
  });
}

export function useCourseTagAssignments(courseId?: string) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["course-tag-assignments", courseId],
    queryFn: async () => {
      let query = (supabase as any).from("course_tag_assignments").select("*");
      
      if (courseId) {
        query = query.eq("course_id", courseId);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as CourseTagAssignment[];
    },
    enabled: !!user,
  });
}

export function useAssignTagsToCourse() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ courseId, tagIds }: { courseId: string; tagIds: string[] }) => {
      // First, remove all existing assignments
      await (supabase as any)
        .from("course_tag_assignments")
        .delete()
        .eq("course_id", courseId);

      // Then add new assignments
      if (tagIds.length > 0) {
        const { error } = await (supabase as any)
          .from("course_tag_assignments")
          .insert(
            tagIds.map((tagId) => ({
              course_id: courseId,
              tag_id: tagId,
            }))
          );

        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["course-tag-assignments"] });
      queryClient.invalidateQueries({ queryKey: ["courses"] });
      queryClient.invalidateQueries({ queryKey: ["creator-courses"] });
    },
  });
}

// Hook to get all course tags with their assignments for display
export function useCourseTagsWithAssignments() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["course-tags-with-assignments"],
    queryFn: async () => {
      // Get all tags
      const { data: tags, error: tagsError } = await (supabase as any)
        .from("course_tags")
        .select("*")
        .order("priority", { ascending: false });

      if (tagsError) throw tagsError;

      // Get all assignments
      const { data: assignments, error: assignmentsError } = await (supabase as any)
        .from("course_tag_assignments")
        .select("*");

      if (assignmentsError) throw assignmentsError;

      return {
        tags: tags as CourseTag[],
        assignments: assignments as CourseTagAssignment[],
      };
    },
    enabled: !!user,
  });
}
