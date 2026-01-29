import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export interface LeaderHierarchy {
  id: string;
  supervisor_id: string;
  subordinate_id: string;
  assigned_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface LeaderWithProfile {
  id: string;
  supervisor_id: string;
  subordinate_id: string;
  subordinate_profile?: {
    full_name: string | null;
    email: string;
    team: string | null;
    regional: string | null;
  };
  supervisor_profile?: {
    full_name: string | null;
    email: string;
    team: string | null;
    regional: string | null;
  };
}

export const useLeaderHierarchy = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch all leaders (users with lider role)
  const { data: allLeaders, isLoading: loadingLeaders } = useQuery({
    queryKey: ["all-leaders"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("user_roles")
        .select("user_id")
        .eq("role", "lider");

      if (error) throw error;

      if (!data || data.length === 0) return [];

      const userIds = data.map((r) => r.user_id);

      const { data: profiles, error: profileError } = await supabase
        .from("profiles")
        .select("user_id, full_name, email, team, regional")
        .in("user_id", userIds);

      if (profileError) throw profileError;

      return profiles || [];
    },
  });

  // Fetch all hierarchies
  const { data: hierarchies, isLoading: loadingHierarchies } = useQuery({
    queryKey: ["leader-hierarchies"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("leader_hierarchy")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as LeaderHierarchy[];
    },
  });

  // Get subordinates for a specific supervisor
  const useSubordinates = (supervisorId: string) => {
    return useQuery({
      queryKey: ["leader-subordinates", supervisorId],
      queryFn: async () => {
        const { data, error } = await supabase
          .from("leader_hierarchy")
          .select("*")
          .eq("supervisor_id", supervisorId);

        if (error) throw error;

        if (!data || data.length === 0) return [];

        const subordinateIds = data.map((h) => h.subordinate_id);

        const { data: profiles, error: profileError } = await supabase
          .from("profiles")
          .select("user_id, full_name, email, team, regional")
          .in("user_id", subordinateIds);

        if (profileError) throw profileError;

        return data.map((h) => ({
          ...h,
          subordinate_profile: profiles?.find((p) => p.user_id === h.subordinate_id),
        }));
      },
      enabled: !!supervisorId,
    });
  };

  // Add subordinate to supervisor
  const addSubordinate = useMutation({
    mutationFn: async ({
      supervisorId,
      subordinateId,
    }: {
      supervisorId: string;
      subordinateId: string;
    }) => {
      const { data, error } = await supabase
        .from("leader_hierarchy")
        .insert({
          supervisor_id: supervisorId,
          subordinate_id: subordinateId,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["leader-hierarchies"] });
      queryClient.invalidateQueries({ queryKey: ["leader-subordinates"] });
      toast({ title: "Líder subordinado asignado correctamente" });
    },
    onError: (error: Error) => {
      if (error.message.includes("duplicate")) {
        toast({
          title: "Este líder ya está asignado como subordinado",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Error al asignar subordinado",
          description: error.message,
          variant: "destructive",
        });
      }
    },
  });

  // Remove subordinate from supervisor
  const removeSubordinate = useMutation({
    mutationFn: async (hierarchyId: string) => {
      const { error } = await supabase
        .from("leader_hierarchy")
        .delete()
        .eq("id", hierarchyId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["leader-hierarchies"] });
      queryClient.invalidateQueries({ queryKey: ["leader-subordinates"] });
      toast({ title: "Subordinado removido correctamente" });
    },
    onError: (error: Error) => {
      toast({
        title: "Error al remover subordinado",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  return {
    allLeaders,
    loadingLeaders,
    hierarchies,
    loadingHierarchies,
    useSubordinates,
    addSubordinate,
    removeSubordinate,
  };
};
