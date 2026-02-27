import React from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { useAuth } from "@/contexts/AuthContext";
import { ResultsSection } from "@/components/results/ResultsSection";
import { ResultsTimelineSection } from "@/components/results/ResultsTimelineSection";
import { TeamResultsUpload } from "@/components/results/TeamResultsUpload";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BarChart3, Upload, AlertCircle, RefreshCw, Loader2 } from "lucide-react";
import { useTriggerSync } from "@/hooks/useResultsSyncConfig";

const Results: React.FC = () => {
  const { profile, hasRole } = useAuth();
  const isCreatorOrAdmin = hasRole("creator") || hasRole("admin");
  const isLeader = hasRole("lider");
  const triggerMutation = useTriggerSync();

  // Field Sales gate: students only see results if their team is Field Sales
  const isFieldSales = profile?.team?.toLowerCase().includes("field sales");
  const canSeeResults = isCreatorOrAdmin || isLeader || isFieldSales;

  if (!canSeeResults) {
    return (
      <DashboardLayout>
        <div className="space-y-8 animate-fade-in">
          <div>
            <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
              <BarChart3 className="w-8 h-8 text-primary" />
              Resultados
            </h1>
          </div>
          <Card className="border-border/50">
            <CardContent className="pt-6 text-center py-12">
              <AlertCircle className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-50" />
              <p className="text-muted-foreground">
                Esta sección no está disponible para tu equipo actualmente.
              </p>
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-8 animate-fade-in">
        <div>
          <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
            <BarChart3 className="w-8 h-8 text-primary" />
            Resultados
          </h1>
          <p className="text-muted-foreground">
            {isCreatorOrAdmin
              ? "Gestiona y visualiza los resultados del equipo"
              : isLeader
              ? "Visualiza los resultados de tu equipo"
              : "Visualiza tus resultados de desempeño"}
          </p>
        </div>

        {isCreatorOrAdmin ? (
          <Tabs defaultValue="upload">
            <div className="flex items-center justify-between flex-wrap gap-3">
              <TabsList>
                <TabsTrigger value="upload" className="gap-2">
                  <Upload className="h-4 w-4" />
                  Cargar Resultados
                </TabsTrigger>
                <TabsTrigger value="view" className="gap-2">
                  <BarChart3 className="h-4 w-4" />
                  Ver Resultados
                </TabsTrigger>
              </TabsList>
              <Button
                size="sm"
                variant="outline"
                onClick={() => triggerMutation.mutate()}
                disabled={triggerMutation.isPending}
                className="gap-2"
              >
                {triggerMutation.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <RefreshCw className="h-4 w-4" />
                )}
                Sincronizar ahora
              </Button>
            </div>
            <TabsContent value="upload" className="mt-6">
              <TeamResultsUpload />
            </TabsContent>
            <TabsContent value="view" className="mt-6 space-y-8">
              <ResultsSection showTeamChart showTimePeriodFilter />
              <ResultsTimelineSection />
            </TabsContent>
          </Tabs>
        ) : isLeader ? (
          <div className="space-y-8">
            <div className="flex justify-end">
              <Button
                size="sm"
                variant="outline"
                onClick={() => triggerMutation.mutate()}
                disabled={triggerMutation.isPending}
                className="gap-2"
              >
                {triggerMutation.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <RefreshCw className="h-4 w-4" />
                )}
                Sincronizar ahora
              </Button>
            </div>
            <ResultsSection
              showTeamChart
              showTimePeriodFilter
              regional={profile?.regional || undefined}
            />
            <ResultsTimelineSection />
          </div>
        ) : (
          <div className="space-y-8">
            <ResultsSection userEmail={profile?.email} showTimePeriodFilter />
            <ResultsTimelineSection userEmail={profile?.email} />
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default Results;
