import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

/**
 * Returns the set of emails belonging to a leader's team:
 * - The leader's own email
 * - Emails of subordinate leaders (from leader_hierarchy)
 * Used to filter followup data so leaders only see their team.
 */
export const useLeaderTeamEmails = () => {
  const { user, profile } = useAuth();

  return useQuery({
    queryKey: ["leader-team-emails", user?.id],
    queryFn: async () => {
      if (!user?.id || !profile?.email) return new Set<string>();

      const emails = new Set<string>();
      emails.add(profile.email);

      // Get subordinate leader IDs
      const { data: hierarchy } = await supabase
        .from("leader_hierarchy")
        .select("subordinate_id")
        .eq("supervisor_id", user.id);

      if (hierarchy && hierarchy.length > 0) {
        const subIds = hierarchy.map((h) => h.subordinate_id);
        const { data: profiles } = await supabase
          .from("profiles")
          .select("email")
          .in("user_id", subIds);

        if (profiles) {
          profiles.forEach((p) => {
            if (p.email) emails.add(p.email);
          });
        }
      }

      return emails;
    },
    enabled: !!user?.id && !!profile?.email,
  });
};
