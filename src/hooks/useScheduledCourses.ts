import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getSupabaseClient } from "@/lib/types";
import { useAuth } from "@/contexts/AuthContext";

const client = getSupabaseClient();

// Hook to get scheduled courses (for creators/admins)
export const useScheduledCourses = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["scheduled-courses"],
    queryFn: async () => {
      const { data, error } = await client
        .from("courses")
        .select("*, process:processes(*)")
        .eq("status", "draft")
        .not("scheduled_at", "is", null)
        .order("scheduled_at", { ascending: true });

      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });
};

// Hook to publish scheduled courses that are due
export const usePublishScheduledCourses = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      // Call the database function to publish scheduled courses
      const { data, error } = await client.rpc("publish_scheduled_courses");
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: ["courses"] });
      queryClient.invalidateQueries({ queryKey: ["scheduled-courses"] });
    },
  });
};

// Hook to check and auto-publish on component mount
export const useAutoPublishScheduledCourses = () => {
  const publishMutation = usePublishScheduledCourses();
  
  // Run check on mount
  useQuery({
    queryKey: ["auto-publish-check"],
    queryFn: async () => {
      await publishMutation.mutateAsync();
      return true;
    },
    // Only run once every 5 minutes
    staleTime: 5 * 60 * 1000,
    refetchInterval: 5 * 60 * 1000,
  });
};
