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
    }: {
      quizId: string;
      answers: Record<string, string | string[]>;
      score: number;
      passed: boolean;
      startedAt: Date;
    }) => {
      if (!user?.id) throw new Error("User not authenticated");

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
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["quiz-attempts", variables.quizId] });
      queryClient.invalidateQueries({ queryKey: ["enrollments"] });
    },
  });
};
