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
  course_link: string | null;
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

      // Filter by target_teams on the server side when user has a team
      if (profile?.team) {
        // Get announcements that either have no target_teams or include the user's team
        query = query.or(`target_teams.is.null,target_teams.cs.{"${profile.team}"}`);
      } else {
        // If user has no team, only show announcements with no target_teams
        query = query.is("target_teams", null);
      }

      const { data, error } = await query;

      if (error) throw error;

      // Double-check: filter expired announcements client-side
      return (data || []).filter((a: Announcement) => 
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
