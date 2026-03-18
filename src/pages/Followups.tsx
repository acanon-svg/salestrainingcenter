import React from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { RefreshCw, Loader2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useSyncFollowups } from "@/hooks/useFollowups";
import { ErrorBoundary } from "@/components/ErrorBoundary";

const AccompanimentsSection = React.lazy(() => import("@/components/followups/AccompanimentsSection").then(m => ({ default: m.AccompanimentsSection })));
const UniversalFeedbackSection = React.lazy(() => import("@/components/followups/UniversalFeedbackSection").then(m => ({ default: m.UniversalFeedbackSection })));
const QualitySection = React.lazy(() => import("@/components/followups/QualitySection").then(m => ({ default: m.QualitySection })));
const FollowupsDashboard = React.lazy(() => import("@/components/followups/FollowupsDashboard").then(m => ({ default: m.FollowupsDashboard })));

const SectionFallback = () => (
  <div className="flex items-center justify-center py-12">
    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
  </div>
);

const Followups: React.FC = () => {
  const { hasRole } = useAuth();
  const syncMutation = useSyncFollowups();

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Seguimientos</h1>
            <p className="text-muted-foreground">Seguimiento integral de desempeño y desarrollo - by Alexandra Cañon</p>
          </div>
          {(
            <Button
              variant="outline"
              size="sm"
              onClick={() => syncMutation.mutate(undefined)}
              disabled={syncMutation.isPending}
            >
              {syncMutation.isPending ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4 mr-2" />
              )}
              Sincronizar datos
            </Button>
          )}
        </div>

        <Tabs defaultValue="dashboard" className="space-y-4">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="dashboard">Informe General</TabsTrigger>
            <TabsTrigger value="accompaniments">Acompañamientos</TabsTrigger>
            <TabsTrigger value="universal">Feedback Universal</TabsTrigger>
            <TabsTrigger value="quality">Calidad</TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard">
            <ErrorBoundary fallbackTitle="Error al cargar el Informe General">
              <React.Suspense fallback={<SectionFallback />}>
                <FollowupsDashboard />
              </React.Suspense>
            </ErrorBoundary>
          </TabsContent>
          <TabsContent value="accompaniments">
            <ErrorBoundary fallbackTitle="Error al cargar Acompañamientos">
              <React.Suspense fallback={<SectionFallback />}>
                <AccompanimentsSection />
              </React.Suspense>
            </ErrorBoundary>
          </TabsContent>
          <TabsContent value="universal">
            <ErrorBoundary fallbackTitle="Error al cargar Feedback Universal">
              <React.Suspense fallback={<SectionFallback />}>
                <UniversalFeedbackSection />
              </React.Suspense>
            </ErrorBoundary>
          </TabsContent>
          <TabsContent value="quality">
            <ErrorBoundary fallbackTitle="Error al cargar Calidad">
              <React.Suspense fallback={<SectionFallback />}>
                <QualitySection />
              </React.Suspense>
            </ErrorBoundary>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
};

export default Followups;
