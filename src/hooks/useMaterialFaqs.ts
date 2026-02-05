import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

export interface MaterialFaq {
  id: string;
  material_id: string;
  question: string;
  answer: string;
  order_index: number;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export function useMaterialFaqs(materialId?: string) {
  return useQuery({
    queryKey: ["material-faqs", materialId],
    queryFn: async () => {
      let query = supabase
        .from("material_faqs")
        .select("*")
        .order("order_index", { ascending: true });

      if (materialId) {
        query = query.eq("material_id", materialId);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as MaterialFaq[];
    },
    enabled: !!materialId,
  });
}

export function useAllFaqs() {
  return useQuery({
    queryKey: ["all-material-faqs"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("material_faqs")
        .select(`
          *,
          material:training_materials(id, title, is_published)
        `)
        .order("order_index", { ascending: true });

      if (error) throw error;
      
      // Filter to only show FAQs from published materials
      return (data as (MaterialFaq & { material: { id: string; title: string; is_published: boolean } | null })[])
        .filter(faq => faq.material?.is_published);
    },
  });
}

export function useCreateFaq() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (faq: Omit<MaterialFaq, "id" | "created_at" | "updated_at" | "created_by">) => {
      const { data, error } = await supabase
        .from("material_faqs")
        .insert({
          ...faq,
          created_by: user?.id,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["material-faqs", variables.material_id] });
      queryClient.invalidateQueries({ queryKey: ["all-material-faqs"] });
      toast({
        title: "Pregunta creada",
        description: "La pregunta frecuente se ha añadido correctamente.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "No se pudo crear la pregunta frecuente.",
        variant: "destructive",
      });
      console.error("Error creating FAQ:", error);
    },
  });
}

export function useUpdateFaq() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<MaterialFaq> & { id: string }) => {
      const { data, error } = await supabase
        .from("material_faqs")
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["material-faqs"] });
      queryClient.invalidateQueries({ queryKey: ["all-material-faqs"] });
      toast({
        title: "Pregunta actualizada",
        description: "La pregunta frecuente se ha actualizado correctamente.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "No se pudo actualizar la pregunta frecuente.",
        variant: "destructive",
      });
      console.error("Error updating FAQ:", error);
    },
  });
}

export function useDeleteFaq() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("material_faqs")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["material-faqs"] });
      queryClient.invalidateQueries({ queryKey: ["all-material-faqs"] });
      toast({
        title: "Pregunta eliminada",
        description: "La pregunta frecuente se ha eliminado correctamente.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "No se pudo eliminar la pregunta frecuente.",
        variant: "destructive",
      });
      console.error("Error deleting FAQ:", error);
    },
  });
}
