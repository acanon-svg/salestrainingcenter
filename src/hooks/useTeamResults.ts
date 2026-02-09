import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export interface TeamResult {
  id: string;
  user_email: string;
  regional: string | null;
  team: string | null;
  firmas_real: number;
  firmas_meta: number;
  originaciones_real: number;
  originaciones_meta: number;
  gmv_real: number;
  gmv_meta: number;
  period_date: string;
  weeks_in_month: number;
  dias_habiles_transcurridos: number;
  dias_habiles_mes: number;
  batch_id: string | null;
  uploaded_by: string | null;
  created_at: string;
}

export interface TeamResultInsert {
  user_email: string;
  regional?: string;
  team?: string;
  firmas_real: number;
  firmas_meta: number;
  originaciones_real: number;
  originaciones_meta: number;
  gmv_real: number;
  gmv_meta: number;
  period_date: string;
  weeks_in_month: number;
  dias_habiles_transcurridos: number;
  dias_habiles_mes: number;
  batch_id?: string;
  uploaded_by?: string;
}

const db = () => supabase as any;

export const useTeamResults = (filters?: { regional?: string; email?: string }) => {
  const { profile, hasRole } = useAuth();

  return useQuery({
    queryKey: ["team-results", filters, profile?.email, profile?.regional],
    queryFn: async () => {
      let query = db().from("team_results").select("*").order("period_date", { ascending: true });

      if (filters?.regional) {
        query = query.eq("regional", filters.regional);
      }
      if (filters?.email) {
        query = query.eq("user_email", filters.email);
      }

      const { data, error } = await query;
      if (error) throw error;
      return (data || []) as TeamResult[];
    },
    enabled: !!profile,
  });
};

export const useUploadTeamResults = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (results: TeamResultInsert[]) => {
      const batch_id = crypto.randomUUID();
      const rows = results.map((r) => ({
        ...r,
        batch_id,
        uploaded_by: user?.id,
      }));

      // Upload in chunks of 500
      const chunkSize = 500;
      for (let i = 0; i < rows.length; i += chunkSize) {
        const chunk = rows.slice(i, i + chunkSize);
        const { error } = await db().from("team_results").insert(chunk);
        if (error) throw error;
      }

      return { batch_id, count: rows.length };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["team-results"] });
      toast.success(`${data.count} registros cargados exitosamente`);
    },
    onError: (error: any) => {
      toast.error(`Error al cargar: ${error.message}`);
    },
  });
};

export const useDeleteTeamResultsBatch = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (batchId: string) => {
      const { error } = await db().from("team_results").delete().eq("batch_id", batchId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["team-results"] });
      toast.success("Lote eliminado exitosamente");
    },
    onError: (error: any) => {
      toast.error(`Error al eliminar: ${error.message}`);
    },
  });
};

export const useTeamResultsBatches = () => {
  return useQuery({
    queryKey: ["team-results-batches"],
    queryFn: async () => {
      const { data, error } = await db()
        .from("team_results")
        .select("batch_id, created_at, regional")
        .order("created_at", { ascending: false });

      if (error) throw error;

      // Group by batch_id
      const batches = new Map<string, { batch_id: string; created_at: string; count: number; regionals: Set<string> }>();
      for (const row of data || []) {
        if (!row.batch_id) continue;
        if (!batches.has(row.batch_id)) {
          batches.set(row.batch_id, {
            batch_id: row.batch_id,
            created_at: row.created_at,
            count: 0,
            regionals: new Set(),
          });
        }
        const b = batches.get(row.batch_id)!;
        b.count++;
        if (row.regional) b.regionals.add(row.regional);
      }

      return Array.from(batches.values()).map((b) => ({
        ...b,
        regionals: Array.from(b.regionals),
      }));
    },
  });
};
