import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

export interface MaterialCategory {
  id: string;
  name: string;
  description: string | null;
  parent_id: string | null;
  section_id: string | null;
  order_index: number;
  color: string;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  // For tree structure
  children?: MaterialCategory[];
}

export function useMaterialCategories() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["material-categories"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("material_categories")
        .select("*")
        .order("order_index", { ascending: true });

      if (error) throw error;

      // Build tree structure
      const categories = (data as any[]).map(cat => ({
        ...cat,
        section_id: cat.section_id || null,
      })) as MaterialCategory[];
      const rootCategories: MaterialCategory[] = [];
      const categoryMap = new Map<string, MaterialCategory>();

      // First pass: create map
      categories.forEach((cat) => {
        categoryMap.set(cat.id, { ...cat, children: [] });
      });

      // Second pass: build tree
      categories.forEach((cat) => {
        const category = categoryMap.get(cat.id)!;
        if (cat.parent_id) {
          const parent = categoryMap.get(cat.parent_id);
          if (parent) {
            parent.children = parent.children || [];
            parent.children.push(category);
          }
        } else {
          rootCategories.push(category);
        }
      });

      return { tree: rootCategories, flat: categories };
    },
    enabled: !!user,
  });
}

export function useCreateMaterialCategory() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (category: { name: string; description?: string; parent_id?: string; color?: string; section_id?: string }) => {
      // Get max order_index for proper ordering
      const { data: existing } = await supabase
        .from("material_categories")
        .select("order_index")
        .order("order_index", { ascending: false })
        .limit(1);

      const nextOrder = (existing?.[0]?.order_index ?? -1) + 1;

      const { data, error } = await supabase
        .from("material_categories")
        .insert({
          name: category.name,
          description: category.description || null,
          parent_id: category.parent_id || null,
          section_id: category.section_id || null,
          color: category.color || "#6366f1",
          order_index: nextOrder,
          created_by: user?.id,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["material-categories"] });
      toast({
        title: "Categoría creada",
        description: "La categoría se ha creado correctamente.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "No se pudo crear la categoría.",
        variant: "destructive",
      });
      console.error("Error creating category:", error);
    },
  });
}

export function useUpdateMaterialCategory() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id, ...updates }: { id: string; name?: string; description?: string; parent_id?: string | null; color?: string; section_id?: string | null; order_index?: number }) => {
      const { data, error } = await supabase
        .from("material_categories")
        .update(updates)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["material-categories"] });
      toast({
        title: "Categoría actualizada",
        description: "La categoría se ha actualizado correctamente.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "No se pudo actualizar la categoría.",
        variant: "destructive",
      });
      console.error("Error updating category:", error);
    },
  });
}

export function useDeleteMaterialCategory() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("material_categories")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["material-categories"] });
      queryClient.invalidateQueries({ queryKey: ["training-materials"] });
      toast({
        title: "Categoría eliminada",
        description: "La categoría y sus subcategorías se han eliminado.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "No se pudo eliminar la categoría.",
        variant: "destructive",
      });
      console.error("Error deleting category:", error);
    },
  });
}
