import React, { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useAuth } from "@/contexts/AuthContext";
import { useAccompaniments, useUniversalFeedback, useQualityEvaluations } from "@/hooks/useFollowups";
import { useLeaderTeamEmails } from "@/hooks/useLeaderTeamEmails";
import { Loader2, MessageSquare, TrendingDown, BarChart3, Users, AlertTriangle, Award } from "lucide-react";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend, LineChart, Line } from "recharts";

const FEEDBACK_TYPES = ["Feedback 1-1", "Feedback Recurrente", "Feedback de Oportunidad", "PDP Inicial", "Seguimiento al PDP", "Resultado del PDP"];

const craftToNum = (v: string | null) => {
  if (!v) return 0;
  const match = v.match(/A(\d)/);
  return match ? parseInt(match[1]) : 0;
};

const formatDate = (ts: string) => {
  const d = new Date(ts);
  return d.toLocaleDateString("es-CO", { day: "2-digit", month: "short", year: "numeric" });
};

const formatMonth = (ts: string) => {
  const d = new Date(ts);
  return d.toLocaleDateString("es-CO", { month: "short", year: "2-digit" });
};

// Compute avg craft score for an accompaniment
const avgCraftScore = (item: any) => {
  const crafts = [item.craft_negociacion, item.craft_manejo_objeciones, item.craft_persuasion, item.craft_herramientas, item.craft_conocimiento_productos];
  const vals = crafts.map(craftToNum).filter(v => v > 0);
  return vals.length > 0 ? vals.reduce((a: number, b: number) => a + b, 0) / vals.length : 0;
};

// Compute avg competency score for an accompaniment
const avgCompScore = (item: any) => {
  const comps = [item.comp_abordaje, item.comp_pitch_comercial, item.comp_claridad_negociacion, item.comp_conocimiento_confianza, item.comp_objeciones_cierre, item.comp_optimiza_zona];
  const vals = comps.filter((v: any) => v != null && v > 0) as number[];
  return vals.length > 0 ? vals.reduce((a, b) => a + b, 0) / vals.length : 0;
};

export const FollowupsDashboard: React.FC = () => {
  const { profile, hasRole } = useAuth();
  const { data: accompaniments, isLoading: loadingAcc } = useAccompaniments();
  const { data: universalFb, isLoading: loadingFb } = useUniversalFeedback();
  const { data: quality, isLoading: loadingQ } = useQualityEvaluations();
  const { data: teamEmails } = useLeaderTeamEmails();

  const [selectedRegional, setSelectedRegional] = useState<string>("all");
  const [feedbackTypeFilter, setFeedbackTypeFilter] = useState<string>("all");
  const [showTopPerformers, setShowTopPerformers] = useState(true);

  const isLeaderOrAbove = hasRole("lider") || hasRole("creator") || hasRole("admin");
  const isCreatorOrAdmin = hasRole("creator") || hasRole("admin");
  const isMacroUser = profile?.email === "staborda@addi.com";
  const hasMacroAccess = isCreatorOrAdmin || isMacroUser;

  const isLoading = loadingAcc || loadingFb || loadingQ;

  // Filter data by role
  const filteredAccompaniments = useMemo(() => {
    if (!accompaniments) return [];
    if (hasMacroAccess) return accompaniments;
    if (isLeaderOrAbove && teamEmails) return accompaniments.filter(d => teamEmails.has(d.evaluator_email));
    return accompaniments.filter(d => d.executive_email === profile?.email);
  }, [accompaniments, hasMacroAccess, isLeaderOrAbove, teamEmails, profile?.email]);

  const filteredFeedback = useMemo(() => {
    if (!universalFb) return [];
    if (hasMacroAccess) return universalFb;
    if (isLeaderOrAbove && teamEmails) return universalFb.filter(d => teamEmails.has(d.leader_email));
    return universalFb.filter(d => d.executive_email === profile?.email);
  }, [universalFb, hasMacroAccess, isLeaderOrAbove, teamEmails, profile?.email]);

  const filteredQuality = useMemo(() => {
    if (!quality) return [];
    if (hasMacroAccess) return quality;
    if (isLeaderOrAbove && teamEmails) return quality.filter(d => d.leader_email && teamEmails.has(d.leader_email));
    return quality.filter(d => d.hunter_email === profile?.email);
  }, [quality, hasMacroAccess, isLeaderOrAbove, teamEmails, profile?.email]);

  // All regionals
  const allRegionals = useMemo(() => {
    const regs = new Set<string>();
    filteredAccompaniments.forEach(d => regs.add(d.regional));
    filteredFeedback.forEach(d => regs.add(d.regional));
    return [...regs].sort();
  }, [filteredAccompaniments, filteredFeedback]);

  // Data filtered by regional selection
  const accByRegional = useMemo(() => selectedRegional === "all" ? filteredAccompaniments : filteredAccompaniments.filter(d => d.regional === selectedRegional), [filteredAccompaniments, selectedRegional]);
  const fbByRegional = useMemo(() => selectedRegional === "all" ? filteredFeedback : filteredFeedback.filter(d => d.regional === selectedRegional), [filteredFeedback, selectedRegional]);
  const qualByRegional = useMemo(() => selectedRegional === "all" ? filteredQuality : filteredQuality.filter(d => {
    // Quality doesn't have regional directly, match via accompaniments regional
    return true;
  }), [filteredQuality, selectedRegional]);

  // === SUMMARY CARDS ===
  const totalFeedbacks = fbByRegional.length;
  const totalAccompaniments = accByRegional.length;
  const totalQuality = qualByRegional.length;
  const totalFollowups = totalFeedbacks + totalAccompaniments + totalQuality;

  // Avg accompaniment score
  const avgAccScore = useMemo(() => {
    if (accByRegional.length === 0) return 0;
    return accByRegional.reduce((s, d) => s + avgCompScore(d), 0) / accByRegional.length;
  }, [accByRegional]);

  // Avg quality score
  const avgQualScore = useMemo(() => {
    const withScore = qualByRegional.filter(d => d.score_numeric != null);
    if (withScore.length === 0) return 0;
    return withScore.reduce((s, d) => s + (d.score_numeric || 0), 0) / withScore.length;
  }, [qualByRegional]);

  // Lowest performing regional (by accompaniment avg)
  const lowestRegional = useMemo(() => {
    const byReg: Record<string, { total: number; count: number }> = {};
    filteredAccompaniments.forEach(d => {
      if (!byReg[d.regional]) byReg[d.regional] = { total: 0, count: 0 };
      byReg[d.regional].total += avgCompScore(d);
      byReg[d.regional].count++;
    });
    const entries = Object.entries(byReg).map(([r, v]) => ({ regional: r, avg: v.total / v.count }));
    if (entries.length === 0) return null;
    return entries.sort((a, b) => a.avg - b.avg)[0];
  }, [filteredAccompaniments]);

  // PDP executives count
  const pdpExecutives = useMemo(() => {
    const pdpTypes = ["PDP Inicial", "Seguimiento al PDP", "Resultado del PDP"];
    const execs = new Set<string>();
    fbByRegional.filter(d => pdpTypes.includes(d.feedback_type)).forEach(d => execs.add(d.executive_email));
    return execs.size;
  }, [fbByRegional]);

  // === CHART: Feedback by regional over time ===
  const chartByRegional = useMemo(() => {
    const source = feedbackTypeFilter === "all" ? fbByRegional : fbByRegional.filter(d => d.feedback_type === feedbackTypeFilter);
    const monthMap: Record<string, Record<string, number>> = {};
    source.forEach(d => {
      const mk = formatMonth(d.timestamp);
      const reg = d.regional;
      if (!monthMap[mk]) monthMap[mk] = {};
      monthMap[mk][reg] = (monthMap[mk][reg] || 0) + 1;
    });

    // Also add accompaniments data grouped by month/regional
    const accSource = selectedRegional === "all" ? filteredAccompaniments : accByRegional;
    if (feedbackTypeFilter === "all" || feedbackTypeFilter === "accompaniments") {
      accSource.forEach(d => {
        const mk = formatMonth(d.timestamp);
        const reg = d.regional;
        if (!monthMap[mk]) monthMap[mk] = {};
        monthMap[mk][reg] = (monthMap[mk][reg] || 0) + 1;
      });
    }

    const months = Object.keys(monthMap).sort((a, b) => {
      const da = new Date(a); const db = new Date(b);
      return da.getTime() - db.getTime();
    });

    const regs = selectedRegional !== "all" ? [selectedRegional] : allRegionals;
    return months.map(m => {
      const row: any = { month: m };
      regs.forEach(r => { row[r] = monthMap[m]?.[r] || 0; });
      return row;
    });
  }, [fbByRegional, accByRegional, filteredAccompaniments, feedbackTypeFilter, allRegionals, selectedRegional]);

  const chartColors = ["#8b5cf6", "#f59e0b", "#10b981", "#3b82f6", "#ef4444", "#ec4899", "#06b6d4", "#84cc16"];
  const chartConfig = useMemo(() => {
    const regs = selectedRegional !== "all" ? [selectedRegional] : allRegionals;
    const config: any = {};
    regs.forEach((r, i) => { config[r] = { label: r, color: chartColors[i % chartColors.length] }; });
    return config;
  }, [allRegionals, selectedRegional]);

  // === TOP / BOTTOM EXECUTIVES ===
  const executiveRanking = useMemo(() => {
    const execMap: Record<string, { name: string; email: string; regional: string; totalScore: number; count: number; lastDate: string; observations: string[] }> = {};

    accByRegional.forEach(d => {
      const key = d.executive_email;
      if (!execMap[key]) execMap[key] = { name: d.executive_name, email: d.executive_email, regional: d.regional, totalScore: 0, count: 0, lastDate: d.timestamp, observations: [] };
      execMap[key].totalScore += avgCompScore(d);
      execMap[key].count++;
      if (d.timestamp > execMap[key].lastDate) execMap[key].lastDate = d.timestamp;
      if (d.observaciones) execMap[key].observations.push(d.observaciones);
      if (d.oportunidades_entrenamiento) execMap[key].observations.push(d.oportunidades_entrenamiento);
    });

    fbByRegional.forEach(d => {
      const key = d.executive_email;
      if (!execMap[key]) execMap[key] = { name: d.executive_name, email: d.executive_email, regional: d.regional, totalScore: 0, count: 0, lastDate: d.timestamp, observations: [] };
      execMap[key].count++;
      if (d.timestamp > execMap[key].lastDate) execMap[key].lastDate = d.timestamp;
      if (d.oportunidades_trabajar) execMap[key].observations.push(d.oportunidades_trabajar);
    });

    return Object.values(execMap)
      .map(e => ({ ...e, avgScore: e.totalScore / (e.count || 1) }))
      .sort((a, b) => showTopPerformers ? b.avgScore - a.avgScore : a.avgScore - b.avgScore)
      .slice(0, 10);
  }, [accByRegional, fbByRegional, showTopPerformers]);

  // === MEMBER DETAIL when regional is selected ===
  const memberChartData = useMemo(() => {
    if (selectedRegional === "all") return [];
    const execMap: Record<string, Record<string, number>> = {};
    accByRegional.forEach(d => {
      const mk = formatMonth(d.timestamp);
      if (!execMap[d.executive_name]) execMap[d.executive_name] = {};
      execMap[d.executive_name][mk] = avgCompScore(d);
    });

    const months = [...new Set(accByRegional.map(d => formatMonth(d.timestamp)))].sort();
    return months.map(m => {
      const row: any = { month: m };
      Object.keys(execMap).forEach(name => { row[name] = execMap[name][m] || 0; });
      return row;
    });
  }, [accByRegional, selectedRegional]);

  const memberNames = useMemo(() => {
    if (selectedRegional === "all") return [];
    return [...new Set(accByRegional.map(d => d.executive_name))].sort();
  }, [accByRegional, selectedRegional]);

  const memberChartConfig = useMemo(() => {
    const config: any = {};
    memberNames.forEach((n, i) => { config[n] = { label: n, color: chartColors[i % chartColors.length] }; });
    return config;
  }, [memberNames]);

  // === DIAGNOSTICS ===
  const diagnostics = useMemo(() => {
    const alerts: string[] = [];
    const recommendations: string[] = [];

    // No recent accompaniments
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const recentAcc = accByRegional.filter(d => new Date(d.timestamp) >= thirtyDaysAgo);
    if (accByRegional.length > 0 && recentAcc.length === 0) {
      alerts.push("⚠️ No se han registrado acompañamientos en los últimos 30 días.");
    }

    // Low performing executives
    const lowPerformers = executiveRanking.filter(e => e.avgScore > 0 && e.avgScore < 2.5 && !showTopPerformers);
    if (lowPerformers.length > 0) {
      alerts.push(`🔴 ${lowPerformers.length} ejecutivo(s) con calificación promedio inferior a 2.5/5.`);
    }

    // PDP alerts
    if (pdpExecutives > 0) {
      alerts.push(`📋 ${pdpExecutives} ejecutivo(s) actualmente en Plan de Desarrollo Personal (PDP).`);
    }

    // Quality below threshold
    if (avgQualScore > 0 && avgQualScore < 70) {
      alerts.push(`⚠️ Promedio de calidad (${avgQualScore.toFixed(0)}%) por debajo del umbral aceptable (70%).`);
    }

    // Recommendations based on observations
    const allObs = executiveRanking.flatMap(e => e.observations).filter(Boolean);
    if (allObs.length > 0) {
      const obsKeywords: Record<string, number> = {};
      allObs.forEach(o => {
        const lower = o.toLowerCase();
        if (lower.includes("negociación") || lower.includes("negociacion")) obsKeywords["Negociación"] = (obsKeywords["Negociación"] || 0) + 1;
        if (lower.includes("producto") || lower.includes("conocimiento")) obsKeywords["Conocimiento de producto"] = (obsKeywords["Conocimiento de producto"] || 0) + 1;
        if (lower.includes("objeciones")) obsKeywords["Manejo de objeciones"] = (obsKeywords["Manejo de objeciones"] || 0) + 1;
        if (lower.includes("herramienta")) obsKeywords["Uso de herramientas"] = (obsKeywords["Uso de herramientas"] || 0) + 1;
        if (lower.includes("pitch") || lower.includes("abordaje")) obsKeywords["Pitch/Abordaje"] = (obsKeywords["Pitch/Abordaje"] || 0) + 1;
      });
      const sorted = Object.entries(obsKeywords).sort((a, b) => b[1] - a[1]).slice(0, 3);
      if (sorted.length > 0) {
        recommendations.push(`📊 Áreas más mencionadas en observaciones: ${sorted.map(([k, v]) => `${k} (${v})`).join(", ")}.`);
        recommendations.push(`💡 Se recomienda reforzar entrenamiento en: ${sorted.map(([k]) => k).join(", ")}.`);
      }
    }

    if (lowestRegional && lowestRegional.avg < 3) {
      recommendations.push(`🎯 Regional "${lowestRegional.regional}" requiere atención prioritaria (promedio: ${lowestRegional.avg.toFixed(1)}/5).`);
    }

    return { alerts, recommendations };
  }, [accByRegional, executiveRanking, pdpExecutives, avgQualScore, lowestRegional, showTopPerformers]);

  if (isLoading) {
    return <div className="flex items-center justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>;
  }

  if (totalFollowups === 0) {
    return <Card><CardContent className="py-8 text-center text-muted-foreground">No hay datos de seguimientos disponibles.</CardContent></Card>;
  }

  return (
    <div className="space-y-6">
      {/* Regional Filter */}
      <div className="flex gap-4 flex-wrap items-center">
        <Select value={selectedRegional} onValueChange={setSelectedRegional}>
          <SelectTrigger className="w-[240px]">
            <SelectValue placeholder="Filtrar por regional" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas las regionales</SelectItem>
            {allRegionals.map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        <Card>
          <CardContent className="p-4 text-center">
            <div className="flex items-center justify-center mb-2">
              <MessageSquare className="h-5 w-5 text-primary" />
            </div>
            <p className="text-2xl font-bold">{totalFeedbacks}</p>
            <p className="text-xs text-muted-foreground">Feedbacks Realizados</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="flex items-center justify-center mb-2">
              <Users className="h-5 w-5 text-primary" />
            </div>
            <p className="text-2xl font-bold">{totalAccompaniments}</p>
            <p className="text-xs text-muted-foreground">Acompañamientos</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="flex items-center justify-center mb-2">
              <BarChart3 className="h-5 w-5 text-primary" />
            </div>
            <p className="text-2xl font-bold">{totalQuality}</p>
            <p className="text-xs text-muted-foreground">Eval. Calidad</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="flex items-center justify-center mb-2">
              <Award className="h-5 w-5 text-amber-500" />
            </div>
            <p className="text-2xl font-bold">{avgAccScore > 0 ? avgAccScore.toFixed(1) : "-"}<span className="text-sm font-normal text-muted-foreground">/5</span></p>
            <p className="text-xs text-muted-foreground">Prom. Acompañamientos</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="flex items-center justify-center mb-2">
              <Award className="h-5 w-5 text-green-500" />
            </div>
            <p className="text-2xl font-bold">{avgQualScore > 0 ? `${avgQualScore.toFixed(0)}%` : "-"}</p>
            <p className="text-xs text-muted-foreground">Prom. Calidad</p>
          </CardContent>
        </Card>
        <Card className={lowestRegional && lowestRegional.avg < 3 ? "border-destructive/50" : ""}>
          <CardContent className="p-4 text-center">
            <div className="flex items-center justify-center mb-2">
              <TrendingDown className="h-5 w-5 text-destructive" />
            </div>
            <p className="text-lg font-bold truncate">{lowestRegional?.regional || "-"}</p>
            <p className="text-xs text-muted-foreground">Regional más bajo ({lowestRegional ? lowestRegional.avg.toFixed(1) : "-"})</p>
          </CardContent>
        </Card>
      </div>

      {/* PDP Summary */}
      {pdpExecutives > 0 && (
        <Card className="border-amber-500/30 bg-amber-50/50 dark:bg-amber-950/20">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-600" />
              <div>
                <p className="font-medium text-sm">Ejecutivos en PDP</p>
                <p className="text-xs text-muted-foreground">{pdpExecutives} ejecutivo(s) actualmente en Plan de Desarrollo Personal</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Chart: Feedback by regional */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between flex-wrap gap-2">
            <CardTitle className="text-lg">Seguimientos por Regional en el Tiempo</CardTitle>
            <Select value={feedbackTypeFilter} onValueChange={setFeedbackTypeFilter}>
              <SelectTrigger className="w-[220px]">
                <SelectValue placeholder="Tipo de feedback" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los tipos</SelectItem>
                {FEEDBACK_TYPES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          {chartByRegional.length > 0 ? (
            <ChartContainer config={chartConfig} className="h-[350px] w-full">
              <BarChart data={chartByRegional}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" fontSize={12} />
                <YAxis />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Legend />
                {(selectedRegional !== "all" ? [selectedRegional] : allRegionals).map((r, i) => (
                  <Bar key={r} dataKey={r} fill={chartColors[i % chartColors.length]} stackId="a" />
                ))}
              </BarChart>
            </ChartContainer>
          ) : (
            <p className="text-center text-muted-foreground py-8">No hay datos para el filtro seleccionado.</p>
          )}
        </CardContent>
      </Card>

      {/* Member chart when regional is selected */}
      {selectedRegional !== "all" && memberChartData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Desempeño por Miembro — {selectedRegional}</CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer config={memberChartConfig} className="h-[350px] w-full">
              <LineChart data={memberChartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" fontSize={12} />
                <YAxis domain={[0, 5]} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Legend />
                {memberNames.map((name, i) => (
                  <Line key={name} type="monotone" dataKey={name} stroke={chartColors[i % chartColors.length]} strokeWidth={2} dot />
                ))}
              </LineChart>
            </ChartContainer>
          </CardContent>
        </Card>
      )}

      {/* Top / Bottom Executives */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between flex-wrap gap-3">
            <CardTitle className="text-lg">
              {showTopPerformers ? "🏆 Top 10 Mejor Desempeño" : "⚠️ Top 10 Menor Desempeño"}
            </CardTitle>
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Menor</span>
              <Switch checked={showTopPerformers} onCheckedChange={setShowTopPerformers} />
              <span className="text-sm text-muted-foreground">Mejor</span>
            </div>
          </div>
        </CardHeader>
        <CardContent className="overflow-auto">
          {executiveRanking.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-8">#</TableHead>
                  <TableHead>Ejecutivo</TableHead>
                  <TableHead>Regional</TableHead>
                  <TableHead className="text-center">Calificación</TableHead>
                  <TableHead className="text-center">Seguimientos</TableHead>
                  <TableHead className="text-center">Último Seguimiento</TableHead>
                  <TableHead>Observaciones Clave</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {executiveRanking.map((exec, i) => (
                  <TableRow key={exec.email}>
                    <TableCell className="font-bold text-muted-foreground">{i + 1}</TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium">{exec.name}</p>
                        <p className="text-xs text-muted-foreground">{exec.email}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{exec.regional}</Badge>
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge variant={exec.avgScore >= 3.5 ? "default" : exec.avgScore >= 2.5 ? "secondary" : "destructive"}>
                        {exec.avgScore > 0 ? exec.avgScore.toFixed(1) : "-"} / 5
                      </Badge>
                    </TableCell>
                    <TableCell className="text-center font-medium">{exec.count}</TableCell>
                    <TableCell className="text-center text-sm">{formatDate(exec.lastDate)}</TableCell>
                    <TableCell className="max-w-[250px]">
                      {exec.observations.length > 0 ? (
                        <p className="text-xs text-muted-foreground line-clamp-2">{exec.observations[exec.observations.length - 1]}</p>
                      ) : (
                        <span className="text-xs text-muted-foreground">—</span>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <p className="text-center text-muted-foreground py-4">No hay suficientes datos para el ranking.</p>
          )}
        </CardContent>
      </Card>

      {/* Diagnostics & Recommendations */}
      {(diagnostics.alerts.length > 0 || diagnostics.recommendations.length > 0) && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">📊 Diagnóstico y Recomendaciones</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {diagnostics.alerts.length > 0 && (
              <div className="space-y-2">
                <p className="font-medium text-sm text-destructive">Alertas</p>
                {diagnostics.alerts.map((a, i) => (
                  <div key={i} className="p-3 rounded-lg border border-destructive/30 bg-destructive/5 text-sm">{a}</div>
                ))}
              </div>
            )}
            {diagnostics.recommendations.length > 0 && (
              <div className="space-y-2">
                <p className="font-medium text-sm text-primary">Recomendaciones</p>
                {diagnostics.recommendations.map((r, i) => (
                  <div key={i} className="p-3 rounded-lg border border-primary/30 bg-primary/5 text-sm">{r}</div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};
