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
import { ClipboardList, FileText, Loader2, ExternalLink } from "lucide-react";
import { useTeamFeedbackForms, TeamFeedbackForm } from "@/hooks/useTeamFeedbackForms";

const TeamFeedbackView: React.FC = () => {
  const { forms, isLoading } = useTeamFeedbackForms();
  const [selectedForm, setSelectedForm] = useState<TeamFeedbackForm | null>(null);

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
                onClick={() => setSelectedForm(form)}
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
          <DialogContent className="max-w-4xl h-[85vh]">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                {selectedForm?.name}
              </DialogTitle>
            </DialogHeader>
            <div className="flex-1 h-full min-h-0">
              {selectedForm && (
                <iframe
                  src={selectedForm.embed_url}
                  width="100%"
                  height="100%"
                  style={{ minHeight: "calc(85vh - 100px)", border: "none" }}
                  title={selectedForm.name}
                >
                  Cargando…
                </iframe>
              )}
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
};

export default TeamFeedbackView;
