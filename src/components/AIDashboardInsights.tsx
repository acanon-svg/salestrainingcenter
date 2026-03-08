import React, { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Brain, TrendingUp, TrendingDown, Minus, AlertTriangle, Sparkles, Lightbulb } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Insight {
  metric: string;
  value: string;
  trend: "up" | "down" | "neutral";
  alert: boolean;
  description: string;
}

interface InsightsData {
  teamHealthScore: number;
  insights: Insight[];
  needsAttention: string[];
  recommendation: string;
}

const trendIcons = {
  up: TrendingUp,
  down: TrendingDown,
  neutral: Minus,
};

const trendColors = {
  up: "text-emerald-600",
  down: "text-destructive",
  neutral: "text-muted-foreground",
};

const AIDashboardInsights: React.FC = () => {
  const [data, setData] = useState<InsightsData | null>(null);
  const [loading, setLoading] = useState(false);

  const generateInsights = async () => {
    setLoading(true);
    try {
      const { data: result, error } = await supabase.functions.invoke("dashboard-insights");
      if (error) throw error;
      if (result?.error) throw new Error(result.error);
      setData(result);
    } catch (err: any) {
      toast.error(err.message || "Error generando insights");
    } finally {
      setLoading(false);
    }
  };

  const getHealthColor = (score: number) => {
    if (score >= 75) return "text-emerald-600";
    if (score >= 50) return "text-amber-600";
    return "text-destructive";
  };

  return (
    <Card className="border-border/50">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Brain className="h-5 w-5 text-primary" />
              Insights IA
            </CardTitle>
            <CardDescription>Análisis inteligente de tu rendimiento</CardDescription>
          </div>
          <Button onClick={generateInsights} disabled={loading} size="sm" className="gap-2">
            <Sparkles className="h-4 w-4" />
            {loading ? "Analizando..." : "Generar Insights"}
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="space-y-4">
            <Skeleton className="h-16 w-full" />
            <div className="grid grid-cols-2 gap-3">
              {[1, 2, 3, 4].map((i) => (
                <Skeleton key={i} className="h-24 w-full" />
              ))}
            </div>
          </div>
        ) : data ? (
          <div className="space-y-5">
            {/* Health Score */}
            <div className="flex items-center gap-4 p-4 rounded-lg bg-muted/50">
              <div className="text-center">
                <div className={`text-3xl font-bold ${getHealthColor(data.teamHealthScore)}`}>
                  {data.teamHealthScore}
                </div>
                <span className="text-xs text-muted-foreground">/ 100</span>
              </div>
              <div className="flex-1 space-y-1">
                <span className="text-sm font-medium">Salud General</span>
                <Progress value={data.teamHealthScore} className="h-3" />
              </div>
            </div>

            {/* Metrics Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {data.insights.slice(0, 4).map((insight, i) => {
                const TrendIcon = trendIcons[insight.trend];
                return (
                  <div
                    key={i}
                    className={`p-3 rounded-lg border transition-colors ${
                      insight.alert
                        ? "border-destructive/30 bg-destructive/5"
                        : "border-border/50 bg-card"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-medium text-muted-foreground">{insight.metric}</span>
                      <div className="flex items-center gap-1">
                        {insight.alert && <AlertTriangle className="h-3 w-3 text-destructive" />}
                        <TrendIcon className={`h-4 w-4 ${trendColors[insight.trend]}`} />
                      </div>
                    </div>
                    <div className="text-lg font-bold">{insight.value}</div>
                    <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{insight.description}</p>
                  </div>
                );
              })}
            </div>

            {/* Needs Attention */}
            {data.needsAttention.length > 0 && (
              <div className="space-y-2">
                <span className="text-sm font-medium text-muted-foreground">Áreas de atención</span>
                <div className="flex flex-wrap gap-2">
                  {data.needsAttention.map((item, i) => (
                    <Badge key={i} variant="outline" className="border-amber-500/30 text-amber-700 bg-amber-500/10">
                      <AlertTriangle className="h-3 w-3 mr-1" />
                      {item}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Recommendation */}
            <div className="p-4 rounded-lg bg-primary/5 border border-primary/20">
              <div className="flex items-start gap-2">
                <Lightbulb className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                <p className="text-sm text-foreground">{data.recommendation}</p>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <Brain className="h-10 w-10 text-muted-foreground/50 mb-2" />
            <p className="text-sm text-muted-foreground">
              Presiona "Generar Insights" para obtener un análisis IA de tu rendimiento
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default AIDashboardInsights;
