import React, { useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BookOpen, Trophy, Target, Award, Brain, Loader2, Sparkles, CheckCircle2, AlertTriangle, ArrowUp, Clock, Zap } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface WeeklyAction {
  priority: "alta" | "media" | "baja";
  action: string;
  reason: string;
  estimatedTime: string;
  impact: string;
}

interface TrainingPlan {
  summary: string;
  strengths: string[];
  improvements: string[];
  weeklyPlan: WeeklyAction[];
  motivationalMessage: string;
}

interface Metrics {
  totalCourses: number;
  completedPercentage: number;
  avgQuizScore: number;
  badgesCount: number;
}

const priorityConfig = {
  alta: { color: "bg-destructive/10 border-destructive/30 text-destructive", badge: "bg-destructive text-destructive-foreground", icon: ArrowUp },
  media: { color: "bg-amber-500/10 border-amber-500/30 text-amber-700 dark:text-amber-400", badge: "bg-amber-500 text-white", icon: Target },
  baja: { color: "bg-primary/10 border-primary/30 text-primary", badge: "bg-primary text-primary-foreground", icon: Clock },
};

const PersonalizedTraining: React.FC = () => {
  const { toast } = useToast();
  const [plan, setPlan] = useState<TrainingPlan | null>(null);
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  const generatePlan = async () => {
    setIsGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke("generate-training-plan");

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      setPlan(data.plan);
      setMetrics(data.metrics);
      toast({ title: "¡Plan generado!", description: "Tu plan de entrenamiento personalizado está listo." });
    } catch (e) {
      console.error(e);
      toast({
        title: "Error",
        description: e instanceof Error ? e.message : "No se pudo generar el plan",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const metricCards = metrics
    ? [
        { label: "Cursos Totales", value: metrics.totalCourses, icon: BookOpen, color: "text-primary" },
        { label: "% Completado", value: `${metrics.completedPercentage}%`, icon: Target, color: "text-emerald-600" },
        { label: "Promedio Quizzes", value: `${metrics.avgQuizScore}%`, icon: Trophy, color: "text-amber-600" },
        { label: "Insignias", value: metrics.badgesCount, icon: Award, color: "text-purple-600" },
      ]
    : null;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
              <Brain className="h-7 w-7 text-primary" />
              Mi Plan de Entrenamiento IA
            </h1>
            <p className="text-muted-foreground mt-1">
              Genera un plan personalizado basado en tu progreso real
            </p>
          </div>
          <Button onClick={generatePlan} disabled={isGenerating} size="lg" className="gap-2">
            {isGenerating ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Analizando tu perfil...
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4" />
                {plan ? "Regenerar Plan" : "Generar mi Plan"}
              </>
            )}
          </Button>
        </div>

        {/* Metrics */}
        {metricCards && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {metricCards.map((m) => (
              <Card key={m.label}>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3">
                    <div className={`rounded-lg p-2 bg-muted ${m.color}`}>
                      <m.icon className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-foreground">{m.value}</p>
                      <p className="text-xs text-muted-foreground">{m.label}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Empty state */}
        {!plan && !isGenerating && (
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-16 text-center">
              <div className="rounded-full bg-primary/10 p-4 mb-4">
                <Brain className="h-10 w-10 text-primary" />
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-2">Tu plan personalizado te espera</h3>
              <p className="text-muted-foreground max-w-md mb-6">
                La IA analizará tus cursos, quizzes e insignias para crear un plan de entrenamiento semanal adaptado a tu nivel y necesidades.
              </p>
              <Button onClick={generatePlan} disabled={isGenerating} className="gap-2">
                <Sparkles className="h-4 w-4" />
                Generar mi Plan
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Loading */}
        {isGenerating && (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-16">
              <Loader2 className="h-10 w-10 animate-spin text-primary mb-4" />
              <p className="text-foreground font-medium">Analizando tu progreso...</p>
              <p className="text-muted-foreground text-sm mt-1">Esto puede tomar unos segundos</p>
            </CardContent>
          </Card>
        )}

        {/* Plan results */}
        {plan && !isGenerating && (
          <div className="space-y-6">
            {/* Summary */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Target className="h-5 w-5 text-primary" />
                  Resumen
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-foreground">{plan.summary}</p>
              </CardContent>
            </Card>

            {/* Strengths & Improvements */}
            <div className="grid md:grid-cols-2 gap-4">
              <Card className="border-emerald-500/20">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2 text-emerald-700 dark:text-emerald-400">
                    <CheckCircle2 className="h-5 w-5" />
                    Fortalezas
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {plan.strengths.map((s, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-foreground">
                        <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-emerald-500 shrink-0" />
                        {s}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>

              <Card className="border-amber-500/20">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2 text-amber-700 dark:text-amber-400">
                    <AlertTriangle className="h-5 w-5" />
                    Áreas de Mejora
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {plan.improvements.map((s, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-foreground">
                        <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-amber-500 shrink-0" />
                        {s}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            </div>

            {/* Weekly Plan */}
            <div>
              <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                <Zap className="h-5 w-5 text-primary" />
                Plan Semanal
              </h2>
              <div className="space-y-3">
                {plan.weeklyPlan.map((item, i) => {
                  const config = priorityConfig[item.priority];
                  const Icon = config.icon;
                  return (
                    <Card key={i} className={`border ${config.color}`}>
                      <CardContent className="pt-5 pb-4">
                        <div className="flex items-start gap-3">
                          <div className="shrink-0 mt-0.5">
                            <Icon className="h-5 w-5" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1 flex-wrap">
                              <h3 className="font-semibold text-foreground text-sm">{item.action}</h3>
                              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${config.badge}`}>
                                {item.priority}
                              </span>
                            </div>
                            <p className="text-xs text-muted-foreground mb-2">{item.reason}</p>
                            <div className="flex items-center gap-4 text-xs text-muted-foreground">
                              <span className="flex items-center gap-1">
                                <Clock className="h-3 w-3" /> {item.estimatedTime}
                              </span>
                              <span className="flex items-center gap-1">
                                <Zap className="h-3 w-3" /> {item.impact}
                              </span>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>

            {/* Motivational Message */}
            <Card className="bg-primary/5 border-primary/20">
              <CardContent className="pt-6">
                <div className="flex items-start gap-3">
                  <div className="rounded-full bg-primary/10 p-2 shrink-0">
                    <Sparkles className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground mb-1">Mensaje de tu Coach IA</h3>
                    <p className="text-sm text-foreground/80">{plan.motivationalMessage}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default PersonalizedTraining;
