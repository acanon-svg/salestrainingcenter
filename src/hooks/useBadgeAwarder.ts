import { useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";

interface Badge {
  id: string;
  name: string;
  icon_emoji: string | null;
  criteria_type: string;
  criteria_value: number | null;
  points_reward: number;
}

export const useBadgeAwarder = () => {
  const { user, refreshProfile } = useAuth();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const checkAndAwardBadges = useCallback(async () => {
    if (!user?.id) {
      console.log("[BadgeAwarder] No user ID, skipping badge check");
      return;
    }

    console.log("[BadgeAwarder] Starting badge check for user:", user.id);

    try {
      // Fetch all badges
      const { data: allBadges, error: badgesError } = await supabase
        .from("badges")
        .select("id, name, icon_emoji, criteria_type, criteria_value, points_reward");

      if (badgesError) {
        console.error("[BadgeAwarder] Error fetching badges:", badgesError);
        return;
      }

      console.log("[BadgeAwarder] Found", allBadges?.length || 0, "total badges");

      // Fetch user's existing badges
      const { data: userBadges, error: userBadgesError } = await supabase
        .from("user_badges")
        .select("badge_id")
        .eq("user_id", user.id);

      if (userBadgesError) {
        console.error("[BadgeAwarder] Error fetching user badges:", userBadgesError);
        return;
      }

      const earnedBadgeIds = new Set(userBadges?.map((ub) => ub.badge_id) || []);
      console.log("[BadgeAwarder] User has", earnedBadgeIds.size, "badges already");

      // Fetch user stats for badge evaluation
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("points")
        .eq("user_id", user.id)
        .single();

      if (profileError) {
        console.error("[BadgeAwarder] Error fetching profile:", profileError);
        return;
      }

      // Count completed courses - use course_enrollments with status = 'completed'
      const { data: completedEnrollments, error: coursesError } = await supabase
        .from("course_enrollments")
        .select("id")
        .eq("user_id", user.id)
        .eq("status", "completed");

      if (coursesError) {
        console.error("[BadgeAwarder] Error counting courses:", coursesError);
        return;
      }

      const completedCourses = completedEnrollments?.length || 0;
      console.log("[BadgeAwarder] User completed courses:", completedCourses);

      // Count perfect scores (100%) using quiz_attempts
      const { data: perfectAttempts, error: perfectError } = await supabase
        .from("quiz_attempts")
        .select("id")
        .eq("user_id", user.id)
        .eq("score", 100)
        .eq("passed", true);

      if (perfectError) {
        console.error("[BadgeAwarder] Error counting perfect scores:", perfectError);
        return;
      }

      const perfectScores = perfectAttempts?.length || 0;
      console.log("[BadgeAwarder] User perfect scores:", perfectScores);

      // Count feedback sent
      const { data: feedbackData, error: feedbackError } = await supabase
        .from("feedback")
        .select("id")
        .eq("sender_id", user.id);

      if (feedbackError) {
        console.error("[BadgeAwarder] Error counting feedback:", feedbackError);
        return;
      }

      const feedbackSent = feedbackData?.length || 0;

      // Count materials viewed from training_material_progress
      const { data: materialProgress, error: materialError } = await supabase
        .from("material_progress")
        .select("id")
        .eq("user_id", user.id)
        .eq("completed", true);

      const materialsViewed = materialProgress?.length || 0;

      const userStats = {
        points: profile?.points || 0,
        courses_completed: completedCourses,
        perfect_score: perfectScores,
        feedback_sent: feedbackSent,
        materials_viewed: materialsViewed,
      };

      console.log("[BadgeAwarder] User stats:", userStats);

      // Check which badges should be awarded
      const badgesToAward: Badge[] = [];
      let totalPointsToAdd = 0;

      for (const badge of (allBadges as Badge[]) || []) {
        // Skip if already earned
        if (earnedBadgeIds.has(badge.id)) {
          continue;
        }

        const criteriaValue = badge.criteria_value || 0;
        let shouldAward = false;

        switch (badge.criteria_type) {
          case "courses_completed":
            shouldAward = userStats.courses_completed >= criteriaValue;
            console.log(`[BadgeAwarder] Badge "${badge.name}" (courses_completed >= ${criteriaValue}): ${userStats.courses_completed} >= ${criteriaValue} = ${shouldAward}`);
            break;
          case "points_reached":
            shouldAward = userStats.points >= criteriaValue;
            console.log(`[BadgeAwarder] Badge "${badge.name}" (points_reached >= ${criteriaValue}): ${userStats.points} >= ${criteriaValue} = ${shouldAward}`);
            break;
          case "perfect_score":
            shouldAward = userStats.perfect_score >= criteriaValue;
            console.log(`[BadgeAwarder] Badge "${badge.name}" (perfect_score >= ${criteriaValue}): ${userStats.perfect_score} >= ${criteriaValue} = ${shouldAward}`);
            break;
          case "feedback_sent":
            shouldAward = userStats.feedback_sent >= criteriaValue;
            break;
          case "materials_viewed":
            shouldAward = userStats.materials_viewed >= criteriaValue;
            break;
        }

        if (shouldAward) {
          badgesToAward.push(badge);
          totalPointsToAdd += badge.points_reward;
        }
      }

      if (badgesToAward.length === 0) {
        console.log("[BadgeAwarder] No new badges to award");
        return;
      }

      console.log("[BadgeAwarder] Awarding badges:", badgesToAward.map((b) => b.name));

      // Insert new badges
      const { error: insertError } = await supabase.from("user_badges").insert(
        badgesToAward.map((badge) => ({
          user_id: user.id,
          badge_id: badge.id,
        }))
      );

      if (insertError) {
        console.error("[BadgeAwarder] Error inserting badges:", insertError);
        return;
      }

      // Update profile with badge count and bonus points
      const newBadgesCount = (userBadges?.length || 0) + badgesToAward.length;
      const newPoints = userStats.points + totalPointsToAdd;
      
      const { error: updateError } = await supabase
        .from("profiles")
        .update({
          badges_count: newBadgesCount,
          points: newPoints,
        })
        .eq("user_id", user.id);

      if (updateError) {
        console.error("[BadgeAwarder] Error updating profile:", updateError);
        return;
      }

      console.log(
        "[BadgeAwarder] Successfully awarded",
        badgesToAward.length,
        "badges and",
        totalPointsToAdd,
        "bonus points"
      );

      // Show toast notification for each badge earned
      for (const badge of badgesToAward) {
        toast({
          title: `🏆 ¡Nueva insignia obtenida!`,
          description: `${badge.icon_emoji || "🎖️"} ${badge.name} (+${badge.points_reward} puntos)`,
        });
      }

      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: ["my-badges"] });
      queryClient.invalidateQueries({ queryKey: ["badges"] });
      queryClient.invalidateQueries({ queryKey: ["user-badges-dashboard"] });
      queryClient.invalidateQueries({ queryKey: ["ranking"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-stats"] });
      queryClient.invalidateQueries({ queryKey: ["profile"] });

      // Refresh profile in context
      await refreshProfile();
    } catch (error) {
      console.error("[BadgeAwarder] Unexpected error:", error);
    }
  }, [user?.id, queryClient, refreshProfile, toast]);

  return { checkAndAwardBadges };
};
