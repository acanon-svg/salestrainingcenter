import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Json } from "@/integrations/supabase/types";

export interface QuizAttempt {
  id: string;
  user_id: string;
  quiz_id: string;
  started_at: string;
  completed_at: string;
  score: number;
  passed: boolean;
  answers: Json;
  created_at: string;
}

export const useQuizAttempts = (quizId: string) => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["quiz-attempts", quizId, user?.id],
    queryFn: async () => {
      if (!user?.id) return [];

      const { data, error } = await supabase
        .from("quiz_attempts")
        .select("*")
        .eq("user_id", user.id)
        .eq("quiz_id", quizId)
        .order("completed_at", { ascending: false });

      if (error) throw error;
      return data as QuizAttempt[];
    },
    enabled: !!user?.id && !!quizId,
  });
};

export const useSubmitQuizAttempt = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({
      quizId,
      answers,
      score,
      passed,
      startedAt,
      courseId,
      coursePoints,
    }: {
      quizId: string;
      answers: Record<string, string | string[]>;
      score: number;
      passed: boolean;
      startedAt: Date;
      courseId?: string;
      coursePoints?: number;
    }) => {
      if (!user?.id) throw new Error("User not authenticated");

      // Insert quiz attempt
      const { data, error } = await supabase
        .from("quiz_attempts")
        .insert({
          user_id: user.id,
          quiz_id: quizId,
          answers: answers as unknown as Json,
          score,
          passed,
          started_at: startedAt.toISOString(),
          completed_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) throw error;

      // If passed and we have course info, update points
      if (passed && courseId && coursePoints && coursePoints > 0) {
        // Check if points were already awarded for this course
        const { data: enrollment } = await supabase
          .from("course_enrollments")
          .select("id, points_earned")
          .eq("user_id", user.id)
          .eq("course_id", courseId)
          .single();

        // Only award points if not already awarded
        if (enrollment && (!enrollment.points_earned || enrollment.points_earned === 0)) {
          // Update enrollment with points earned and score
          await supabase
            .from("course_enrollments")
            .update({
              points_earned: coursePoints,
              score: score,
              status: "completed",
              completed_at: new Date().toISOString(),
            })
            .eq("id", enrollment.id);

          // Get current profile points and update
          const { data: profile } = await supabase
            .from("profiles")
            .select("points")
            .eq("user_id", user.id)
            .single();

          if (profile) {
            const newPoints = (profile.points || 0) + coursePoints;
            await supabase
              .from("profiles")
              .update({ points: newPoints })
              .eq("user_id", user.id);
          }
        }
      }

      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["quiz-attempts", variables.quizId] });
      queryClient.invalidateQueries({ queryKey: ["enrollments"] });
      queryClient.invalidateQueries({ queryKey: ["ranking"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-stats"] });
      // Also invalidate profile data to reflect new points
      queryClient.invalidateQueries({ queryKey: ["profile"] });
    },
  });
};
