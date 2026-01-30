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
  rating: number | null;
  feedback_type: string | null;
  sender_profile?: {
    full_name: string | null;
    email: string;
  };
  course?: {
    title: string;
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

        // Fetch course titles
        const courseIds = [...new Set(data?.filter(f => f.course_id).map((f) => f.course_id) || [])];
        const { data: courses } = courseIds.length > 0 
          ? await supabase.from("courses").select("id, title").in("id", courseIds)
          : { data: [] };

        return (data || []).map((feedback) => ({
          ...feedback,
          sender_profile: profiles?.find((p) => p.user_id === feedback.sender_id),
          course: courses?.find((c) => c.id === feedback.course_id),
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

// Hook to check if user has submitted feedback for a specific course
export const useCourseFeedback = (courseId: string) => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["course-feedback", courseId, user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("feedback")
        .select("*")
        .eq("course_id", courseId)
        .eq("sender_id", user?.id)
        .eq("feedback_type", "course")
        .maybeSingle();

      if (error) throw error;
      return data as Feedback | null;
    },
    enabled: !!user?.id && !!courseId,
  });
};

// Hook to get unread course feedback count for creators
export const useUnreadCourseFeedbackCount = () => {
  const { user, hasRole } = useAuth();
  const isCreatorOrAdmin = hasRole("creator") || hasRole("admin");

  return useQuery({
    queryKey: ["unread-course-feedback-count", user?.id],
    queryFn: async () => {
      const { count, error } = await supabase
        .from("feedback")
        .select("*", { count: "exact", head: true })
        .eq("feedback_type", "course")
        .eq("status", "pending");

      if (error) throw error;
      return count || 0;
    },
    enabled: !!user?.id && isCreatorOrAdmin,
    refetchInterval: 30000, // Refetch every 30 seconds
  });
};

export const useCreateFeedback = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (feedback: { 
      subject: string; 
      message: string; 
      course_id?: string;
      rating?: number;
      feedback_type?: string;
    }) => {
      const { data, error } = await supabase
        .from("feedback")
        .insert({
          subject: feedback.subject,
          message: feedback.message,
          course_id: feedback.course_id || null,
          sender_id: user?.id,
          status: "pending",
          rating: feedback.rating || null,
          feedback_type: feedback.feedback_type || "general",
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["feedback"] });
      queryClient.invalidateQueries({ queryKey: ["course-feedback"] });
      queryClient.invalidateQueries({ queryKey: ["unread-course-feedback-count"] });
      
      if (variables.feedback_type === "course") {
        toast({
          title: "¡Feedback enviado!",
          description: "Gracias por calificar el curso. Tu opinión es muy valiosa.",
        });
      } else {
        toast({
          title: "¡Feedback enviado!",
          description: "Gracias por tu sugerencia. Te notificaremos cuando sea revisada.",
        });
      }
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

// Hook to submit course feedback specifically
export const useSubmitCourseFeedback = () => {
  const createFeedback = useCreateFeedback();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: { 
      courseId: string;
      courseTitle: string;
      rating: number; 
      message: string;
    }) => {
      return createFeedback.mutateAsync({
        subject: `Feedback del curso: ${data.courseTitle}`,
        message: data.message || "Sin comentarios adicionales",
        course_id: data.courseId,
        rating: data.rating,
        feedback_type: "course",
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["course-feedback"] });
      queryClient.invalidateQueries({ queryKey: ["unread-course-feedback-count"] });
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
      queryClient.invalidateQueries({ queryKey: ["unread-course-feedback-count"] });
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
      queryClient.invalidateQueries({ queryKey: ["unread-course-feedback-count"] });
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
