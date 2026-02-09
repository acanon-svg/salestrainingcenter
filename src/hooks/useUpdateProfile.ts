import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface UpdateProfileData {
  userId: string;
  company_role?: string | null;
  team?: string | null;
  regional?: string | null;
  is_guaranteed?: boolean;
}

export const useUpdateProfile = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ userId, ...updates }: UpdateProfileData) => {
      const { data, error } = await supabase
        .from("profiles")
        .update(updates)
        .eq("user_id", userId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["profiles"] });
      queryClient.invalidateQueries({ queryKey: ["regionals"] });
      toast({
        title: "Perfil actualizado",
        description: "Los datos del usuario han sido actualizados correctamente.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });
};

// Hook to get unique teams from profiles
export const useTeams = () => {
  return {
    data: [] as string[], // Will be populated from the component
    isLoading: false,
  };
};
