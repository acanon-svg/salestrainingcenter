import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface Badge {
  id: string;
  name: string;
  description: string | null;
  icon_emoji: string | null;
  icon_url: string | null;
  criteria_type: string;
  criteria_value: number | null;
  points_reward: number;
  created_at: string;
}

export interface UserBadge {
  id: string;
  user_id: string;
  badge_id: string;
  earned_at: string;
  badge?: Badge;
}

export const useBadges = () => {
  return useQuery({
    queryKey: ["badges"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("badges")
        .select("*")
        .order("created_at", { ascending: true });

      if (error) throw error;
      return data as Badge[];
    },
  });
};

export const useMyBadges = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["my-badges", user?.id],
    queryFn: async () => {
      if (!user?.id) return [];

      const { data, error } = await supabase
        .from("user_badges")
        .select("*, badge:badges(*)")
        .eq("user_id", user.id)
        .order("earned_at", { ascending: false });

      if (error) throw error;
      return data as (UserBadge & { badge: Badge })[];
    },
    enabled: !!user?.id,
  });
};
