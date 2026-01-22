import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface MaterialProgress {
  id: string;
  user_id: string;
  material_id: string;
  completed: boolean;
  completed_at: string | null;
  created_at: string;
}

export const useMaterialProgress = (courseId: string) => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["material-progress", courseId, user?.id],
    queryFn: async () => {
      if (!user?.id) return [];

      // Get all materials for this course first
      const { data: materials, error: materialsError } = await supabase
        .from("course_materials")
        .select("id")
        .eq("course_id", courseId);

      if (materialsError) throw materialsError;
      if (!materials || materials.length === 0) return [];

      const materialIds = materials.map((m) => m.id);

      const { data, error } = await supabase
        .from("material_progress")
        .select("*")
        .eq("user_id", user.id)
        .in("material_id", materialIds);

      if (error) throw error;
      return data as MaterialProgress[];
    },
    enabled: !!user?.id && !!courseId,
  });
};

export const useMarkMaterialComplete = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ materialId, courseId }: { materialId: string; courseId: string }) => {
      if (!user?.id) throw new Error("User not authenticated");

      // Check if progress already exists
      const { data: existing } = await supabase
        .from("material_progress")
        .select("id")
        .eq("user_id", user.id)
        .eq("material_id", materialId)
        .maybeSingle();

      if (existing) {
        // Update existing
        const { data, error } = await supabase
          .from("material_progress")
          .update({
            completed: true,
            completed_at: new Date().toISOString(),
          })
          .eq("id", existing.id)
          .select()
          .single();

        if (error) throw error;
        return data;
      } else {
        // Insert new
        const { data, error } = await supabase
          .from("material_progress")
          .insert({
            user_id: user.id,
            material_id: materialId,
            completed: true,
            completed_at: new Date().toISOString(),
          })
          .select()
          .single();

        if (error) throw error;
        return data;
      }
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["material-progress", variables.courseId] });
      queryClient.invalidateQueries({ queryKey: ["enrollments"] });
    },
  });
};
