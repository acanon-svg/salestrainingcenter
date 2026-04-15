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

export const calculateCommission = (
  result: {
    firmas_real: number;
    firmas_meta: number;
    originaciones_real: number;
    originaciones_meta: number;
    originaciones_m1_real?: number;
    originaciones_m1_meta?: number;
    gmv_real: number;
    gmv_meta: number;
    gmv_m1_real?: number;
    gmv_m1_meta?: number;
  },
  overrides?: {
    meta_firmas?: number;
    meta_originaciones?: number;
    meta_gmv_usd?: number;
    base_comisional?: number;
    meta_originaciones_m1?: number;
    meta_gmv_m1?: number;
    month?: number;
  }
) => {
  // Use team_results metas directly (per-user from sheet)
  const metaFirmas = result.firmas_meta;
  const baseCommission = overrides?.base_comisional ?? 1500000;
  const month = overrides?.month ?? 0;

  const firmasCompliance =
    metaFirmas > 0
      ? (result.firmas_real / metaFirmas) * 100
      : 0;
  const candadoMet = firmasCompliance >= 85;

  // For March+ (month >= 3), use 4x25% weights with M0/M1
  const useM1 = month >= 3;

  // M0 metas come from team_results directly
  const metaOrig = result.originaciones_meta;
  const metaGmv = result.gmv_meta;
  // M1 metas come from team_results directly
  const metaOrigM1 = result.originaciones_m1_meta ?? 0;
  const metaGmvM1 = result.gmv_m1_meta ?? 0;
  // M1 real values from team_results
  const origM1Real = result.originaciones_m1_real ?? 0;
  const gmvM1Real = result.gmv_m1_real ?? 0;

  let origPct: number;
  let gmvPct: number;
  let origWeighted: number;
  let gmvWeighted: number;
  let origM1Pct = 0;
  let gmvM1Pct = 0;
  let origM1Weighted = 0;
  let gmvM1Weighted = 0;

  if (useM1 && (metaOrigM1 > 0 || metaGmvM1 > 0)) {
    // M0: 25% each
    origPct = metaOrig > 0 ? (result.originaciones_real / metaOrig) * 100 : 0;
    origWeighted = origPct * 0.25;
    origM1Pct = metaOrigM1 > 0 ? (origM1Real / metaOrigM1) * 100 : 0;
    origM1Weighted = origM1Pct * 0.25;

    gmvPct = metaGmv > 0 ? (result.gmv_real / metaGmv) * 100 : 0;
    gmvWeighted = gmvPct * 0.25;
    gmvM1Pct = metaGmvM1 > 0 ? (gmvM1Real / metaGmvM1) * 100 : 0;
    gmvM1Weighted = gmvM1Pct * 0.25;
  } else {
    // Jan/Feb or guaranteed users without M1: 50% each
    origPct = metaOrig > 0 ? (result.originaciones_real / metaOrig) * 100 : 0;
    gmvPct = metaGmv > 0 ? (result.gmv_real / metaGmv) * 100 : 0;
    origWeighted = origPct * 0.5;
    gmvWeighted = gmvPct * 0.5;
  }

  const totalPct = origWeighted + gmvWeighted + origM1Weighted + gmvM1Weighted;

  const calculatedCommission = candadoMet
    ? (totalPct / 100) * baseCommission
    : 0;

  return {
    firmasCompliance,
    candadoMet,
    origPct,
    gmvPct,
    origWeighted,
    gmvWeighted,
    origM1Pct,
    gmvM1Pct,
    origM1Weighted,
    gmvM1Weighted,
    totalPct,
    baseCommission,
    calculatedCommission,
    useM1,
    // Return effective metas for display
    effectiveFirmasMeta: metaFirmas,
    effectiveOrigMeta: metaOrig,
    effectiveGmvMeta: metaGmv,
    effectiveOrigM1Meta: metaOrigM1,
    effectiveGmvM1Meta: metaGmvM1,
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

/** Fetch all non-approved commissions (pending + rejected + not yet sent) for a specific month/year, with realtime refresh. */
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
      if (!month || !year) return [];

      // 1. Fetch existing non-approved commission reviews
      const { data: reviews, error: revError } = await db()
        .from("commission_reviews")
        .select("*")
        .in("status", ["pending", "rejected"])
        .eq("period_month", month)
        .eq("period_year", year)
        .order("status")
        .order("regional")
        .order("user_email");
      if (revError) throw revError;
      const existingReviews = (reviews || []) as CommissionReview[];

      // 2. Fetch ALL commission reviews (any status) to know who already has one
      const { data: allReviews, error: allRevError } = await db()
        .from("commission_reviews")
        .select("user_email")
        .eq("period_month", month)
        .eq("period_year", year);
      if (allRevError) throw allRevError;
      const reviewedEmails = new Set((allReviews || []).map((r: any) => r.user_email));

      // 3. Fetch team_results for the period
      const startDate = `${year}-${String(month).padStart(2, "0")}-01`;
      const endDate = month === 12 ? `${year + 1}-01-01` : `${year}-${String(month + 1).padStart(2, "0")}-01`;
      const { data: results, error: resError } = await db()
        .from("team_results")
        .select("*")
        .gte("period_date", startDate)
        .lt("period_date", endDate);
      if (resError) throw resError;

      // Group by user_email, take latest
      const grouped = new Map<string, any>();
      for (const row of results || []) {
        const existing = grouped.get(row.user_email);
        if (!existing || new Date(row.period_date) > new Date(existing.period_date)) {
          grouped.set(row.user_email, row);
        }
      }

      // 4. Fetch profile names for missing users
      const missingEmails = Array.from(grouped.keys()).filter(e => !reviewedEmails.has(e));
      let profileMap = new Map<string, string>();
      if (missingEmails.length > 0) {
        const { data: profiles } = await supabase
          .from("profiles")
          .select("email, full_name")
          .in("email", missingEmails);
        for (const p of profiles || []) {
          if (p.full_name) profileMap.set(p.email, p.full_name);
        }
      }

      // 5. Fetch commission configs and monthly configs for meta overrides
      const { data: configs } = await supabase
        .from("commission_calculator_configs")
        .select("*");
      
      let monthlyConfigMap = new Map<string, any>();
      if (configs && configs.length > 0) {
        const configIds = configs.map((c: any) => c.id);
        const { data: monthlyConfigs } = await supabase
          .from("commission_monthly_configs")
          .select("*")
          .in("config_id", configIds)
          .eq("month", month)
          .eq("year", year);
        for (const mc of monthlyConfigs || []) {
          monthlyConfigMap.set(mc.config_id, mc);
        }
      }

      // Fetch profiles with team info for config matching
      let profileTeamMap = new Map<string, { user_id: string; team: string | null }>();
      if (missingEmails.length > 0) {
        const { data: profilesWithTeam } = await supabase
          .from("profiles")
          .select("email, user_id, team")
          .in("email", missingEmails);
        for (const p of profilesWithTeam || []) {
          profileTeamMap.set(p.email, { user_id: p.user_id, team: p.team });
        }
      }

      // Helper to find config for user
      const findConfig = (email: string) => {
        if (!configs || configs.length === 0) return null;
        const pInfo = profileTeamMap.get(email);
        if (pInfo?.user_id) {
          const userConfig = configs.find((c: any) => c.target_users && c.target_users.includes(pInfo.user_id));
          if (userConfig) return userConfig;
        }
        if (pInfo?.team) {
          const teamConfig = configs.find((c: any) => c.target_teams && c.target_teams.includes(pInfo.team));
          if (teamConfig) return teamConfig;
        }
        return configs.find((c: any) => c.is_default) || null;
      };

      // 6. Create synthetic "not_sent" entries for users with results but no commission review
      const syntheticEntries: CommissionReview[] = missingEmails.map(email => {
        const r = grouped.get(email)!;
        const matchedConfig = findConfig(email);
        const monthlyOverride = matchedConfig ? monthlyConfigMap.get(matchedConfig.id) : null;
        
        const overrides = monthlyOverride
          ? {
              meta_firmas: monthlyOverride.meta_firmas,
              meta_originaciones: monthlyOverride.meta_originaciones,
              meta_gmv_usd: monthlyOverride.meta_gmv_usd,
              base_comisional: monthlyOverride.base_comisional,
              meta_originaciones_m1: (monthlyOverride as any).meta_originaciones_m1 ?? 0,
              meta_gmv_m1: (monthlyOverride as any).meta_gmv_m1 ?? 0,
              month: month,
            }
          : matchedConfig
          ? {
              meta_firmas: matchedConfig.meta_firmas,
              meta_originaciones: matchedConfig.meta_originaciones,
              meta_gmv_usd: matchedConfig.meta_gmv_usd,
              base_comisional: matchedConfig.base_comisional,
              month: month,
            }
          : { month: month } as any;

        const calc = calculateCommission(r, overrides);
        return {
          id: `synthetic-${email}`,
          user_email: email,
          user_name: profileMap.get(email) || null,
          period_month: month,
          period_year: year,
          regional: r.regional || null,
          firmas_real: r.firmas_real,
          firmas_meta: calc.effectiveFirmasMeta,
          originaciones_real: r.originaciones_real,
          originaciones_meta: calc.effectiveOrigMeta,
          gmv_real: r.gmv_real,
          gmv_meta: calc.effectiveGmvMeta,
          firmas_compliance: calc.firmasCompliance,
          candado_met: calc.candadoMet,
          originaciones_weighted: calc.origWeighted,
          gmv_weighted: calc.gmvWeighted,
          base_commission: calc.baseCommission,
          calculated_commission: calc.calculatedCommission,
          has_mb_income: false,
          indicator_bonus: 0,
          total_commission: calc.calculatedCommission,
          status: "not_sent",
          rejection_reason: null,
          observations: null,
          reviewed_by: null,
          reviewed_at: null,
          created_at: "",
          updated_at: "",
        };
      });

      return [...existingReviews, ...syntheticEntries];
    },
    enabled: !!month && !!year,
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
