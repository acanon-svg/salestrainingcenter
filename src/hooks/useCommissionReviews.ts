import React from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { TeamResult } from "./useTeamResults";
import { toast } from "sonner";

const db = () => supabase as any;

export interface CommissionReview {
  id: string;
  user_email: string;
  user_name: string | null;
  period_month: number;
  period_year: number;
  regional: string | null;
  firmas_real: number;
  firmas_meta: number;
  originaciones_real: number;
  originaciones_meta: number;
  gmv_real: number;
  gmv_meta: number;
  firmas_compliance: number;
  candado_met: boolean;
  originaciones_weighted: number;
  gmv_weighted: number;
  base_commission: number;
  calculated_commission: number;
  has_mb_income: boolean;
  indicator_bonus: number;
  total_commission: number;
  status: string;
  rejection_reason: string | null;
  observations: string | null;
  reviewed_by: string | null;
  reviewed_at: string | null;
  created_at: string;
  updated_at: string;
}

export const calculateCommission = (result: {
  firmas_real: number;
  firmas_meta: number;
  originaciones_real: number;
  originaciones_meta: number;
  gmv_real: number;
  gmv_meta: number;
}) => {
  const firmasCompliance =
    result.firmas_meta > 0
      ? (result.firmas_real / result.firmas_meta) * 100
      : 0;
  const candadoMet = firmasCompliance >= 85;

  const origPct =
    result.originaciones_meta > 0
      ? (result.originaciones_real / result.originaciones_meta) * 100
      : 0;
  const gmvPct =
    result.gmv_meta > 0 ? (result.gmv_real / result.gmv_meta) * 100 : 0;

  const origWeighted = origPct * 0.5;
  const gmvWeighted = gmvPct * 0.5;
  const totalPct = origWeighted + gmvWeighted;

  const baseCommission = 1500000;
  const indicatorsMet = totalPct >= 85;
  const calculatedCommission = candadoMet && indicatorsMet
    ? (totalPct / 100) * baseCommission
    : 0;

  return {
    firmasCompliance,
    candadoMet,
    indicatorsMet,
    origPct,
    gmvPct,
    origWeighted,
    gmvWeighted,
    totalPct,
    baseCommission,
    calculatedCommission,
  };
};

/** Fetch team_results for a specific month, grouped by user_email (latest entry per user). */
export const useMonthlyTeamResults = (
  month: number,
  year: number,
  regional?: string
) => {
  return useQuery({
    queryKey: ["team-results-monthly", month, year, regional],
    queryFn: async () => {
      const startDate = `${year}-${String(month).padStart(2, "0")}-01`;
      const endDate =
        month === 12
          ? `${year + 1}-01-01`
          : `${year}-${String(month + 1).padStart(2, "0")}-01`;

      let query = db()
        .from("team_results")
        .select("*")
        .gte("period_date", startDate)
        .lt("period_date", endDate);

      if (regional) query = query.eq("regional", regional);

      const { data, error } = await query;
      if (error) throw error;

      // Group by user_email, take the latest entry
      const grouped = new Map<string, any>();
      for (const row of data || []) {
        const existing = grouped.get(row.user_email);
        if (
          !existing ||
          new Date(row.period_date) > new Date(existing.period_date)
        ) {
          grouped.set(row.user_email, row);
        }
      }

      return Array.from(grouped.values()) as TeamResult[];
    },
    enabled: month > 0 && year > 0,
  });
};

/** Fetch profiles by emails for name lookup and guaranteed status. */
export const useProfilesByEmails = (emails: string[]) => {
  const sortedKey = [...emails].sort().join(",");
  return useQuery({
    queryKey: ["profiles-by-emails", sortedKey],
    queryFn: async () => {
      if (emails.length === 0) return [];
      const { data, error } = await supabase
        .from("profiles")
        .select("email, full_name, is_guaranteed, user_id, team")
        .in("email", emails);
      if (error) throw error;
      return (data || []) as { email: string; full_name: string | null; is_guaranteed: boolean; user_id: string; team: string | null }[];
    },
    enabled: emails.length > 0,
  });
};

/** Fetch commission reviews for a specific month/year/regional. */
export const useCommissionReviews = (
  month: number,
  year: number,
  regional?: string
) => {
  return useQuery({
    queryKey: ["commission-reviews", month, year, regional],
    queryFn: async () => {
      let query = db()
        .from("commission_reviews")
        .select("*")
        .eq("period_month", month)
        .eq("period_year", year);
      if (regional) query = query.eq("regional", regional);
      const { data, error } = await query;
      if (error) throw error;
      return (data || []) as CommissionReview[];
    },
    enabled: month > 0 && year > 0,
  });
};

/** Upsert a commission review (create or update by user_email+month+year). */
export const useUpsertCommissionReview = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (
      review: Partial<CommissionReview> & {
        user_email: string;
        period_month: number;
        period_year: number;
      }
    ) => {
      const { data, error } = await db()
        .from("commission_reviews")
        .upsert(review, {
          onConflict: "user_email,period_month,period_year",
        })
        .select()
        .single();
      if (error) throw error;
      return data as CommissionReview;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["commission-reviews"] });
    },
    onError: (error: any) => {
      toast.error(`Error: ${error.message}`);
    },
  });
};

/** Approve a commission and notify Sebastián Taborda. */
export const useApproveCommission = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({
      id,
      observations,
    }: {
      id: string;
      observations?: string;
    }) => {
      const { error } = await db()
        .from("commission_reviews")
        .update({
          status: "approved",
          observations,
          reviewed_by: user?.id,
          reviewed_at: new Date().toISOString(),
        })
        .eq("id", id);
      if (error) throw error;

      // Try to notify Sebastián Taborda
      try {
        const { data: recipient } = await supabase
          .from("profiles")
          .select("user_id")
          .ilike("full_name", "%sebastian taborda%")
          .maybeSingle();

        if (recipient) {
          await supabase.from("notifications").insert({
            user_id: recipient.user_id,
            title: "Comisión aprobada",
            message:
              "Se ha aprobado una comisión. Revisa el reporte para descargar.",
            type: "commission_approved",
          });
        }
      } catch (e) {
        console.warn("Could not send notification:", e);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["commission-reviews"] });
      toast.success("Comisión aprobada exitosamente");
    },
    onError: (error: any) => {
      toast.error(`Error: ${error.message}`);
    },
  });
};

/** Reject a commission and notify creators. */
export const useRejectCommission = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({
      id,
      rejection_reason,
      user_name,
      user_email,
    }: {
      id: string;
      rejection_reason: string;
      user_name?: string;
      user_email?: string;
    }) => {
      const { error } = await db()
        .from("commission_reviews")
        .update({
          status: "rejected",
          rejection_reason,
          reviewed_by: user?.id,
          reviewed_at: new Date().toISOString(),
        })
        .eq("id", id);
      if (error) throw error;

      // Notify creators AND admins
      try {
        const { data: creatorsAndAdmins } = await supabase
          .from("user_roles")
          .select("user_id, role")
          .in("role", ["creator", "admin"]);

        if (creatorsAndAdmins && creatorsAndAdmins.length > 0) {
          // Deduplicate user_ids (a user may have both creator and admin roles)
          const uniqueUserIds = [...new Set(creatorsAndAdmins.map((c: any) => c.user_id))];
          const executiveName = user_name || user_email || "un ejecutivo";
          const notifications = uniqueUserIds.map((userId) => ({
            user_id: userId,
            title: "⚠️ Comisión rechazada - Requiere revisión",
            message: `La comisión de ${executiveName} ha sido rechazada. Motivo: ${rejection_reason}`,
            type: "commission_rejected",
          }));
          await supabase.from("notifications").insert(notifications);
        }
      } catch (e) {
        console.warn("Could not send notification:", e);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["commission-reviews"] });
      queryClient.invalidateQueries({ queryKey: ["rejected-commission-count"] });
      toast.success("Comisión rechazada");
    },
    onError: (error: any) => {
      toast.error(`Error: ${error.message}`);
    },
  });
};

/** Fetch all approved commissions, optionally filtered by month/year. */
export const useApprovedCommissions = (month?: number, year?: number) => {
  return useQuery({
    queryKey: ["approved-commissions", month, year],
    queryFn: async () => {
      let query = db()
        .from("commission_reviews")
        .select("*")
        .eq("status", "approved");
      if (month) query = query.eq("period_month", month);
      if (year) query = query.eq("period_year", year);
      query = query.order("regional").order("user_email");
      const { data, error } = await query;
      if (error) throw error;
      return (data || []) as CommissionReview[];
    },
  });
};

/** Fetch pending commissions for a specific month/year, with realtime refresh. */
export const usePendingCommissions = (month?: number, year?: number) => {
  const queryClient = useQueryClient();

  React.useEffect(() => {
    const channel = supabase
      .channel("pending-commissions-realtime")
      .on(
        "postgres_changes" as any,
        { event: "*", schema: "public", table: "commission_reviews" },
        () => {
          queryClient.invalidateQueries({ queryKey: ["pending-commissions", month, year] });
          queryClient.invalidateQueries({ queryKey: ["not-approved-commissions", month, year] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [month, year, queryClient]);

  return useQuery({
    queryKey: ["pending-commissions", month, year],
    queryFn: async () => {
      let query = db()
        .from("commission_reviews")
        .select("*")
        .eq("status", "pending");
      if (month) query = query.eq("period_month", month);
      if (year) query = query.eq("period_year", year);
      query = query.order("regional").order("user_email");
      const { data, error } = await query;
      if (error) throw error;
      return (data || []) as CommissionReview[];
    },
  });
};

/** Fetch all non-approved commissions (pending + rejected) for a specific month/year, with realtime refresh. */
export const useNotApprovedCommissions = (month?: number, year?: number) => {
  const queryClient = useQueryClient();

  React.useEffect(() => {
    const channel = supabase
      .channel("not-approved-commissions-realtime")
      .on(
        "postgres_changes" as any,
        { event: "*", schema: "public", table: "commission_reviews" },
        () => {
          queryClient.invalidateQueries({ queryKey: ["not-approved-commissions", month, year] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [month, year, queryClient]);

  return useQuery({
    queryKey: ["not-approved-commissions", month, year],
    queryFn: async () => {
      let query = db()
        .from("commission_reviews")
        .select("*")
        .in("status", ["pending", "rejected"]);
      if (month) query = query.eq("period_month", month);
      if (year) query = query.eq("period_year", year);
      query = query.order("status").order("regional").order("user_email");
      const { data, error } = await query;
      if (error) throw error;
      return (data || []) as CommissionReview[];
    },
  });
};

/** Count rejected commissions for creator badge (similar to useUnreadCourseFeedbackCount). */
export const useRejectedCommissionCount = () => {
  const { user, hasRole } = useAuth();
  const isCreatorOrAdmin = hasRole("creator") || hasRole("admin");

  return useQuery({
    queryKey: ["rejected-commission-count", user?.id],
    queryFn: async () => {
      const { count, error } = await db()
        .from("commission_reviews")
        .select("*", { count: "exact", head: true })
        .eq("status", "rejected");

      if (error) throw error;
      return count || 0;
    },
    enabled: !!user?.id && isCreatorOrAdmin,
    refetchInterval: 30000,
  });
};
