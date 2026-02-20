import React, { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useAuth } from "@/contexts/AuthContext";
import { useQualityEvaluations, FollowupQualityEvaluation } from "@/hooks/useFollowups";
import { useLeaderTeamEmails } from "@/hooks/useLeaderTeamEmails";
import { Loader2, CheckCircle2, XCircle, GraduationCap } from "lucide-react";
import { RecommendCourseDialog } from "./RecommendCourseDialog";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Legend } from "recharts";

const formatDate = (ts: string) => {
  const d = new Date(ts);
  return d.toLocaleDateString("es-CO", { day: "2-digit", month: "short", year: "numeric" });
};

const BoolCell: React.FC<{ value: boolean | null }> = ({ value }) => {
  if (value === null || value === undefined) return <span className="text-muted-foreground">-</span>;
  return value ? <CheckCircle2 className="h-4 w-4 text-green-600 mx-auto" /> : <XCircle className="h-4 w-4 text-red-500 mx-auto" />;
};

const StudentQualityView: React.FC<{ data: FollowupQualityEvaluation[] }> = ({ data }) => {
  const chartData = useMemo(() => data.map(d => ({ date: formatDate(d.timestamp), score: d.score_numeric ?? 0 })), [data]);
  const chartConfig = { score: { label: "Puntuación", color: "#8b5cf6" } };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader><CardTitle className="text-lg">Evolución de Puntuación de Calidad</CardTitle></CardHeader>
        <CardContent>
          {chartData.length > 0 ? (
            <ChartContainer config={chartConfig} className="h-[300px] w-full">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" fontSize={12} />
                <YAxis domain={[0, 100]} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Legend />
                <Line type="monotone" dataKey="score" stroke="#8b5cf6" strokeWidth={2} dot name="Puntuación" />
              </LineChart>
            </ChartContainer>
          ) : (
            <p className="text-center text-muted-foreground py-8">No hay evaluaciones.</p>
          )}
        </CardContent>
      </Card>
      {data.map(evalItem => (
        <Card key={evalItem.id}>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">{formatDate(evalItem.timestamp)}</CardTitle>
              <Badge variant={(evalItem.score_numeric ?? 0) >= 90 ? "default" : (evalItem.score_numeric ?? 0) >= 70 ? "secondary" : "destructive"}>
                {evalItem.score || "N/A"}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-sm">
              <div className="flex items-center gap-2"><BoolCell value={evalItem.info_comercial_correcta} /><span>Info comercial correcta</span></div>
              <div className="flex items-center gap-2"><BoolCell value={evalItem.formatos_slug_correctos} /><span>Formatos slug correctos</span></div>
              <div className="flex items-center gap-2"><BoolCell value={evalItem.flujo_salesforce_correcto} /><span>Flujo SF correcto</span></div>
              <div className="flex items-center gap-2"><BoolCell value={evalItem.bot_actualizacion_correos} /><span>Bot actualización</span></div>
              <div className="flex items-center gap-2"><BoolCell value={evalItem.valida_duplicidad_sf} /><span>Valida duplicidad SF</span></div>
              <div className="flex items-center gap-2"><BoolCell value={evalItem.documentos_completos} /><span>Documentos completos</span></div>
              <div className="flex items-center gap-2"><BoolCell value={evalItem.red_social_correcta} /><span>Red social correcta</span></div>
              <div className="flex items-center gap-2"><BoolCell value={evalItem.fotos_correctas_primer_intento} /><span>Fotos primer intento</span></div>
              <div className="flex items-center gap-2"><BoolCell value={evalItem.cumple_requisitos_activacion} /><span>Requisitos activación</span></div>
              <div className="flex items-center gap-2"><BoolCell value={evalItem.gestion_tyc_oportuna} /><span>Gestión T&C oportuna</span></div>
            </div>
            {evalItem.recomendacion_compromisos && (
              <div className="text-sm">
                <span className="font-medium">Recomendación:</span>
                <p className="text-muted-foreground mt-1 whitespace-pre-wrap">{evalItem.recomendacion_compromisos}</p>
              </div>
            )}
            {evalItem.slug_monitoreado && <p className="text-xs text-muted-foreground">Slug: {evalItem.slug_monitoreado}</p>}
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export const QualitySection: React.FC = () => {
  const { data, isLoading } = useQualityEvaluations();
  const { profile, hasRole } = useAuth();
  const { data: teamEmails } = useLeaderTeamEmails();
  const [selectedLeader, setSelectedLeader] = useState<string>("all");
  const [selectedHunter, setSelectedHunter] = useState<string>("all");
  const [recommendOpen, setRecommendOpen] = useState(false);

  const isLeaderOrAbove = hasRole("lider") || hasRole("creator") || hasRole("admin");
  const isCreatorOrAdmin = hasRole("creator") || hasRole("admin");
  const isMacroUser = profile?.email === "staborda@addi.com";

  const teamFilteredData = useMemo(() => {
    if (!data) return [];
    if (!isLeaderOrAbove) return data.filter(d => d.hunter_email === profile?.email);
    if (isCreatorOrAdmin || isMacroUser) return data;
    if (!teamEmails) return [];
    return data.filter(d => d.leader_email && teamEmails.has(d.leader_email));
  }, [data, isLeaderOrAbove, isCreatorOrAdmin, isMacroUser, profile?.email, teamEmails]);

  const leaders = useMemo(() => [...new Set(teamFilteredData.map(d => d.leader_email).filter(Boolean))].sort() as string[], [teamFilteredData]);
  const filteredByLeader = useMemo(() => {
    if (!isLeaderOrAbove) return teamFilteredData;
    if (selectedLeader === "all") return teamFilteredData;
    return teamFilteredData.filter(d => d.leader_email === selectedLeader);
  }, [teamFilteredData, isLeaderOrAbove, selectedLeader]);

  const hunters = useMemo(() => [...new Set(filteredByLeader.map(d => `${d.hunter_name}|${d.hunter_email}`))].sort(), [filteredByLeader]);
  const finalData = useMemo(() => {
    if (selectedHunter === "all") return filteredByLeader;
    return filteredByLeader.filter(d => d.hunter_email === selectedHunter.split("|")[1]);
  }, [filteredByLeader, selectedHunter]);

  // Team quality summary
  const teamSummary = useMemo(() => {
    if (teamFilteredData.length === 0) return null;
    const total = teamFilteredData.length;
    const avgScore = teamFilteredData.reduce((s, e) => s + (e.score_numeric || 0), 0) / total;
    const excellent = teamFilteredData.filter(e => (e.score_numeric || 0) >= 90).length;
    const good = teamFilteredData.filter(e => (e.score_numeric || 0) >= 70 && (e.score_numeric || 0) < 90).length;
    const needsWork = teamFilteredData.filter(e => (e.score_numeric || 0) < 70).length;
    return { total, avgScore, excellent, good, needsWork };
  }, [teamFilteredData]);

  // Regional/leader breakdown for creators/staborda
  const leaderBreakdown = useMemo(() => {
    if (!isCreatorOrAdmin && !isMacroUser) return [];
    const byLeader: Record<string, { count: number; avgScore: number; scores: number[] }> = {};
    teamFilteredData.forEach(d => {
      const k = d.leader_email || "Sin líder";
      if (!byLeader[k]) byLeader[k] = { count: 0, avgScore: 0, scores: [] };
      byLeader[k].count++;
      byLeader[k].scores.push(d.score_numeric || 0);
    });
    return Object.entries(byLeader).map(([leader, info]) => ({
      leader,
      count: info.count,
      avgScore: info.scores.reduce((a, b) => a + b, 0) / info.scores.length,
    })).sort((a, b) => a.leader.localeCompare(b.leader));
  }, [teamFilteredData, isCreatorOrAdmin, isMacroUser]);

  if (isLoading) return <div className="flex items-center justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>;
  if (!data || data.length === 0) return <Card><CardContent className="py-8 text-center text-muted-foreground">No hay evaluaciones de calidad.</CardContent></Card>;
  if (!isLeaderOrAbove) return <StudentQualityView data={finalData} />;

  const QualitySummaryCards = () => {
    if (!teamSummary) return null;
    return (
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <Card>
          <CardContent className="p-3 text-center">
            <p className="text-2xl font-bold">{teamSummary.total}</p>
            <p className="text-xs text-muted-foreground">Total Evaluaciones</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 text-center">
            <p className="text-2xl font-bold">{teamSummary.avgScore.toFixed(0)}</p>
            <p className="text-xs text-muted-foreground">Promedio General</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 text-center">
            <p className="text-2xl font-bold text-green-600">{teamSummary.excellent}</p>
            <p className="text-xs text-muted-foreground">Excelente (≥90)</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 text-center">
            <p className="text-2xl font-bold text-amber-600">{teamSummary.good}</p>
            <p className="text-xs text-muted-foreground">Bueno (70-89)</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 text-center">
            <p className="text-2xl font-bold text-red-600">{teamSummary.needsWork}</p>
            <p className="text-xs text-muted-foreground">Por mejorar (&lt;70)</p>
          </CardContent>
        </Card>
      </div>
    );
  };

  // Macro view / Creator view
  if (isMacroUser || isCreatorOrAdmin) {
    return (
      <div className="space-y-4">
        <QualitySummaryCards />
        <Card>
          <CardHeader><CardTitle className="text-lg">Calidad por Líder / Regional</CardTitle></CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Líder</TableHead>
                  <TableHead className="text-center">Evaluaciones</TableHead>
                  <TableHead className="text-center">Promedio</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {leaderBreakdown.map(({ leader, count, avgScore }) => (
                  <TableRow key={leader}>
                    <TableCell className="font-medium">{leader}</TableCell>
                    <TableCell className="text-center">{count}</TableCell>
                    <TableCell className="text-center">
                      <Badge variant={avgScore >= 90 ? "default" : avgScore >= 70 ? "secondary" : "destructive"}>{avgScore.toFixed(0)} / 100</Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Leader view
  return (
    <div className="space-y-4">
      <QualitySummaryCards />
      <div className="flex gap-4 flex-wrap">
        <Select value={selectedLeader} onValueChange={(v) => { setSelectedLeader(v); setSelectedHunter("all"); }}>
          <SelectTrigger className="w-[260px]"><SelectValue placeholder="Líder" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos los líderes</SelectItem>
            {leaders.map(l => <SelectItem key={l} value={l}>{l}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={selectedHunter} onValueChange={setSelectedHunter}>
          <SelectTrigger className="w-[260px]"><SelectValue placeholder="Hunter" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos los hunters</SelectItem>
            {hunters.map(h => <SelectItem key={h} value={h}>{h.split("|")[0]}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>
      {selectedHunter !== "all" ? (
        <>
          <div className="flex justify-end">
            <Button variant="outline" size="sm" onClick={() => setRecommendOpen(true)}>
              <GraduationCap className="h-4 w-4 mr-2" />
              Recomendar Curso
            </Button>
            <RecommendCourseDialog
              open={recommendOpen}
              onOpenChange={setRecommendOpen}
              executiveEmail={selectedHunter.split("|")[1]}
              executiveName={selectedHunter.split("|")[0]}
            />
          </div>
          <StudentQualityView data={finalData} />
        </>
      ) : (
        <Card>
          <CardHeader><CardTitle className="text-lg">Hunters</CardTitle></CardHeader>
          <CardContent>
            <div className="grid gap-2">
              {hunters.map(h => {
                const [name, email] = h.split("|");
                const hData = filteredByLeader.filter(d => d.hunter_email === email);
                const avg = hData.reduce((s, e) => s + (e.score_numeric || 0), 0) / (hData.length || 1);
                return (
                  <div key={h} className="flex items-center justify-between p-3 border rounded-lg cursor-pointer hover:bg-accent/50"
                    onClick={() => setSelectedHunter(h)}>
                    <div>
                      <p className="font-medium">{name}</p>
                      <p className="text-xs text-muted-foreground">{email} · {hData.length} evaluaciones</p>
                    </div>
                    <Badge variant={avg >= 90 ? "default" : avg >= 70 ? "secondary" : "destructive"}>{avg.toFixed(0)} / 100</Badge>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
