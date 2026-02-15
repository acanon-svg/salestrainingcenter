import React, { useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { RefreshCw, Loader2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useSyncFollowups } from "@/hooks/useFollowups";
import { AccompanimentsSection } from "@/components/followups/AccompanimentsSection";
import { UniversalFeedbackSection } from "@/components/followups/UniversalFeedbackSection";
import { QualitySection } from "@/components/followups/QualitySection";

const Followups: React.FC = () => {
  const { hasRole } = useAuth();
  const syncMutation = useSyncFollowups();
  const isCreatorOrAdmin = hasRole("creator") || hasRole("admin");

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Seguimientos</h1>
            <p className="text-muted-foreground">Seguimiento integral de desempeño y desarrollo</p>
          </div>
          {isCreatorOrAdmin && (
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

        <Tabs defaultValue="accompaniments" className="space-y-4">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="accompaniments">Acompañamientos</TabsTrigger>
            <TabsTrigger value="universal">Feedback Universal</TabsTrigger>
            <TabsTrigger value="quality">Calidad</TabsTrigger>
          </TabsList>

          <TabsContent value="accompaniments">
            <AccompanimentsSection />
          </TabsContent>
          <TabsContent value="universal">
            <UniversalFeedbackSection />
          </TabsContent>
          <TabsContent value="quality">
            <QualitySection />
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
};

export default Followups;
