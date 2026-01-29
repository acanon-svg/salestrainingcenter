import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

export interface Feedback {
  id: string;
  subject: string;
  message: string;
  status: string;
  response: string | null;
  points_awarded: number | null;
  course_id: string | null;
  material_id: string | null;
  sender_id: string;
  recipient_id: string | null;
  created_at: string;
  responded_at: string | null;
  updated_at: string;
  sender_profile?: {
    full_name: string | null;
    email: string;
  };
}

export const useFeedback = () => {
  const { user, hasRole } = useAuth();
  const isCreatorOrAdmin = hasRole("creator") || hasRole("admin");

  return useQuery({
    queryKey: ["feedback", user?.id, isCreatorOrAdmin],
    queryFn: async () => {
      if (isCreatorOrAdmin) {
        // Creators and admins see all feedback
        const { data, error } = await supabase
          .from("feedback")
          .select("*")
          .order("created_at", { ascending: false });

        if (error) throw error;

        // Fetch sender profiles
        const senderIds = [...new Set(data?.map((f) => f.sender_id) || [])];
        const { data: profiles } = await supabase
          .from("profiles")
          .select("user_id, full_name, email")
          .in("user_id", senderIds);

        return (data || []).map((feedback) => ({
          ...feedback,
          sender_profile: profiles?.find((p) => p.user_id === feedback.sender_id),
        })) as Feedback[];
      } else {
        // Regular users see only their own feedback
        const { data, error } = await supabase
          .from("feedback")
          .select("*")
          .eq("sender_id", user?.id)
          .order("created_at", { ascending: false });

        if (error) throw error;
        return data as Feedback[];
      }
    },
    enabled: !!user?.id,
  });
};

export const useCreateFeedback = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (feedback: { subject: string; message: string; course_id?: string }) => {
      const { data, error } = await supabase
        .from("feedback")
        .insert({
          subject: feedback.subject,
          message: feedback.message,
          course_id: feedback.course_id || null,
          sender_id: user?.id,
          status: "pending",
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["feedback"] });
      toast({
        title: "¡Feedback enviado!",
        description: "Gracias por tu sugerencia. Te notificaremos cuando sea revisada.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "No se pudo enviar el feedback",
        variant: "destructive",
      });
    },
  });
};

export const useRespondToFeedback = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({
      feedbackId,
      response,
      status,
      pointsAwarded,
    }: {
      feedbackId: string;
      response: string;
      status: string;
      pointsAwarded?: number;
    }) => {
      const { data, error } = await supabase
        .from("feedback")
        .update({
          response,
          status,
          points_awarded: pointsAwarded || 0,
          responded_at: new Date().toISOString(),
        })
        .eq("id", feedbackId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["feedback"] });
      toast({
        title: "Respuesta enviada",
        description: "El feedback ha sido actualizado.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "No se pudo actualizar el feedback",
        variant: "destructive",
      });
    },
  });
};

export const useDeleteFeedback = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (feedbackId: string) => {
      const { error } = await supabase.from("feedback").delete().eq("id", feedbackId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["feedback"] });
      toast({
        title: "Feedback eliminado",
        description: "El feedback ha sido eliminado correctamente.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "No se pudo eliminar el feedback",
        variant: "destructive",
      });
    },
  });
};
