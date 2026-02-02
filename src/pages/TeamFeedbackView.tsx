import React from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ClipboardList, FileText, Loader2, ExternalLink } from "lucide-react";
import { useTeamFeedbackForms, TeamFeedbackForm } from "@/hooks/useTeamFeedbackForms";

// Helper to get clean URL for opening in new tab
const getCleanUrl = (url: string): string => {
  if (url.includes("docs.google.com/forms")) {
    const baseUrl = url.split("?")[0];
    return baseUrl.endsWith("/viewform") 
      ? baseUrl 
      : baseUrl.replace(/\/?$/, "/viewform");
  }
  return url;
};

const FormCard: React.FC<{ form: TeamFeedbackForm }> = ({ form }) => {
  const handleOpenInNewTab = () => {
    window.open(getCleanUrl(form.embed_url), "_blank", "noopener,noreferrer");
  };

  return (
    <Card className="hover:shadow-md transition-shadow cursor-pointer group">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <FileText className="h-6 w-6 text-primary" />
            </div>
            <div>
              <CardTitle className="text-lg">{form.name}</CardTitle>
              {form.description && (
                <CardDescription className="mt-1">{form.description}</CardDescription>
              )}
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <Button 
          onClick={handleOpenInNewTab}
          className="w-full gap-2"
          size="lg"
        >
          <ExternalLink className="h-4 w-4" />
          Abrir formulario
        </Button>
      </CardContent>
    </Card>
  );
};

const TeamFeedbackView: React.FC = () => {
  const { forms, isLoading } = useTeamFeedbackForms();

  const activeForms = forms?.filter((f) => f.is_active) || [];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <ClipboardList className="h-8 w-8 text-primary" />
            Feedbacks al Equipo
          </h1>
          <p className="text-muted-foreground mt-1">
            Formularios de evaluación y retroalimentación
          </p>
        </div>

        {/* Forms Content */}
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : activeForms.length > 0 ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {activeForms.map((form) => (
              <FormCard key={form.id} form={form} />
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="py-12 text-center">
              <ClipboardList className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">
                No hay formularios disponibles
              </h3>
              <p className="text-muted-foreground">
                No tienes formularios de feedback asignados en este momento.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
};

export default TeamFeedbackView;
