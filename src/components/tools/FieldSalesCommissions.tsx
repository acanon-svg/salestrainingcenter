import React, { useState, useMemo, useEffect } from "react";
import { useQueryClient, useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  DollarSign,
  Check,
  X,
  Lock,
  LockOpen,
  Download,
  AlertCircle,
  Loader2,
  TrendingUp,
  Target,
  RotateCcw,
  Zap,
  CheckCircle,
  XCircle,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { MonthSelector } from "./MonthSelector";
import {
  useMonthlyTeamResults,
  useCommissionReviews,
  useUpsertCommissionReview,
  useApproveCommission,
  useRejectCommission,
  useProfilesByEmails,
  calculateCommission,
} from "@/hooks/useCommissionReviews";
import { useCommissionAccelerators, useAllAcceleratorsForConfigs, CommissionAccelerator } from "@/hooks/useCommissionAccelerators";
import { useAllCommissionConfigs } from "@/hooks/useCommissionCalculatorConfig";
import * as XLSX from "xlsx";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const db = () => supabase as any;

/** Find the matching config for a user based on email, team, or default */
const findConfigForUser = (
  configs: any[],
  userEmail: string,
  userId?: string,
  userTeam?: string
): any | null => {
  // Priority 1: user-specific
  if (userId) {
    const userConfig = configs.find(
      (c) => c.target_users && c.target_users.includes(userId)
    );
    if (userConfig) return userConfig;
  }
  // Priority 2: team-specific
  if (userTeam) {
    const teamConfig = configs.find(
      (c) => c.target_teams && c.target_teams.includes(userTeam)
    );
    if (teamConfig) return teamConfig;
  }
  // Priority 3: default
  return configs.find((c) => c.is_default) || null;
};

/** Calculate accelerator multiplier for an executive */
const calculateAcceleratorBonus = (
  accelerators: CommissionAccelerator[],
  firmasCompliancePct: number,
  firmasReal: number,
  totalPct: number,
  baseCommissionAmount: number
) => {
  // Accelerators require firmas compliance >= 100%
  const eligible = firmasCompliancePct >= 100;
  if (!eligible || accelerators.length === 0) {
    return { eligible, multiplier: 1, totalBonus: 0, applied: [] as { min_firmas: number; bonus_percentage: number; description: string | null; amount: number }[] };
  }

  const applied: { min_firmas: number; bonus_percentage: number; description: string | null; amount: number }[] = [];

  // Find the highest applicable accelerator
  // min_firmas is a PERCENTAGE threshold (e.g. 110 means 110% compliance of firmas)
  let bestAccelerator: CommissionAccelerator | null = null;
  accelerators.forEach((acc) => {
    if (firmasCompliancePct >= acc.min_firmas) {
      if (!bestAccelerator || acc.min_firmas > bestAccelerator.min_firmas) {
        bestAccelerator = acc;
      }
    }
  });

  let multiplier = 1;
  let totalBonus = 0;
  if (bestAccelerator) {
    const best = bestAccelerator as CommissionAccelerator;
    // bonus_percentage represents the multiplier (e.g. 120 means multiply by 1.2)
    multiplier = best.bonus_percentage / 100;
    // The bonus is the difference: (multiplier - 1) * baseCommissionAmount
    totalBonus = (multiplier - 1) * baseCommissionAmount;
    applied.push({
      min_firmas: best.min_firmas,
      bonus_percentage: best.bonus_percentage,
      description: best.description,
      amount: totalBonus,
    });
  }

  return { eligible, multiplier, totalBonus, applied };
};

const formatCOP = (value: number) =>
  new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);

export const FieldSalesCommissions: React.FC = () => {
  const { profile, hasRole } = useAuth();
  const isCreator = hasRole("creator") || hasRole("admin");
  // Creators/admins see ALL regionals; regular leaders only see their own
  const regional = isCreator ? undefined : (profile?.regional || "");

  const now = new Date();
  const [selectedMonth, setSelectedMonth] = useState(now.getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(now.getFullYear());

  const { data: teamResults, isLoading: loadingResults } =
    useMonthlyTeamResults(selectedMonth, selectedYear, regional);
  const { data: existingReviews, isLoading: loadingReviews } =
    useCommissionReviews(selectedMonth, selectedYear, regional);

  const emails = useMemo(
    () => (teamResults || []).map((r) => r.user_email),
    [teamResults]
  );
  const { data: profiles } = useProfilesByEmails(emails);

  // Fetch commission configs and accelerators for auto-calculation
  const { data: commissionConfigs } = useAllCommissionConfigs();
  const allConfigIds = useMemo(() => (commissionConfigs || []).map((c: any) => c.id), [commissionConfigs]);
  // Load accelerators for all configs at once
  const { data: allAccelerators } = useAllAcceleratorsForConfigs(allConfigIds);

  // Fetch monthly configs for all commission configs for the selected period
  const { data: allMonthlyConfigs } = useQuery({
    queryKey: ["all-monthly-configs-for-period", allConfigIds.join(","), selectedMonth, selectedYear],
    queryFn: async () => {
      if (allConfigIds.length === 0) return [];
      const { data, error } = await supabase
        .from("commission_monthly_configs")
        .select("*")
        .in("config_id", allConfigIds)
        .eq("month", selectedMonth)
        .eq("year", selectedYear);
      if (error) throw error;
      return data || [];
    },
    enabled: allConfigIds.length > 0,
  });
  const upsertReview = useUpsertCommissionReview();
  const approveCommission = useApproveCommission();
  const rejectCommission = useRejectCommission();

  // Adjustments state: { email: { hasMb, bonus } }
  const [adjustments, setAdjustments] = useState<
    Record<string, { hasMb: boolean; bonus: number }>
  >({});
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [rejectingEmail, setRejectingEmail] = useState("");
  const [rejectionReason, setRejectionReason] = useState("");
  const [processingEmail, setProcessingEmail] = useState<string | null>(null);
  const [resetDialogOpen, setResetDialogOpen] = useState(false);
  const [resetting, setResetting] = useState(false);
  const queryClient = useQueryClient();

  // Sync existing reviews into adjustments
  useEffect(() => {
    if (!existingReviews) return;
    const initial: Record<string, { hasMb: boolean; bonus: number }> = {};
    existingReviews.forEach((r) => {
      initial[r.user_email] = {
        hasMb: r.has_mb_income,
        bonus: r.indicator_bonus,
      };
    });
    setAdjustments((prev) => ({ ...initial, ...prev }));
  }, [existingReviews]);

  const nameMap = useMemo(() => {
    const map = new Map<string, string>();
    profiles?.forEach((p) => {
      if (p.full_name) map.set(p.email, p.full_name);
    });
    return map;
  }, [profiles]);

  // Guaranteed status determined by firmas_meta === 20 (no need for profile flag)

  // Map email -> { user_id, team } for config matching
  const profileInfoMap = useMemo(() => {
    const map = new Map<string, { user_id: string; team: string | null }>();
    profiles?.forEach((p) => {
      map.set(p.email, { user_id: p.user_id, team: p.team });
    });
    return map;
  }, [profiles]);

  // Compute commission data per executive
  const executiveData = useMemo(() => {
    if (!teamResults) return [];
    return teamResults.map((result) => {
      // Find matching config and accelerators for this executive
      const pInfo = profileInfoMap.get(result.user_email);
      const matchedConfig = commissionConfigs && commissionConfigs.length > 0
        ? findConfigForUser(commissionConfigs, result.user_email, pInfo?.user_id, pInfo?.team)
        : null;

      // Find monthly config override for this config + selected month/year
      const monthlyOverride = matchedConfig && allMonthlyConfigs
        ? allMonthlyConfigs.find((mc: any) => mc.config_id === matchedConfig.id)
        : null;

      // Build meta overrides: monthly config > base config > team_results
      const overrides = monthlyOverride
        ? {
            meta_firmas: monthlyOverride.meta_firmas,
            meta_originaciones: monthlyOverride.meta_originaciones,
            meta_gmv_usd: monthlyOverride.meta_gmv_usd,
            base_comisional: monthlyOverride.base_comisional,
            meta_originaciones_m1: (monthlyOverride as any).meta_originaciones_m1 ?? 0,
            meta_gmv_m1: (monthlyOverride as any).meta_gmv_m1 ?? 0,
            month: selectedMonth,
          }
        : matchedConfig
        ? {
            meta_firmas: matchedConfig.meta_firmas,
            meta_originaciones: matchedConfig.meta_originaciones,
            meta_gmv_usd: matchedConfig.meta_gmv_usd,
            base_comisional: matchedConfig.base_comisional,
            month: selectedMonth,
          }
        : { month: selectedMonth };

      const calc = calculateCommission(result, overrides);
      const review = existingReviews?.find(
        (r) => r.user_email === result.user_email
      );
      const adj = adjustments[result.user_email] || {
        hasMb: false,
        bonus: 0,
      };
      let totalCommission = calc.calculatedCommission;
      if (adj.hasMb) totalCommission *= 1.2;
      totalCommission += adj.bonus;

      return {
        ...result,
        ...calc,
        name: nameMap.get(result.user_email) || result.user_email,
        hasMb: adj.hasMb,
        bonus: adj.bonus,
        totalCommission,
        review,
      };
    });
  }, [teamResults, existingReviews, adjustments, nameMap, profileInfoMap, commissionConfigs, allAccelerators, allMonthlyConfigs]);

  const buildReviewPayload = (exec: (typeof executiveData)[0]) => {
    // Rebuild overrides for this exec
    const pInfo = profileInfoMap.get(exec.user_email);
    const matchedConfig = commissionConfigs && commissionConfigs.length > 0
      ? findConfigForUser(commissionConfigs, exec.user_email, pInfo?.user_id, pInfo?.team)
      : null;
    const monthlyOverride = matchedConfig && allMonthlyConfigs
      ? allMonthlyConfigs.find((mc: any) => mc.config_id === matchedConfig.id)
      : null;
    const overrides = monthlyOverride
      ? {
          meta_firmas: monthlyOverride.meta_firmas,
          meta_originaciones: monthlyOverride.meta_originaciones,
          meta_gmv_usd: monthlyOverride.meta_gmv_usd,
          base_comisional: monthlyOverride.base_comisional,
          meta_originaciones_m1: (monthlyOverride as any).meta_originaciones_m1 ?? 0,
          meta_gmv_m1: (monthlyOverride as any).meta_gmv_m1 ?? 0,
          month: selectedMonth,
        }
      : matchedConfig
      ? {
          meta_firmas: matchedConfig.meta_firmas,
          meta_originaciones: matchedConfig.meta_originaciones,
          meta_gmv_usd: matchedConfig.meta_gmv_usd,
          base_comisional: matchedConfig.base_comisional,
          month: selectedMonth,
        }
      : { month: selectedMonth };

    const calc = calculateCommission(exec, overrides);
    const adj = adjustments[exec.user_email] || { hasMb: false, bonus: 0 };
    
    let total = calc.calculatedCommission;
    if (adj.hasMb) total *= 1.2;
    total += adj.bonus;

    return {
      user_email: exec.user_email,
      user_name: exec.name,
      period_month: selectedMonth,
      period_year: selectedYear,
      regional: exec.regional,
      firmas_real: exec.firmas_real,
      firmas_meta: calc.effectiveFirmasMeta,
      originaciones_real: exec.originaciones_real,
      originaciones_meta: calc.effectiveOrigMeta,
      gmv_real: exec.gmv_real,
      gmv_meta: calc.effectiveGmvMeta,
      firmas_compliance: calc.firmasCompliance,
      candado_met: calc.isGuaranteed ? true : calc.candadoMet,
      originaciones_weighted: calc.origWeighted,
      gmv_weighted: calc.gmvWeighted,
      base_commission: calc.baseCommission,
      calculated_commission: calc.calculatedCommission,
      has_mb_income: adj.hasMb,
      indicator_bonus: adj.bonus,
      total_commission: total,
    };
  };

  const handleApprove = async (exec: (typeof executiveData)[0]) => {
    setProcessingEmail(exec.user_email);
    try {
      const payload = buildReviewPayload(exec);
      const result = await upsertReview.mutateAsync({
        ...payload,
        status: "approved",
      });
      if (result?.id) {
        await approveCommission.mutateAsync({ id: result.id });
      }
    } finally {
      setProcessingEmail(null);
    }
  };

  const handleOpenReject = (email: string) => {
    setRejectingEmail(email);
    setRejectionReason("");
    setRejectDialogOpen(true);
  };

  const handleReject = async () => {
    const exec = executiveData.find((e) => e.user_email === rejectingEmail);
    if (!exec) return;
    setProcessingEmail(exec.user_email);
    try {
      const payload = buildReviewPayload(exec);
      const result = await upsertReview.mutateAsync({
        ...payload,
        status: "rejected",
        rejection_reason: rejectionReason,
      });
      if (result?.id) {
        await rejectCommission.mutateAsync({
          id: result.id,
          rejection_reason: rejectionReason,
          user_name: exec.name,
          user_email: exec.user_email,
        });
      }
      setRejectDialogOpen(false);
    } finally {
      setProcessingEmail(null);
    }
  };

  const handleDownloadExcel = () => {
    const approved = executiveData.filter(
      (e) => e.review?.status === "approved"
    );
    if (approved.length === 0) return;

    const rows = approved.map((exec) => ({
      Nombre: exec.name,
      Correo: exec.user_email,
      "Firmas Real": exec.firmas_real,
      "Firmas Meta": exec.firmas_meta,
      "% Firmas": `${exec.firmasCompliance.toFixed(1)}%`,
      Candado: exec.candadoMet ? "Cumplido" : "No cumplido",
      "Originaciones Real": exec.originaciones_real,
      "Originaciones Meta": exec.originaciones_meta,
      "% Originaciones": `${exec.origPct.toFixed(1)}%`,
      "GMV Real": exec.gmv_real,
      "GMV Meta": exec.gmv_meta,
      "% GMV": `${exec.gmvPct.toFixed(1)}%`,
      "Indicadores Combinados": `${exec.totalPct.toFixed(1)}%`,
      "Candado Firmas ≥85%": exec.candadoMet ? "Cumplido" : "No cumplido",
      "Comisión Calculada (COP)": exec.calculatedCommission,
      "Acelerador (Multiplicador)": exec.acceleratorMultiplier > 1 ? `x${exec.acceleratorMultiplier}` : "N/A",
      "MB Income (+20%)": exec.hasMb ? "Sí" : "No",
      "Bonus Indicador (COP)": exec.bonus,
      "Total Comisión (COP)": exec.totalCommission,
      Observaciones: exec.review?.observations || "",
    }));

    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Comisiones");
    XLSX.writeFile(
      wb,
      `comisiones_field_sales_${selectedMonth}_${selectedYear}.xlsx`
    );
  };

  const handleResetCommissions = async () => {
    setResetting(true);
    try {
      const { error } = await db()
        .from("commission_reviews")
        .delete()
        .eq("period_month", selectedMonth)
        .eq("period_year", selectedYear);

      if (error) throw error;

      queryClient.invalidateQueries({ queryKey: ["commission-reviews"] });
      queryClient.invalidateQueries({ queryKey: ["approved-commissions"] });
      queryClient.invalidateQueries({ queryKey: ["rejected-commission-count"] });
      setAdjustments({});
      toast.success(`Comisiones de ${selectedMonth}/${selectedYear} reiniciadas correctamente`);
      setResetDialogOpen(false);
    } catch (err: any) {
      toast.error(`Error al reiniciar: ${err.message}`);
    } finally {
      setResetting(false);
    }
  };

  const handleResetIndividual = async (exec: (typeof executiveData)[0]) => {
    if (!exec.review?.id) return;
    setProcessingEmail(exec.user_email);
    try {
      const { error } = await db()
        .from("commission_reviews")
        .delete()
        .eq("id", exec.review.id);

      if (error) throw error;

      // Clear local adjustment for this user
      setAdjustments((prev) => {
        const next = { ...prev };
        delete next[exec.user_email];
        return next;
      });

      queryClient.invalidateQueries({ queryKey: ["commission-reviews"] });
      queryClient.invalidateQueries({ queryKey: ["approved-commissions"] });
      queryClient.invalidateQueries({ queryKey: ["rejected-commission-count"] });
      toast.success(`Comisión de ${exec.name} reiniciada`);
    } catch (err: any) {
      toast.error(`Error al reiniciar: ${err.message}`);
    } finally {
      setProcessingEmail(null);
    }
  };

  const updateAdj = (
    email: string,
    field: "hasMb" | "bonus",
    value: boolean | number
  ) => {
    setAdjustments((prev) => ({
      ...prev,
      [email]: { ...(prev[email] || { hasMb: false, bonus: 0 }), [field]: value },
    }));
  };

  const isLoading = loadingResults || loadingReviews;
  const approvedCount = executiveData.filter(
    (e) => e.review?.status === "approved"
  ).length;
  const totalCommissionSum = executiveData.reduce(
    (s, e) => s + e.totalCommission,
    0
  );

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-16 w-full" />
        <Skeleton className="h-[400px] w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Month Selector */}
      <MonthSelector
        selectedMonth={selectedMonth}
        selectedYear={selectedYear}
        onMonthChange={setSelectedMonth}
        onYearChange={setSelectedYear}
      />

      {/* Reset button for creators and leaders */}
      <div className="flex justify-end">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setResetDialogOpen(true)}
          className="text-destructive hover:bg-destructive/10 border-destructive/30"
        >
          <RotateCcw className="h-4 w-4 mr-1" />
          Reiniciar Comisiones
        </Button>
      </div>

      {/* Summary */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="pt-4 text-center">
            <p className="text-xs text-muted-foreground">Ejecutivos</p>
            <p className="text-2xl font-bold">{executiveData.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 text-center">
            <p className="text-xs text-muted-foreground">
              Comisión Total Equipo
            </p>
            <p className="text-2xl font-bold text-primary">
              {formatCOP(totalCommissionSum)}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 text-center">
            <p className="text-xs text-muted-foreground">Aprobadas</p>
            <p className="text-2xl font-bold text-emerald-600">
              {approvedCount} / {executiveData.length}
            </p>
          </CardContent>
        </Card>
      </div>

      {executiveData.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <AlertCircle className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">
              No hay resultados cargados para este período y regional.
            </p>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Executive Cards */}
          {executiveData.map((exec) => {
            const status = exec.review?.status || "pending";
            const isProcessing = processingEmail === exec.user_email;

            return (
              <Card
                key={exec.user_email}
                className={cn(
                  "transition-all",
                  status === "approved" && "border-emerald-500/50 bg-emerald-500/5",
                  status === "rejected" && "border-destructive/50 bg-destructive/5"
                )}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between flex-wrap gap-2">
                    <div>
                      <CardTitle className="text-lg flex items-center gap-2">
                        {exec.name}
                        {exec.isGuaranteed && (
                          <Badge variant="outline" className="text-xs border-amber-500 text-amber-600 bg-amber-50">
                            🛡️ Garantizado
                          </Badge>
                        )}
                      </CardTitle>
                      <CardDescription>{exec.user_email}</CardDescription>
                    </div>
                    <Badge
                      variant={
                        status === "approved"
                          ? "default"
                          : status === "rejected"
                          ? "destructive"
                          : "secondary"
                      }
                    >
                      {status === "approved"
                        ? "✅ Aprobada"
                        : status === "rejected"
                        ? "❌ Rechazada"
                        : "⏳ Pendiente"}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Indicators */}
                  <div className="grid gap-3 sm:grid-cols-3">
                    {/* Firmas */}
                    <div
                      className={cn(
                        "p-3 rounded-lg border",
                        exec.candadoMet
                          ? "bg-emerald-500/10 border-emerald-500/30"
                          : "bg-destructive/10 border-destructive/30"
                      )}
                    >
                      <div className="flex items-center gap-1.5 mb-1">
                        {exec.candadoMet ? (
                          <LockOpen className="h-4 w-4 text-emerald-600" />
                        ) : (
                          <Lock className="h-4 w-4 text-destructive" />
                        )}
                        <span className="text-xs font-semibold">Firmas (Candado)</span>
                      </div>
                      <p className="text-lg font-bold">
                        {exec.firmas_real} / {exec.effectiveFirmasMeta}
                      </p>
                      <p
                        className={cn(
                          "text-sm font-medium",
                          exec.candadoMet ? "text-emerald-600" : "text-destructive"
                        )}
                      >
                        {exec.firmasCompliance.toFixed(1)}%
                        {!exec.candadoMet && " (mín. 85%)"}
                      </p>
                    </div>

                    {/* Originaciones */}
                    <div className="p-3 rounded-lg border bg-muted/30">
                      <div className="flex items-center gap-1.5 mb-1">
                        <Target className="h-4 w-4 text-primary" />
                        <span className="text-xs font-semibold">
                          Originaciones {exec.useM1 ? 'M0 (25%)' : '(50%)'}
                        </span>
                      </div>
                      <p className="text-lg font-bold">
                        {exec.originaciones_real.toLocaleString("es-CO")} /{" "}
                        {exec.effectiveOrigMeta.toLocaleString("es-CO")}
                      </p>
                      <p className="text-sm text-primary font-medium">
                        {exec.origPct.toFixed(1)}% → {exec.origWeighted.toFixed(2)}%
                      </p>
                    </div>

                    {/* Originaciones M1 (March+) */}
                    {exec.useM1 && (
                      <div className="p-3 rounded-lg border bg-muted/30">
                        <div className="flex items-center gap-1.5 mb-1">
                          <Target className="h-4 w-4 text-primary" />
                          <span className="text-xs font-semibold">Originaciones M1 (25%)</span>
                        </div>
                        <p className="text-lg font-bold">
                          {(exec.originaciones_m1_real ?? 0).toLocaleString("es-CO")} /{" "}
                          {(exec.effectiveOrigM1Meta ?? 0).toLocaleString("es-CO")}
                        </p>
                        <p className="text-sm text-primary font-medium">
                          {(exec.origM1Pct ?? 0).toFixed(1)}% → {(exec.origM1Weighted ?? 0).toFixed(2)}%
                        </p>
                      </div>
                    )}

                    {/* GMV */}
                    <div className="p-3 rounded-lg border bg-muted/30">
                      <div className="flex items-center gap-1.5 mb-1">
                        <DollarSign className="h-4 w-4 text-primary" />
                        <span className="text-xs font-semibold">GMV USD {exec.useM1 ? 'M0 (25%)' : '(50%)'}</span>
                      </div>
                      <p className="text-lg font-bold">
                        ${exec.gmv_real.toLocaleString("en-US")} / $
                        {exec.effectiveGmvMeta.toLocaleString("en-US")}
                      </p>
                      <p className="text-sm text-primary font-medium">
                        {exec.gmvPct.toFixed(1)}% → {exec.gmvWeighted.toFixed(2)}%
                      </p>
                    </div>

                    {/* GMV M1 (March+) */}
                    {exec.useM1 && (
                      <div className="p-3 rounded-lg border bg-muted/30">
                        <div className="flex items-center gap-1.5 mb-1">
                          <DollarSign className="h-4 w-4 text-primary" />
                          <span className="text-xs font-semibold">GMV USD M1 (25%)</span>
                        </div>
                        <p className="text-lg font-bold">
                          ${(exec.gmv_m1_real ?? 0).toLocaleString("en-US")} / $
                          {(exec.effectiveGmvM1Meta ?? 0).toLocaleString("en-US")}
                        </p>
                        <p className="text-sm text-primary font-medium">
                          {(exec.gmvM1Pct ?? 0).toFixed(1)}% → {(exec.gmvM1Weighted ?? 0).toFixed(2)}%
                        </p>
                      </div>
                    )}

                    {/* Indicadores Combinados */}
                    <div
                      className={cn(
                        "p-3 rounded-lg border sm:col-span-3",
                        exec.isGuaranteed
                          ? "bg-amber-500/10 border-amber-500/30"
                          : (exec.candadoMet && exec.indicatorsMet)
                          ? "bg-emerald-500/10 border-emerald-500/30"
                          : "bg-destructive/10 border-destructive/30"
                      )}
                    >
                      <div className="flex items-center gap-1.5 mb-1">
                        {exec.isGuaranteed ? (
                          <CheckCircle className="h-4 w-4 text-amber-600" />
                        ) : (exec.candadoMet && exec.indicatorsMet) ? (
                          <CheckCircle className="h-4 w-4 text-emerald-600" />
                        ) : (
                          <XCircle className="h-4 w-4 text-destructive" />
                        )}
                        <span className="text-xs font-semibold">
                          {exec.isGuaranteed ? 'Garantizado - Bono 100%' : 'Indicadores Combinados (Orig + GMV)'}
                        </span>
                      </div>
                      <p
                        className={cn(
                          "text-sm font-medium",
                          exec.isGuaranteed
                            ? "text-amber-600"
                            : (exec.candadoMet && exec.indicatorsMet) ? "text-emerald-600" : "text-destructive"
                        )}
                      >
                        {exec.isGuaranteed 
                          ? `🛡️ Bono garantizado: ${formatCOP(exec.baseCommission)}`
                          : `${exec.totalPct.toFixed(1)}%`}
                        {!exec.isGuaranteed && !exec.indicatorsMet && " (mín. 85%)"}
                        {!exec.isGuaranteed && exec.candadoMet && exec.indicatorsMet && " ✓ Cumplido"}
                        {!exec.isGuaranteed && !exec.candadoMet && " | Firmas < 85%"}
                      </p>
                    </div>
                  </div>

                  {/* Accelerator Section */}
                  {exec.acceleratorMultiplier > 1 && (
                    <div className="p-3 rounded-lg border border-amber-500/40 bg-amber-500/5">
                      <div className="flex items-center gap-1.5 mb-2">
                        <Zap className="h-4 w-4 text-amber-500" />
                        <span className="text-xs font-semibold">Acelerador de Firmas</span>
                        <Badge className="bg-amber-500 text-white text-xs ml-auto">
                          x{exec.acceleratorMultiplier}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Firmas al {exec.firmasCompliance.toFixed(0)}% → multiplicador x{exec.acceleratorMultiplier}
                      </p>
                    </div>
                  )}

                  <Separator />

                  {/* Adjustments & Commission */}
                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 items-end">
                    <div className="space-y-2">
                      <Label className="text-xs text-muted-foreground">
                        Comisión Calculada
                      </Label>
                      <p className="text-lg font-bold">
                        {formatCOP(exec.calculatedCommission)}
                      </p>
                    </div>

                    <div className="flex items-center gap-3">
                      <Switch
                        checked={exec.hasMb}
                        onCheckedChange={(v) =>
                          updateAdj(exec.user_email, "hasMb", v)
                        }
                        disabled={status === "approved"}
                      />
                      <Label className="text-sm">
                        Ingresos MBs (+20%)
                      </Label>
                    </div>

                    <div className="space-y-1">
                      <Label className="text-xs text-muted-foreground">
                        Bonus Indicador (COP)
                      </Label>
                      <Input
                        type="number"
                        min={0}
                        value={exec.bonus}
                        onChange={(e) =>
                          updateAdj(
                            exec.user_email,
                            "bonus",
                            parseFloat(e.target.value) || 0
                          )
                        }
                        className="font-mono"
                        disabled={status === "approved"}
                      />
                    </div>

                    <div className="space-y-1">
                      <Label className="text-xs text-muted-foreground">
                        Total Comisión
                      </Label>
                      <p
                        className={cn(
                          "text-xl font-bold",
                          exec.totalCommission > 0
                            ? "text-emerald-600"
                            : "text-muted-foreground"
                        )}
                      >
                        {formatCOP(exec.totalCommission)}
                      </p>
                    </div>
                  </div>

                  {/* Rejection reason display */}
                  {status === "rejected" && exec.review?.rejection_reason && (
                    <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/30">
                      <p className="text-sm text-destructive">
                        <strong>Motivo de rechazo:</strong>{" "}
                        {exec.review.rejection_reason}
                      </p>
                    </div>
                  )}

                  {/* Actions */}
                  {status !== "approved" && (
                    <div className="flex gap-2 justify-end">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleOpenReject(exec.user_email)}
                        disabled={isProcessing}
                        className="text-destructive hover:bg-destructive/10"
                      >
                        <X className="h-4 w-4 mr-1" />
                        Rechazar
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => handleApprove(exec)}
                        disabled={isProcessing}
                        className="bg-emerald-600 hover:bg-emerald-700"
                      >
                        {isProcessing ? (
                          <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                        ) : (
                          <Check className="h-4 w-4 mr-1" />
                        )}
                        Aprobar
                      </Button>
                    </div>
                  )}
                  {/* Reset individual - for approved/rejected */}
                  {(status === "approved" || status === "rejected") && (
                    <div className="flex gap-2 justify-end">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleResetIndividual(exec)}
                        disabled={isProcessing}
                        className="text-amber-600 hover:bg-amber-500/10"
                      >
                        <RotateCcw className="h-4 w-4 mr-1" />
                        Devolver a pendiente
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}

          {/* Download approved commissions */}
          {approvedCount > 0 && (
            <div className="flex justify-end">
              <Button onClick={handleDownloadExcel} variant="outline">
                <Download className="h-4 w-4 mr-2" />
                Descargar Excel ({approvedCount} aprobadas)
              </Button>
            </div>
          )}
        </>
      )}

      {/* Reject Dialog */}
      <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Rechazar Comisión</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Ingresa el motivo del rechazo. Se enviará una alerta al equipo
              creador para revisión.
            </p>
            <Textarea
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              placeholder="Motivo del rechazo..."
              rows={3}
            />
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setRejectDialogOpen(false)}
            >
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={handleReject}
              disabled={!rejectionReason.trim() || processingEmail !== null}
            >
              {processingEmail ? (
                <Loader2 className="h-4 w-4 mr-1 animate-spin" />
              ) : null}
              Confirmar Rechazo
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reset Commissions Dialog */}
      <Dialog open={resetDialogOpen} onOpenChange={setResetDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Reiniciar Comisiones</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              ¿Estás seguro de que deseas eliminar <strong>todas</strong> las comisiones
              (aprobadas, rechazadas y pendientes) del período{" "}
              <strong>{selectedMonth}/{selectedYear}</strong>?
            </p>
            <p className="text-sm text-destructive font-medium">
              Esta acción no se puede deshacer.
            </p>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setResetDialogOpen(false)}
            >
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={handleResetCommissions}
              disabled={resetting}
            >
              {resetting ? (
                <Loader2 className="h-4 w-4 mr-1 animate-spin" />
              ) : (
                <RotateCcw className="h-4 w-4 mr-1" />
              )}
              Confirmar Reinicio
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
