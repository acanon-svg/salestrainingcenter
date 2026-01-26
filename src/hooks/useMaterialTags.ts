import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

export interface MaterialTag {
  id: string;
  name: string;
  color: string;
  priority: number;
  created_by: string | null;
  created_at: string;
}

export interface MaterialTagAssignment {
  id: string;
  material_id: string;
  tag_id: string;
  created_at: string;
}

export function useMaterialTags() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["material-tags"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("material_tags")
        .select("*")
        .order("priority", { ascending: false })
        .order("name", { ascending: true });

      if (error) throw error;
      return data as MaterialTag[];
    },
    enabled: !!user,
  });
}

export function useCreateMaterialTag() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (tag: Omit<MaterialTag, "id" | "created_at" | "created_by">) => {
      const { data, error } = await supabase
        .from("material_tags")
        .insert({
          ...tag,
          created_by: user?.id,
        })
        .select()
        .single();

      if (error) throw error;
      return data as MaterialTag;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["material-tags"] });
      toast({
        title: "Etiqueta creada",
        description: "La etiqueta se ha creado correctamente.",
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

export function useUpdateMaterialTag() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<MaterialTag> & { id: string }) => {
      const { data, error } = await supabase
        .from("material_tags")
        .update(updates)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data as MaterialTag;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["material-tags"] });
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

export function useDeleteMaterialTag() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("material_tags")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["material-tags"] });
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

export function useMaterialTagAssignments(materialId?: string) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["material-tag-assignments", materialId],
    queryFn: async () => {
      let query = supabase.from("material_tag_assignments").select("*");
      
      if (materialId) {
        query = query.eq("material_id", materialId);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as MaterialTagAssignment[];
    },
    enabled: !!user,
  });
}

export function useAssignTagsToMaterial() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ materialId, tagIds }: { materialId: string; tagIds: string[] }) => {
      // First, remove all existing assignments
      await supabase
        .from("material_tag_assignments")
        .delete()
        .eq("material_id", materialId);

      // Then add new assignments
      if (tagIds.length > 0) {
        const { error } = await supabase
          .from("material_tag_assignments")
          .insert(
            tagIds.map((tagId) => ({
              material_id: materialId,
              tag_id: tagId,
            }))
          );

        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["material-tag-assignments"] });
      queryClient.invalidateQueries({ queryKey: ["training-materials"] });
    },
  });
}
