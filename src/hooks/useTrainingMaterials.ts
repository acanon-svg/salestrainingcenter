import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

export interface TrainingMaterial {
  id: string;
  title: string;
  description: string | null;
  type: "video" | "documento" | "link";
  content_url: string | null;
  content_text: string | null;
  target_teams: string[];
  category_id: string | null;
  is_published: boolean;
  order_index: number;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  keywords: string[];
  // Computed fields from joins
  feedback_count?: number;
  useful_count?: number;
  not_useful_count?: number;
  user_feedback?: boolean | null;
  // Tag assignments (loaded separately)
  tag_ids?: string[];
}

export interface MaterialFeedback {
  id: string;
  material_id: string;
  user_id: string;
  is_useful: boolean;
  created_at: string;
}

export function useTrainingMaterials(options?: { onlyPublished?: boolean }) {
  const { user, profile, hasRole } = useAuth();
  const isCreatorOrAdmin = hasRole("creator") || hasRole("admin");

  return useQuery({
    queryKey: ["training-materials", options?.onlyPublished, user?.id],
    queryFn: async () => {
      let query = supabase
        .from("training_materials")
        .select("*")
        .order("order_index", { ascending: true });

      // If only published, filter by published status and user's team
      if (options?.onlyPublished) {
        query = query.eq("is_published", true);
      }

      const { data, error } = await query;

      if (error) throw error;

      // Filter by team if user is a student
      let materials = (data as TrainingMaterial[]).map(m => ({
        ...m,
        keywords: m.keywords || [],
        target_teams: m.target_teams || [],
      }));
      
      if (options?.onlyPublished && profile?.team) {
        materials = materials.filter(
          (m) => m.target_teams.length === 0 || m.target_teams.includes(profile.team!)
        );
      }

      // Fetch feedback and tag assignments for each material
      if (materials.length > 0) {
        const materialIds = materials.map((m) => m.id);
        
        const [feedbackResult, tagAssignmentsResult] = await Promise.all([
          supabase
            .from("material_feedback")
            .select("*")
            .in("material_id", materialIds),
          supabase
            .from("material_tag_assignments")
            .select("*")
            .in("material_id", materialIds),
        ]);

        const feedbackData = feedbackResult.data;
        const tagAssignments = tagAssignmentsResult.data;

        // Calculate feedback stats and add tag IDs
        materials = materials.map((material) => {
          const materialFeedback = feedbackData?.filter((f) => f.material_id === material.id) || [];
          const usefulCount = materialFeedback.filter((f) => f.is_useful).length;
          const notUsefulCount = materialFeedback.filter((f) => !f.is_useful).length;
          const userFeedback = materialFeedback.find((f) => f.user_id === user?.id);
          const materialTagIds = tagAssignments?.filter((t) => t.material_id === material.id).map((t) => t.tag_id) || [];

          return {
            ...material,
            feedback_count: materialFeedback.length,
            useful_count: usefulCount,
            not_useful_count: notUsefulCount,
            user_feedback: userFeedback ? userFeedback.is_useful : null,
            tag_ids: materialTagIds,
          };
        });
      }

      return materials;
    },
    enabled: !!user,
  });
}

export function useTrainingMaterial(id: string) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["training-material", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("training_materials")
        .select("*")
        .eq("id", id)
        .maybeSingle();

      if (error) throw error;
      return data as TrainingMaterial | null;
    },
    enabled: !!user && !!id,
  });
}

export function useCreateTrainingMaterial() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (material: Omit<TrainingMaterial, "id" | "created_at" | "updated_at" | "created_by">) => {
      const { data, error } = await supabase
        .from("training_materials")
        .insert({
          ...material,
          created_by: user?.id,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["training-materials"] });
      toast({
        title: "Material creado",
        description: "El material formativo se ha creado correctamente.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "No se pudo crear el material formativo.",
        variant: "destructive",
      });
      console.error("Error creating training material:", error);
    },
  });
}

export function useUpdateTrainingMaterial() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<TrainingMaterial> & { id: string }) => {
      const { data, error } = await supabase
        .from("training_materials")
        .update(updates)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["training-materials"] });
      toast({
        title: "Material actualizado",
        description: "El material formativo se ha actualizado correctamente.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "No se pudo actualizar el material formativo.",
        variant: "destructive",
      });
      console.error("Error updating training material:", error);
    },
  });
}

export function useDeleteTrainingMaterial() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("training_materials")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["training-materials"] });
      toast({
        title: "Material eliminado",
        description: "El material formativo se ha eliminado correctamente.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "No se pudo eliminar el material formativo.",
        variant: "destructive",
      });
      console.error("Error deleting training material:", error);
    },
  });
}

export function useMaterialFeedback() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ materialId, isUseful }: { materialId: string; isUseful: boolean }) => {
      // First check if feedback exists
      const { data: existing } = await supabase
        .from("material_feedback")
        .select("*")
        .eq("material_id", materialId)
        .eq("user_id", user?.id)
        .maybeSingle();

      if (existing) {
        // If same feedback, delete it (toggle off)
        if (existing.is_useful === isUseful) {
          const { error } = await supabase
            .from("material_feedback")
            .delete()
            .eq("id", existing.id);
          if (error) throw error;
          return null;
        }
        
        // Update existing feedback
        const { data, error } = await supabase
          .from("material_feedback")
          .update({ is_useful: isUseful })
          .eq("id", existing.id)
          .select()
          .single();
        if (error) throw error;
        return data;
      }

      // Create new feedback
      const { data, error } = await supabase
        .from("material_feedback")
        .insert({
          material_id: materialId,
          user_id: user?.id,
          is_useful: isUseful,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["training-materials"] });
      toast({
        title: "Gracias por tu feedback",
        description: "Tu opinión nos ayuda a mejorar el contenido.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "No se pudo guardar tu feedback.",
        variant: "destructive",
      });
      console.error("Error saving feedback:", error);
    },
  });
}
