import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export interface TeamFeedbackForm {
  id: string;
  name: string;
  description: string | null;
  embed_url: string;
  target_teams: string[] | null;
  is_active: boolean;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export const useTeamFeedbackForms = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: forms, isLoading } = useQuery({
    queryKey: ["team-feedback-forms"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("team_feedback_forms")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as TeamFeedbackForm[];
    },
  });

  const createForm = useMutation({
    mutationFn: async (form: {
      name: string;
      description?: string | null;
      embed_url: string;
      target_teams?: string[] | null;
      is_active?: boolean;
    }) => {
      const { data, error } = await supabase
        .from("team_feedback_forms")
        .insert([form])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["team-feedback-forms"] });
      toast({ title: "Formulario creado correctamente" });
    },
    onError: (error) => {
      toast({
        title: "Error al crear formulario",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const updateForm = useMutation({
    mutationFn: async ({
      id,
      ...updates
    }: Partial<TeamFeedbackForm> & { id: string }) => {
      const { data, error } = await supabase
        .from("team_feedback_forms")
        .update(updates)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["team-feedback-forms"] });
      toast({ title: "Formulario actualizado correctamente" });
    },
    onError: (error) => {
      toast({
        title: "Error al actualizar formulario",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const deleteForm = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("team_feedback_forms")
        .delete()
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["team-feedback-forms"] });
      toast({ title: "Formulario eliminado correctamente" });
    },
    onError: (error) => {
      toast({
        title: "Error al eliminar formulario",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  return {
    forms,
    isLoading,
    createForm,
    updateForm,
    deleteForm,
  };
};
