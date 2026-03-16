import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface SectionStat {
  section_key: string;
  section_label: string;
  total_visits: number;
  unique_users: number;
  avg_duration_seconds: number;
  total_duration_seconds: number;
}

export interface UserSectionStat {
  user_id: string;
  user_email: string;
  user_name: string;
  section_key: string;
  section_label: string;
  visits: number;
  total_duration_seconds: number;
  last_visited: string;
}

export const useSectionAnalytics = (dateRange: number = 30) => {
  return useQuery({
    queryKey: ["section-analytics", dateRange],
    queryFn: async () => {
      const since = new Date();
      since.setDate(since.getDate() - dateRange);

      const { data: visits, error } = await supabase
        .from("section_visits")
        .select("*")
        .gte("visited_at", since.toISOString())
        .order("visited_at", { ascending: false });

      if (error) throw error;

      // Aggregate by section
      const sectionMap: Record<string, SectionStat> = {};
      const userSet: Record<string, Set<string>> = {};

      (visits || []).forEach((v: any) => {
        const key = v.section_key;
        if (!sectionMap[key]) {
          sectionMap[key] = {
            section_key: key,
            section_label: v.section_label,
            total_visits: 0,
            unique_users: 0,
            avg_duration_seconds: 0,
            total_duration_seconds: 0,
          };
          userSet[key] = new Set();
        }
        sectionMap[key].total_visits++;
        sectionMap[key].total_duration_seconds += v.duration_seconds || 0;
        userSet[key].add(v.user_id);
      });

      Object.keys(sectionMap).forEach((key) => {
        sectionMap[key].unique_users = userSet[key].size;
        sectionMap[key].avg_duration_seconds =
          sectionMap[key].total_visits > 0
            ? Math.round(sectionMap[key].total_duration_seconds / sectionMap[key].total_visits)
            : 0;
      });

      const sectionStats = Object.values(sectionMap).sort((a, b) => b.total_visits - a.total_visits);

      return { sectionStats, rawVisits: visits || [] };
    },
  });
};

export const useUserSectionBreakdown = (dateRange: number = 30) => {
  return useQuery({
    queryKey: ["user-section-breakdown", dateRange],
    queryFn: async () => {
      const since = new Date();
      since.setDate(since.getDate() - dateRange);

      // Get visits
      const { data: visits, error } = await supabase
        .from("section_visits")
        .select("*")
        .gte("visited_at", since.toISOString());

      if (error) throw error;

      // Get profiles for user names
      const userIds = [...new Set((visits || []).map((v: any) => v.user_id))];
      if (userIds.length === 0) return [];

      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, email, full_name")
        .in("user_id", userIds);

      const profileMap: Record<string, { email: string; name: string }> = {};
      (profiles || []).forEach((p: any) => {
        profileMap[p.user_id] = { email: p.email, name: p.full_name || p.email };
      });

      // Aggregate per user per section
      const userSectionMap: Record<string, UserSectionStat> = {};

      (visits || []).forEach((v: any) => {
        const compositeKey = `${v.user_id}__${v.section_key}`;
        if (!userSectionMap[compositeKey]) {
          const profile = profileMap[v.user_id] || { email: "Desconocido", name: "Desconocido" };
          userSectionMap[compositeKey] = {
            user_id: v.user_id,
            user_email: profile.email,
            user_name: profile.name,
            section_key: v.section_key,
            section_label: v.section_label,
            visits: 0,
            total_duration_seconds: 0,
            last_visited: v.visited_at,
          };
        }
        userSectionMap[compositeKey].visits++;
        userSectionMap[compositeKey].total_duration_seconds += v.duration_seconds || 0;
        if (v.visited_at > userSectionMap[compositeKey].last_visited) {
          userSectionMap[compositeKey].last_visited = v.visited_at;
        }
      });

      return Object.values(userSectionMap).sort((a, b) => b.visits - a.visits);
    },
  });
};
