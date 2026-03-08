import React, { useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Brain, Sparkles, Loader2, CheckCircle2, XCircle, Clock, ChevronDown, Zap, Target, BookOpen, AlertTriangle, Info } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";

interface AICourse {
  id: string;
  title: string;
  description: string | null;
  status: string;
  ai_generation_trigger: string | null;
  ai_analysis: string | null;
  ai_metadata: any;
  created_at: string;
  objectives: string[] | null;
}

const triggerBadge: Record<string, { label: string; className: string }> = {
  manual: { label: "Manual", className: "bg-primary/10 text-primary border-primary/20" },
  cron: { label: "Automático", className: "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20" },
  results_sync: { label: "Sync Resultados", className: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20" },
};

const priorityBadge: Record<string, { label: string; className: string }> = {
  alta: { label: "Alta", className: "bg-destructive text-destructive-foreground" },
  media: { label: "Media", className: "bg-amber-500 text-white" },
};

const AICourseReview: React.FC = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isGenerating, setIsGenerating] = useState(false);

  const { data: courses = [], isLoading } = useQuery({
    queryKey: ["ai-courses"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("courses")
        .select("id, title, description, status, ai_generation_trigger, ai_analysis, ai_metadata, created_at, objectives")
        .eq("is_ai_generated", true)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data || []) as AICourse[];
    },
  });

  const pendingCount = courses.filter((c) => c.status === "draft").length;
  const approvedCount = courses.filter((c) => c.status === "published").length;

  const generateCourses = async () => {
    setIsGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke("generate-ai-courses", {
        body: { trigger: "manual" },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      toast({ title: "¡Cursos generados!", description: `Se crearon ${data.courses_generated} cursos nuevos para revisión.` });
      queryClient.invalidateQueries({ queryKey: ["ai-courses"] });
    } catch (e) {
      console.error(e);
      toast({ title: "Error", description: e instanceof Error ? e.message : "No se pudieron generar cursos", variant: "destructive" });
    } finally {
      setIsGenerating(false);
    }
  };

  const updateCourseStatus = async (id: string, newStatus: "published" | "rejected") => {
    try {
      const updateData: any = { status: newStatus };
      if (newStatus === "published") updateData.published_at = new Date().toISOString();

      const { error } = await supabase.from("courses").update(updateData).eq("id", id);
      if (error) throw error;
      toast({ title: newStatus === "published" ? "Curso aprobado" : "Curso descartado" });
      queryClient.invalidateQueries({ queryKey: ["ai-courses"] });
    } catch (e) {
      console.error(e);
      toast({ title: "Error", description: "No se pudo actualizar el curso", variant: "destructive" });
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
              <Brain className="h-7 w-7 text-primary" />
              Cursos Generados por IA
            </h1>
            <p className="text-muted-foreground mt-1">Revisa y aprueba cursos sugeridos automáticamente</p>
          </div>
          <Button onClick={generateCourses} disabled={isGenerating} className="gap-2">
            {isGenerating ? (
              <><Loader2 className="h-4 w-4 animate-spin" />Generando...</>
            ) : (
              <><Sparkles className="h-4 w-4" />Generar Ahora</>
            )}
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card>
            <CardContent className="pt-6 flex items-center gap-3">
              <div className="rounded-lg p-2 bg-amber-500/10 text-amber-600"><Clock className="h-5 w-5" /></div>
              <div><p className="text-2xl font-bold text-foreground">{pendingCount}</p><p className="text-xs text-muted-foreground">Pendientes de revisión</p></div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6 flex items-center gap-3">
              <div className="rounded-lg p-2 bg-emerald-500/10 text-emerald-600"><CheckCircle2 className="h-5 w-5" /></div>
              <div><p className="text-2xl font-bold text-foreground">{approvedCount}</p><p className="text-xs text-muted-foreground">Aprobados</p></div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6 flex items-center gap-3">
              <div className="rounded-lg p-2 bg-primary/10 text-primary"><Zap className="h-5 w-5" /></div>
              <div><p className="text-2xl font-bold text-foreground">3</p><p className="text-xs text-muted-foreground">Disparadores activos</p></div>
            </CardContent>
          </Card>
        </div>

        {/* Loading */}
        {isLoading && (
          <Card><CardContent className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </CardContent></Card>
        )}

        {/* Empty state */}
        {!isLoading && courses.length === 0 && (
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-16 text-center">
              <div className="rounded-full bg-primary/10 p-4 mb-4"><Brain className="h-10 w-10 text-primary" /></div>
              <h3 className="text-lg font-semibold text-foreground mb-2">No hay cursos generados</h3>
              <p className="text-muted-foreground max-w-md mb-6">
                La IA analizará los resultados de quizzes y entrenamientos para sugerir cursos que cubran las brechas de conocimiento.
              </p>
              <Button onClick={generateCourses} disabled={isGenerating} className="gap-2">
                <Sparkles className="h-4 w-4" />Generar Cursos
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Course list */}
        {!isLoading && courses.length > 0 && (
          <div className="space-y-4">
            {courses.map((course) => {
              const meta = course.ai_metadata || {};
              const tBadge = triggerBadge[course.ai_generation_trigger || "manual"] || triggerBadge.manual;
              const pBadge = priorityBadge[meta.priority] || priorityBadge.media;
              const isDraft = course.status === "draft";

              return (
                <Card key={course.id} className={!isDraft ? "opacity-70" : ""}>
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <CardTitle className="text-base">{course.title}</CardTitle>
                          <Badge variant="outline" className={tBadge.className}>{tBadge.label}</Badge>
                          {meta.priority && <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${pBadge.className}`}>{pBadge.label}</span>}
                          {!isDraft && (
                            <Badge variant={course.status === "published" ? "default" : "destructive"}>
                              {course.status === "published" ? "Aprobado" : "Descartado"}
                            </Badge>
                          )}
                        </div>
                        <CardDescription className="line-clamp-2">{course.description}</CardDescription>
                      </div>
                      {isDraft && (
                        <div className="flex gap-2 shrink-0">
                          <Button size="sm" onClick={() => updateCourseStatus(course.id, "published")} className="gap-1">
                            <CheckCircle2 className="h-3.5 w-3.5" />Aprobar
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => updateCourseStatus(course.id, "rejected")} className="gap-1 text-destructive hover:text-destructive">
                            <XCircle className="h-3.5 w-3.5" />Descartar
                          </Button>
                        </div>
                      )}
                    </div>
                  </CardHeader>

                  <Collapsible>
                    <CollapsibleTrigger asChild>
                      <Button variant="ghost" size="sm" className="w-full justify-between text-muted-foreground hover:text-foreground rounded-none border-t">
                        <span className="flex items-center gap-1 text-xs"><Info className="h-3.5 w-3.5" />Ver análisis detallado</span>
                        <ChevronDown className="h-4 w-4 transition-transform" />
                      </Button>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <CardContent className="pt-4 space-y-4">
                        {/* Gap */}
                        {meta.gap_addressed && (
                          <div>
                            <h4 className="text-xs font-semibold text-muted-foreground uppercase mb-1 flex items-center gap-1">
                              <AlertTriangle className="h-3.5 w-3.5" />Brecha que resuelve
                            </h4>
                            <p className="text-sm text-foreground">{meta.gap_addressed}</p>
                          </div>
                        )}

                        {/* Objectives */}
                        {meta.learning_objectives?.length > 0 && (
                          <div>
                            <h4 className="text-xs font-semibold text-muted-foreground uppercase mb-1 flex items-center gap-1">
                              <Target className="h-3.5 w-3.5" />Objetivos de Aprendizaje
                            </h4>
                            <ul className="space-y-1">
                              {meta.learning_objectives.map((obj: string, i: number) => (
                                <li key={i} className="text-sm text-foreground flex items-start gap-2">
                                  <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-primary shrink-0" />{obj}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {/* Modules */}
                        {meta.suggested_modules?.length > 0 && (
                          <div>
                            <h4 className="text-xs font-semibold text-muted-foreground uppercase mb-1 flex items-center gap-1">
                              <BookOpen className="h-3.5 w-3.5" />Módulos Sugeridos
                            </h4>
                            <ul className="space-y-1">
                              {meta.suggested_modules.map((mod: string, i: number) => (
                                <li key={i} className="text-sm text-foreground flex items-start gap-2">
                                  <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-amber-500 shrink-0" />{mod}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {/* Extra info */}
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
                          {meta.estimated_duration_minutes && (
                            <div className="bg-muted rounded-lg p-2">
                              <span className="text-muted-foreground">Duración est.</span>
                              <p className="font-semibold text-foreground">{meta.estimated_duration_minutes} min</p>
                            </div>
                          )}
                          {meta.expected_score_improvement && (
                            <div className="bg-muted rounded-lg p-2">
                              <span className="text-muted-foreground">Mejora esperada</span>
                              <p className="font-semibold text-foreground">{meta.expected_score_improvement}</p>
                            </div>
                          )}
                          {meta.target_audience && (
                            <div className="bg-muted rounded-lg p-2">
                              <span className="text-muted-foreground">Audiencia</span>
                              <p className="font-semibold text-foreground">{meta.target_audience}</p>
                            </div>
                          )}
                        </div>

                        {/* AI analysis */}
                        {course.ai_analysis && (
                          <div className="bg-primary/5 rounded-lg p-3 border border-primary/10">
                            <h4 className="text-xs font-semibold text-primary mb-1 flex items-center gap-1">
                              <Brain className="h-3.5 w-3.5" />Análisis IA
                            </h4>
                            <p className="text-sm text-foreground/80">{course.ai_analysis}</p>
                          </div>
                        )}
                      </CardContent>
                    </CollapsibleContent>
                  </Collapsible>
                </Card>
              );
            })}
          </div>
        )}

        {/* Triggers info panel */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Zap className="h-5 w-5 text-primary" />
              Disparadores Configurados
            </CardTitle>
            <CardDescription>El sistema puede generar cursos automáticamente</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid sm:grid-cols-3 gap-3">
              <div className="border rounded-lg p-3 space-y-1">
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className={triggerBadge.manual.className}>{triggerBadge.manual.label}</Badge>
                </div>
                <p className="text-xs text-muted-foreground">Genera cursos manualmente desde este panel con el botón "Generar Ahora"</p>
              </div>
              <div className="border rounded-lg p-3 space-y-1">
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className={triggerBadge.cron.className}>{triggerBadge.cron.label}</Badge>
                </div>
                <p className="text-xs text-muted-foreground">Análisis semanal automático de brechas de conocimiento</p>
              </div>
              <div className="border rounded-lg p-3 space-y-1">
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className={triggerBadge.results_sync.className}>{triggerBadge.results_sync.label}</Badge>
                </div>
                <p className="text-xs text-muted-foreground">Se activa al sincronizar resultados del equipo</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default AICourseReview;
