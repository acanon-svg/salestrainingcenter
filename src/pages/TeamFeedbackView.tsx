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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ClipboardList, FileText, Loader2, ChevronLeft, ChevronRight } from "lucide-react";
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

const FormEmbed: React.FC<{ form: TeamFeedbackForm }> = ({ form }) => {
  const [isLoading, setIsLoading] = useState(true);

  return (
    <div className="relative w-full h-full min-h-[600px]">
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-background/80 z-10">
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">Cargando formulario...</p>
          </div>
        </div>
      )}
      <iframe
        src={getEmbeddableUrl(form.embed_url)}
        className="w-full h-full min-h-[600px] rounded-lg border"
        style={{ border: "none" }}
        title={form.name}
        onLoad={() => setIsLoading(false)}
        sandbox="allow-forms allow-scripts allow-same-origin allow-popups allow-popups-to-escape-sandbox allow-top-navigation-by-user-activation"
        allow="clipboard-write"
        referrerPolicy="no-referrer-when-downgrade"
      />
    </div>
  );
};

const TeamFeedbackView: React.FC = () => {
  const { forms, isLoading } = useTeamFeedbackForms();
  const [currentFormIndex, setCurrentFormIndex] = useState(0);

  const activeForms = forms?.filter((f) => f.is_active) || [];

  const handlePrevious = () => {
    setCurrentFormIndex((prev) => (prev > 0 ? prev - 1 : activeForms.length - 1));
  };

  const handleNext = () => {
    setCurrentFormIndex((prev) => (prev < activeForms.length - 1 ? prev + 1 : 0));
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

        {/* Forms Content */}
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : activeForms.length > 0 ? (
          activeForms.length === 1 ? (
            // Single form - show directly embedded
            <Card>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <FileText className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">{activeForms[0].name}</CardTitle>
                    {activeForms[0].description && (
                      <CardDescription>{activeForms[0].description}</CardDescription>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <FormEmbed form={activeForms[0]} />
              </CardContent>
            </Card>
          ) : (
            // Multiple forms - use tabs
            <Tabs defaultValue={activeForms[0].id} className="w-full">
              <TabsList className="w-full flex flex-wrap h-auto gap-2 bg-muted/50 p-2">
                {activeForms.map((form) => (
                  <TabsTrigger
                    key={form.id}
                    value={form.id}
                    className="flex items-center gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
                  >
                    <FileText className="h-4 w-4" />
                    <span className="hidden sm:inline">{form.name}</span>
                    <span className="sm:hidden">{form.name.split(' ')[0]}</span>
                  </TabsTrigger>
                ))}
              </TabsList>
              
              {activeForms.map((form) => (
                <TabsContent key={form.id} value={form.id} className="mt-4">
                  <Card>
                    <CardHeader>
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-primary/10">
                          <FileText className="h-6 w-6 text-primary" />
                        </div>
                        <div>
                          <CardTitle className="text-lg">{form.name}</CardTitle>
                          {form.description && (
                            <CardDescription>{form.description}</CardDescription>
                          )}
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <FormEmbed form={form} />
                    </CardContent>
                  </Card>
                </TabsContent>
              ))}
            </Tabs>
          )
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
