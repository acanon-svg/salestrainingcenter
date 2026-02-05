import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

export interface CategorySection {
  id: string;
  name: string;
  description: string | null;
  color: string;
  order_index: number;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export function useCategorySections() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["category-sections"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("category_sections")
        .select("*")
        .order("order_index", { ascending: true });

      if (error) throw error;
      return data as CategorySection[];
    },
    enabled: !!user,
  });
}

export function useCreateCategorySection() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (section: { name: string; description?: string; color?: string }) => {
      // Get max order_index
      const { data: existing } = await supabase
        .from("category_sections")
        .select("order_index")
        .order("order_index", { ascending: false })
        .limit(1);

      const nextOrder = (existing?.[0]?.order_index ?? -1) + 1;

      const { data, error } = await supabase
        .from("category_sections")
        .insert({
          name: section.name,
          description: section.description || null,
          color: section.color || "#6366f1",
          order_index: nextOrder,
          created_by: user?.id,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["category-sections"] });
      toast({
        title: "Sección creada",
        description: "La sección se ha creado correctamente.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "No se pudo crear la sección.",
        variant: "destructive",
      });
      console.error("Error creating section:", error);
    },
  });
}

export function useUpdateCategorySection() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id, ...updates }: { id: string; name?: string; description?: string; color?: string; order_index?: number }) => {
      const { data, error } = await supabase
        .from("category_sections")
        .update(updates)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["category-sections"] });
      toast({
        title: "Sección actualizada",
        description: "La sección se ha actualizado correctamente.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "No se pudo actualizar la sección.",
        variant: "destructive",
      });
      console.error("Error updating section:", error);
    },
  });
}

export function useDeleteCategorySection() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("category_sections")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["category-sections"] });
      queryClient.invalidateQueries({ queryKey: ["material-categories"] });
      toast({
        title: "Sección eliminada",
        description: "La sección se ha eliminado correctamente.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "No se pudo eliminar la sección.",
        variant: "destructive",
      });
      console.error("Error deleting section:", error);
    },
  });
}

export function useReorderCategorySections() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (sections: { id: string; order_index: number }[]) => {
      const updates = sections.map(({ id, order_index }) =>
        supabase
          .from("category_sections")
          .update({ order_index })
          .eq("id", id)
      );
      
      await Promise.all(updates);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["category-sections"] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "No se pudo reordenar las secciones.",
        variant: "destructive",
      });
      console.error("Error reordering sections:", error);
    },
  });
}

export function useReorderCategories() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (categories: { id: string; order_index: number }[]) => {
      const updates = categories.map(({ id, order_index }) =>
        supabase
          .from("material_categories")
          .update({ order_index })
          .eq("id", id)
      );
      
      await Promise.all(updates);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["material-categories"] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "No se pudo reordenar las categorías.",
        variant: "destructive",
      });
      console.error("Error reordering categories:", error);
    },
  });
}
