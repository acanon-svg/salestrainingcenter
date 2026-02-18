import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { getSupabaseClient } from "@/lib/types";

const supabase = getSupabaseClient();

export interface CourseFolder {
  id: string;
  name: string;
  description: string | null;
  color: string;
  order_index: number;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export const useCourseFolders = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["course-folders", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("course_folders")
        .select("*")
        .order("order_index", { ascending: true })
        .order("name", { ascending: true });

      if (error) throw error;
      return (data || []) as CourseFolder[];
    },
    enabled: !!user?.id,
  });
};

export const useCreateFolder = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (folder: { name: string; description?: string; color?: string }) => {
      const { data, error } = await supabase
        .from("course_folders")
        .insert({
          name: folder.name,
          description: folder.description || null,
          color: folder.color || "#3b82f6",
          created_by: user?.id,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["course-folders"] });
      toast({ title: "Carpeta creada", description: "La carpeta se ha creado correctamente." });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });
};

export const useUpdateFolder = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id, ...updates }: { id: string; name?: string; description?: string; color?: string }) => {
      const { error } = await supabase
        .from("course_folders")
        .update(updates)
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["course-folders"] });
      toast({ title: "Carpeta actualizada" });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });
};

export const useDeleteFolder = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (folderId: string) => {
      const { error } = await supabase
        .from("course_folders")
        .delete()
        .eq("id", folderId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["course-folders"] });
      queryClient.invalidateQueries({ queryKey: ["creator-courses"] });
      toast({ title: "Carpeta eliminada", description: "Los cursos han sido desvinculados de la carpeta." });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });
};

export const useMoveCourseToFolder = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ courseId, folderId }: { courseId: string; folderId: string | null }) => {
      const { error } = await supabase
        .from("courses")
        .update({ folder_id: folderId } as any)
        .eq("id", courseId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["creator-courses"] });
      toast({ title: "Curso movido", description: "El curso se ha movido correctamente." });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });
};
