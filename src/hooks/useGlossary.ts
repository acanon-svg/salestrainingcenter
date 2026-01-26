import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

export interface GlossaryTerm {
  id: string;
  term: string;
  definition: string;
  example: string | null;
  related_terms: string[] | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export function useGlossaryTerms() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["glossary-terms"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("glossary_terms")
        .select("*")
        .order("term", { ascending: true });

      if (error) throw error;
      return data as GlossaryTerm[];
    },
    enabled: !!user,
  });
}

export function useGlossaryTermsByKeywords(keywords: string[] | null | undefined) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["glossary-terms-by-keywords", keywords],
    queryFn: async () => {
      if (!keywords || keywords.length === 0) return [];

      // Fetch all glossary terms and filter by matching keywords
      const { data, error } = await supabase
        .from("glossary_terms")
        .select("*")
        .order("term", { ascending: true });

      if (error) throw error;

      // Filter terms that match any of the keywords (case-insensitive)
      const lowerKeywords = keywords.map((k) => k.toLowerCase());
      const matchingTerms = (data as GlossaryTerm[]).filter((term) =>
        lowerKeywords.some(
          (keyword) =>
            term.term.toLowerCase() === keyword ||
            term.term.toLowerCase().includes(keyword) ||
            keyword.includes(term.term.toLowerCase())
        )
      );

      return matchingTerms;
    },
    enabled: !!user && !!keywords && keywords.length > 0,
  });
}

export function useCreateGlossaryTerm() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (term: {
      term: string;
      definition: string;
      example?: string;
      related_terms?: string[];
    }) => {
      const { data, error } = await supabase
        .from("glossary_terms")
        .insert({
          term: term.term,
          definition: term.definition,
          example: term.example || null,
          related_terms: term.related_terms || [],
          created_by: user?.id,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["glossary-terms"] });
      toast({
        title: "Término creado",
        description: "El término se ha agregado al glosario correctamente.",
      });
    },
    onError: (error: any) => {
      const isDuplicate = error.message?.includes("duplicate") || error.code === "23505";
      toast({
        title: "Error",
        description: isDuplicate
          ? "Ya existe un término con ese nombre."
          : "No se pudo crear el término.",
        variant: "destructive",
      });
      console.error("Error creating glossary term:", error);
    },
  });
}

export function useUpdateGlossaryTerm() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({
      id,
      ...updates
    }: {
      id: string;
      term?: string;
      definition?: string;
      example?: string | null;
      related_terms?: string[];
    }) => {
      const { data, error } = await supabase
        .from("glossary_terms")
        .update(updates)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["glossary-terms"] });
      toast({
        title: "Término actualizado",
        description: "El término se ha actualizado correctamente.",
      });
    },
    onError: (error: any) => {
      const isDuplicate = error.message?.includes("duplicate") || error.code === "23505";
      toast({
        title: "Error",
        description: isDuplicate
          ? "Ya existe un término con ese nombre."
          : "No se pudo actualizar el término.",
        variant: "destructive",
      });
      console.error("Error updating glossary term:", error);
    },
  });
}

export function useDeleteGlossaryTerm() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("glossary_terms")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["glossary-terms"] });
      toast({
        title: "Término eliminado",
        description: "El término se ha eliminado del glosario.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "No se pudo eliminar el término.",
        variant: "destructive",
      });
      console.error("Error deleting glossary term:", error);
    },
  });
}
