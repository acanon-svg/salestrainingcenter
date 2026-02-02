import { useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useQueryClient } from "@tanstack/react-query";

interface Badge {
  id: string;
  name: string;
  criteria_type: string;
  criteria_value: number | null;
  points_reward: number;
}

export const useBadgeAwarder = () => {
  const { user, refreshProfile } = useAuth();
  const queryClient = useQueryClient();

  const checkAndAwardBadges = useCallback(async () => {
    if (!user?.id) return;

    try {
      // Fetch all badges
      const { data: allBadges, error: badgesError } = await supabase
        .from("badges")
        .select("id, name, criteria_type, criteria_value, points_reward");

      if (badgesError) {
        console.error("[BadgeAwarder] Error fetching badges:", badgesError);
        return;
      }

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

      // Count completed courses
      const { count: completedCourses, error: coursesError } = await supabase
        .from("course_enrollments")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user.id)
        .eq("status", "completed");

      if (coursesError) {
        console.error("[BadgeAwarder] Error counting courses:", coursesError);
        return;
      }

      // Count perfect scores (100%)
      const { count: perfectScores, error: perfectError } = await supabase
        .from("quiz_attempts")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user.id)
        .eq("score", 100)
        .eq("passed", true);

      if (perfectError) {
        console.error("[BadgeAwarder] Error counting perfect scores:", perfectError);
        return;
      }

      // Count feedback sent
      const { count: feedbackSent, error: feedbackError } = await supabase
        .from("feedback")
        .select("*", { count: "exact", head: true })
        .eq("sender_id", user.id);

      if (feedbackError) {
        console.error("[BadgeAwarder] Error counting feedback:", feedbackError);
        return;
      }

      // Count materials viewed - using training_material_progress or similar
      // For now, assume 0 since we don't have this tracking
      const materialsViewed = 0;

      const userStats = {
        points: profile?.points || 0,
        courses_completed: completedCourses || 0,
        perfect_score: perfectScores || 0,
        feedback_sent: feedbackSent || 0,
        materials_viewed: materialsViewed,
      };

      console.log("[BadgeAwarder] User stats:", userStats);

      // Check which badges should be awarded
      const badgesToAward: Badge[] = [];
      let totalPointsToAdd = 0;

      for (const badge of (allBadges as Badge[]) || []) {
        // Skip if already earned
        if (earnedBadgeIds.has(badge.id)) continue;

        const criteriaValue = badge.criteria_value || 0;
        let shouldAward = false;

        switch (badge.criteria_type) {
          case "courses_completed":
            shouldAward = userStats.courses_completed >= criteriaValue;
            break;
          case "points_reached":
            shouldAward = userStats.points >= criteriaValue;
            break;
          case "perfect_score":
            shouldAward = userStats.perfect_score >= criteriaValue;
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
      const { error: updateError } = await supabase
        .from("profiles")
        .update({
          badges_count: (userBadges?.length || 0) + badgesToAward.length,
          points: userStats.points + totalPointsToAdd,
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
  }, [user?.id, queryClient, refreshProfile]);

  return { checkAndAwardBadges };
};
