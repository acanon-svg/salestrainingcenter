import React from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { useAuth } from "@/contexts/AuthContext";
import { ResultsSection } from "@/components/results/ResultsSection";
import { TeamResultsUpload } from "@/components/results/TeamResultsUpload";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BarChart3, Upload } from "lucide-react";

const Results: React.FC = () => {
  const { profile, hasRole } = useAuth();
  const isCreatorOrAdmin = hasRole("creator") || hasRole("admin");
  const isLeader = hasRole("lider");

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
            <TabsContent value="upload" className="mt-6">
              <TeamResultsUpload />
            </TabsContent>
            <TabsContent value="view" className="mt-6">
              <ResultsSection showTeamChart showTimePeriodFilter />
            </TabsContent>
          </Tabs>
        ) : isLeader ? (
          <ResultsSection
            showTeamChart
            showTimePeriodFilter
            regional={profile?.regional || undefined}
          />
        ) : (
          <ResultsSection userEmail={profile?.email} />
        )}
      </div>
    </DashboardLayout>
  );
};

export default Results;
