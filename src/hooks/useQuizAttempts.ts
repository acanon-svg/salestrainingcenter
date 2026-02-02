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

      console.log("[Quiz] Submitting quiz attempt:", { quizId, score, passed, courseId, coursePoints });

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

      if (error) {
        console.error("[Quiz] Error inserting attempt:", error);
        throw error;
      }

      console.log("[Quiz] Attempt inserted successfully:", data.id);

      // If passed and we have course info, update points
      if (passed && courseId && coursePoints && coursePoints > 0) {
        console.log("[Quiz] User passed! Updating points for course:", courseId);
        
        // Check if points were already awarded for this course
        const { data: enrollment, error: enrollmentError } = await supabase
          .from("course_enrollments")
          .select("id, points_earned, status")
          .eq("user_id", user.id)
          .eq("course_id", courseId)
          .maybeSingle();

        if (enrollmentError) {
          console.error("[Quiz] Error fetching enrollment:", enrollmentError);
        }

        console.log("[Quiz] Enrollment found:", enrollment);

        // Only award points if not already awarded
        if (enrollment && (!enrollment.points_earned || enrollment.points_earned === 0)) {
          console.log("[Quiz] Awarding", coursePoints, "points to enrollment:", enrollment.id);
          
          // Update enrollment with points earned and score
          const { error: updateEnrollmentError } = await supabase
            .from("course_enrollments")
            .update({
              points_earned: coursePoints,
              score: score,
              status: "completed",
              completed_at: new Date().toISOString(),
            })
            .eq("id", enrollment.id);

          if (updateEnrollmentError) {
            console.error("[Quiz] Error updating enrollment:", updateEnrollmentError);
          } else {
            console.log("[Quiz] Enrollment updated successfully");
          }

          // Get current profile points and update
          const { data: profile, error: profileFetchError } = await supabase
            .from("profiles")
            .select("points")
            .eq("user_id", user.id)
            .single();

          if (profileFetchError) {
            console.error("[Quiz] Error fetching profile:", profileFetchError);
          }

          if (profile) {
            const currentPoints = profile.points || 0;
            const newPoints = currentPoints + coursePoints;
            console.log("[Quiz] Updating profile points:", currentPoints, "->", newPoints);
            
            const { error: updateProfileError } = await supabase
              .from("profiles")
              .update({ points: newPoints })
              .eq("user_id", user.id);

            if (updateProfileError) {
              console.error("[Quiz] Error updating profile points:", updateProfileError);
            } else {
              console.log("[Quiz] Profile points updated successfully to:", newPoints);
            }
          }
        } else {
          console.log("[Quiz] Points already awarded or enrollment not found. Enrollment:", enrollment);
        }
      } else {
        console.log("[Quiz] Not awarding points. passed:", passed, "courseId:", courseId, "coursePoints:", coursePoints);
      }

      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["quiz-attempts", variables.quizId] });
      queryClient.invalidateQueries({ queryKey: ["enrollments"] });
      queryClient.invalidateQueries({ queryKey: ["ranking"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-stats"] });
      queryClient.invalidateQueries({ queryKey: ["profile"] });
      queryClient.invalidateQueries({ queryKey: ["my-badges"] });
      queryClient.invalidateQueries({ queryKey: ["badges"] });
      queryClient.invalidateQueries({ queryKey: ["user-badges-dashboard"] });
      queryClient.invalidateQueries({ queryKey: ["ranking-competitor"] });
    },
  });
};
