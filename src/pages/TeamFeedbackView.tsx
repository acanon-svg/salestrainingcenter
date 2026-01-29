import React, { useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ClipboardList, FileText, Loader2, ExternalLink, AlertTriangle } from "lucide-react";
import { useTeamFeedbackForms, TeamFeedbackForm } from "@/hooks/useTeamFeedbackForms";

// Helper to ensure Google Forms URL is in embeddable format
const getEmbeddableUrl = (url: string): string => {
  // If it's a Google Form, make sure it uses the /viewform embedded format
  if (url.includes("docs.google.com/forms")) {
    // Remove any existing query params and add embedded=true
    const baseUrl = url.split("?")[0];
    // Ensure it ends with /viewform
    const viewformUrl = baseUrl.endsWith("/viewform") 
      ? baseUrl 
      : baseUrl.replace(/\/?$/, "/viewform");
    return `${viewformUrl}?embedded=true`;
  }
  return url;
};

const TeamFeedbackView: React.FC = () => {
  const { forms, isLoading } = useTeamFeedbackForms();
  const [selectedForm, setSelectedForm] = useState<TeamFeedbackForm | null>(null);
  const [iframeError, setIframeError] = useState(false);
  const [iframeLoading, setIframeLoading] = useState(true);

  const activeForms = forms?.filter((f) => f.is_active) || [];

  const handleOpenForm = (form: TeamFeedbackForm) => {
    setSelectedForm(form);
    setIframeError(false);
    setIframeLoading(true);
  };

  const handleIframeLoad = () => {
    setIframeLoading(false);
  };

  const handleOpenExternal = () => {
    if (selectedForm) {
      window.open(selectedForm.embed_url, "_blank", "noopener,noreferrer");
    }
  };

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

        {/* Forms Grid */}
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : activeForms.length > 0 ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {activeForms.map((form) => (
              <Card
                key={form.id}
                className="hover:border-primary/50 transition-colors cursor-pointer"
                onClick={() => handleOpenForm(form)}
              >
                <CardHeader>
                  <div className="flex items-start gap-3">
                    <div className="p-2 rounded-lg bg-primary/10">
                      <FileText className="h-6 w-6 text-primary" />
                    </div>
                    <div className="flex-1">
                      <CardTitle className="text-lg">{form.name}</CardTitle>
                      {form.description && (
                        <CardDescription className="mt-1">
                          {form.description}
                        </CardDescription>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <Badge variant="secondary">Formulario</Badge>
                    <Button size="sm" variant="outline">
                      <ExternalLink className="h-4 w-4 mr-2" />
                      Abrir
                    </Button>
                  </div>
                </CardContent>
              </Card>
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

        {/* Embedded Form Dialog */}
        <Dialog
          open={!!selectedForm}
          onOpenChange={() => setSelectedForm(null)}
        >
          <DialogContent className="max-w-4xl h-[85vh] flex flex-col">
            <DialogHeader className="flex-shrink-0">
              <DialogTitle className="flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  {selectedForm?.name}
                </span>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={handleOpenExternal}
                  className="ml-4"
                >
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Abrir en nueva pestaña
                </Button>
              </DialogTitle>
            </DialogHeader>
            
            <div className="flex-1 min-h-0 relative">
              {iframeLoading && (
                <div className="absolute inset-0 flex items-center justify-center bg-background/80 z-10">
                  <div className="flex flex-col items-center gap-3">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    <p className="text-sm text-muted-foreground">Cargando formulario...</p>
                  </div>
                </div>
              )}
              
              {iframeError ? (
                <div className="flex flex-col items-center justify-center h-full gap-4 p-8 text-center">
                  <AlertTriangle className="h-12 w-12 text-amber-500" />
                  <div>
                    <h3 className="font-semibold text-lg mb-2">
                      No se puede mostrar el formulario aquí
                    </h3>
                    <p className="text-muted-foreground mb-4">
                      El formulario tiene restricciones que impiden mostrarlo embebido.
                      Puedes abrirlo en una nueva pestaña.
                    </p>
                  </div>
                  <Button onClick={handleOpenExternal}>
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Abrir formulario en nueva pestaña
                  </Button>
                </div>
              ) : selectedForm && (
                <iframe
                  src={getEmbeddableUrl(selectedForm.embed_url)}
                  width="100%"
                  height="100%"
                  style={{ 
                    minHeight: "calc(85vh - 120px)", 
                    border: "none",
                    borderRadius: "8px"
                  }}
                  title={selectedForm.name}
                  onLoad={handleIframeLoad}
                  onError={() => setIframeError(true)}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  sandbox="allow-forms allow-scripts allow-same-origin allow-popups allow-popups-to-escape-sandbox"
                />
              )}
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
};

export default TeamFeedbackView;
