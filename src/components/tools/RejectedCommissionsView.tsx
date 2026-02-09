import React, { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertCircle,
  Loader2,
  RefreshCw,
  Lock,
  LockOpen,
  Target,
  DollarSign,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useQuery } from "@tanstack/react-query";
import { CommissionReview } from "@/hooks/useCommissionReviews";
import { cn } from "@/lib/utils";
import { MonthSelector } from "./MonthSelector";

const db = () => supabase as any;

const formatCOP = (value: number) =>
  new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);

/** Fetch all rejected commission reviews, optionally filtered by month/year. */
const useRejectedCommissions = (month?: number, year?: number) => {
  return useQuery({
    queryKey: ["rejected-commissions-list", month, year],
    queryFn: async () => {
      let query = db()
        .from("commission_reviews")
        .select("*")
        .eq("status", "rejected");
      if (month && month > 0) query = query.eq("period_month", month);
      if (year && year > 0) query = query.eq("period_year", year);
      query = query.order("updated_at", { ascending: false });
      const { data, error } = await query;
      if (error) throw error;
      return (data || []) as CommissionReview[];
    },
  });
};

export const RejectedCommissionsView: React.FC = () => {
  const now = new Date();
  const [selectedMonth, setSelectedMonth] = useState(now.getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(now.getFullYear());
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [selectedReview, setSelectedReview] = useState<CommissionReview | null>(null);
  const [processing, setProcessing] = useState(false);

  const queryClient = useQueryClient();

  const { data: rejectedCommissions, isLoading } = useRejectedCommissions(
    selectedMonth,
    selectedYear
  );

  const handleSendBackForReview = (review: CommissionReview) => {
    setSelectedReview(review);
    setConfirmDialogOpen(true);
  };

  const confirmSendBack = async () => {
    if (!selectedReview) return;
    setProcessing(true);
    try {
      const { error } = await db()
        .from("commission_reviews")
        .update({
          status: "pending",
          rejection_reason: null,
          reviewed_by: null,
          reviewed_at: null,
        })
        .eq("id", selectedReview.id);

      if (error) throw error;

      // Notify the leader via a notification (optional but helpful)
      try {
        // Find leaders with the same regional to notify them
        if (selectedReview.regional) {
          const { data: leaderRegions } = await supabase
            .from("leader_regions")
            .select("user_id")
            .eq("regional", selectedReview.regional);

          if (leaderRegions && leaderRegions.length > 0) {
            const notifications = leaderRegions.map((lr: any) => ({
              user_id: lr.user_id,
              title: "📋 Comisión lista para re-revisión",
              message: `La comisión de ${selectedReview.user_name || selectedReview.user_email} ha sido corregida y requiere tu aprobación nuevamente.`,
              type: "commission_review",
            }));
            await supabase.from("notifications").insert(notifications);
          }
        }
      } catch (e) {
        console.warn("Could not send leader notification:", e);
      }

      queryClient.invalidateQueries({ queryKey: ["rejected-commissions-list"] });
      queryClient.invalidateQueries({ queryKey: ["commission-reviews"] });
      queryClient.invalidateQueries({ queryKey: ["rejected-commission-count"] });

      toast.success(`Comisión de ${selectedReview.user_name || selectedReview.user_email} enviada a revisión`);
      setConfirmDialogOpen(false);
      setSelectedReview(null);
    } catch (err: any) {
      toast.error(`Error: ${err.message}`);
    } finally {
      setProcessing(false);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-16 w-full" />
        <Skeleton className="h-[200px] w-full" />
        <Skeleton className="h-[200px] w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Month filter */}
      <MonthSelector
        selectedMonth={selectedMonth}
        selectedYear={selectedYear}
        onMonthChange={setSelectedMonth}
        onYearChange={setSelectedYear}
      />

      {/* Summary */}
      <Card>
        <CardContent className="pt-4 text-center">
          <p className="text-xs text-muted-foreground">Total Rechazadas</p>
          <p className="text-2xl font-bold text-destructive">
            {rejectedCommissions?.length || 0}
          </p>
        </CardContent>
      </Card>

      {(!rejectedCommissions || rejectedCommissions.length === 0) ? (
        <Card>
          <CardContent className="py-12 text-center">
            <AlertCircle className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">
              No hay comisiones rechazadas para este período.
            </p>
          </CardContent>
        </Card>
      ) : (
        rejectedCommissions.map((review) => (
          <Card
            key={review.id}
            className="border-destructive/50 bg-destructive/5 transition-all"
          >
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between flex-wrap gap-2">
                <div>
                  <CardTitle className="text-lg">
                    {review.user_name || review.user_email}
                  </CardTitle>
                  <CardDescription>{review.user_email}</CardDescription>
                  {review.regional && (
                    <Badge variant="outline" className="mt-1 text-xs">
                      {review.regional}
                    </Badge>
                  )}
                </div>
                <Badge variant="destructive">❌ Rechazada</Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Rejection Reason - PROMINENTLY displayed */}
              <div className="p-4 rounded-lg bg-destructive/10 border border-destructive/30">
                <p className="text-sm font-semibold text-destructive mb-1">
                  Motivo del rechazo:
                </p>
                <p className="text-sm text-destructive/90">
                  {review.rejection_reason || "Sin motivo especificado"}
                </p>
                {review.reviewed_at && (
                  <p className="text-xs text-muted-foreground mt-2">
                    Rechazada el {new Date(review.reviewed_at).toLocaleDateString("es-CO", {
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                )}
              </div>

              {/* KPI Summary */}
              <div className="grid gap-3 sm:grid-cols-3">
                <div
                  className={cn(
                    "p-3 rounded-lg border",
                    review.candado_met
                      ? "bg-emerald-500/10 border-emerald-500/30"
                      : "bg-destructive/10 border-destructive/30"
                  )}
                >
                  <div className="flex items-center gap-1.5 mb-1">
                    {review.candado_met ? (
                      <LockOpen className="h-4 w-4 text-emerald-600" />
                    ) : (
                      <Lock className="h-4 w-4 text-destructive" />
                    )}
                    <span className="text-xs font-semibold">Firmas (Candado)</span>
                  </div>
                  <p className="text-lg font-bold">
                    {review.firmas_real} / {review.firmas_meta}
                  </p>
                  <p className={cn(
                    "text-sm font-medium",
                    review.candado_met ? "text-emerald-600" : "text-destructive"
                  )}>
                    {review.firmas_compliance.toFixed(1)}%
                  </p>
                </div>

                <div className="p-3 rounded-lg border bg-muted/30">
                  <div className="flex items-center gap-1.5 mb-1">
                    <Target className="h-4 w-4 text-primary" />
                    <span className="text-xs font-semibold">Originaciones (50%)</span>
                  </div>
                  <p className="text-lg font-bold">
                    {review.originaciones_real.toLocaleString("es-CO")} /{" "}
                    {review.originaciones_meta.toLocaleString("es-CO")}
                  </p>
                  <p className="text-sm text-primary font-medium">
                    {review.originaciones_weighted.toFixed(2)}%
                  </p>
                </div>

                <div className="p-3 rounded-lg border bg-muted/30">
                  <div className="flex items-center gap-1.5 mb-1">
                    <DollarSign className="h-4 w-4 text-primary" />
                    <span className="text-xs font-semibold">GMV USD (50%)</span>
                  </div>
                  <p className="text-lg font-bold">
                    ${review.gmv_real.toLocaleString("en-US")} / $
                    {review.gmv_meta.toLocaleString("en-US")}
                  </p>
                  <p className="text-sm text-primary font-medium">
                    {review.gmv_weighted.toFixed(2)}%
                  </p>
                </div>
              </div>

              <Separator />

              {/* Commission details */}
              <div className="grid gap-4 sm:grid-cols-3 items-center">
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">Comisión Calculada</p>
                  <p className="text-lg font-bold">{formatCOP(review.calculated_commission)}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">MB Income (+20%)</p>
                  <p className="text-sm font-medium">{review.has_mb_income ? "Sí" : "No"}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">Total Comisión</p>
                  <p className="text-xl font-bold text-muted-foreground">
                    {formatCOP(review.total_commission)}
                  </p>
                </div>
              </div>

              <Separator />

              {/* Action: Send back for review */}
              <div className="flex justify-end">
                <Button
                  onClick={() => handleSendBackForReview(review)}
                  className="bg-primary hover:bg-primary/90"
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Enviar a Revisión
                </Button>
              </div>
            </CardContent>
          </Card>
        ))
      )}

      {/* Confirm Dialog */}
      <Dialog open={confirmDialogOpen} onOpenChange={setConfirmDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Enviar a Revisión</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              ¿Confirmas que deseas enviar la comisión de{" "}
              <strong>{selectedReview?.user_name || selectedReview?.user_email}</strong>{" "}
              nuevamente al líder para su aprobación?
            </p>
            <p className="text-sm text-muted-foreground">
              El estado cambiará a <Badge variant="secondary">Pendiente</Badge> y el líder
              de la regional recibirá una notificación para revisarla.
            </p>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setConfirmDialogOpen(false)}
            >
              Cancelar
            </Button>
            <Button
              onClick={confirmSendBack}
              disabled={processing}
            >
              {processing ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4 mr-2" />
              )}
              Confirmar Envío
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
