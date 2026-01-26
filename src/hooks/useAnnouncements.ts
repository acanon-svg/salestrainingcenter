import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface Announcement {
  id: string;
  title: string;
  content: string | null;
  image_url: string | null;
  video_url: string | null;
  type: string;
  target_teams: string[] | null;
  points_for_viewing: number | null;
  starts_at: string;
  expires_at: string | null;
  created_by: string | null;
  created_at: string;
}

export const useAnnouncements = () => {
  const { user, profile } = useAuth();
  const queryClient = useQueryClient();

  const { data: announcements = [], isLoading, error } = useQuery({
    queryKey: ["announcements", profile?.team],
    queryFn: async () => {
      const now = new Date().toISOString();
      
      let query = supabase
        .from("announcements")
        .select("*")
        .lte("starts_at", now)
        .order("created_at", { ascending: false });

      const { data, error } = await query;

      if (error) throw error;

      // Filter by team if user has a team and announcement targets specific teams
      const filtered = (data || []).filter((announcement: Announcement) => {
        // If no target teams, show to everyone
        if (!announcement.target_teams || announcement.target_teams.length === 0) {
          return true;
        }
        // If user has a team, check if it's in target teams
        if (profile?.team) {
          return announcement.target_teams.includes(profile.team);
        }
        // If user has no team but announcement targets specific teams, don't show
        return false;
      });

      // Filter expired announcements (RLS should handle this but double-check client-side)
      return filtered.filter((a: Announcement) => 
        !a.expires_at || new Date(a.expires_at) > new Date()
      );
    },
    enabled: !!user,
  });

  const { data: viewedAnnouncements = [] } = useQuery({
    queryKey: ["announcement-views", user?.id],
    queryFn: async () => {
      if (!user) return [];
      
      const { data, error } = await supabase
        .from("announcement_views")
        .select("announcement_id")
        .eq("user_id", user.id);

      if (error) throw error;
      return data.map(v => v.announcement_id);
    },
    enabled: !!user,
  });

  const markAsViewed = useMutation({
    mutationFn: async (announcementId: string) => {
      if (!user) throw new Error("User not authenticated");

      const { error } = await supabase
        .from("announcement_views")
        .upsert({
          user_id: user.id,
          announcement_id: announcementId,
        }, { onConflict: "user_id,announcement_id" });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["announcement-views"] });
    },
  });

  return {
    announcements,
    viewedAnnouncements,
    isLoading,
    error,
    markAsViewed,
  };
};
