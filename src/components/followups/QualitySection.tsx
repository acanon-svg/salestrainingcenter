import React, { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useAuth } from "@/contexts/AuthContext";
import { useQualityEvaluations, FollowupQualityEvaluation } from "@/hooks/useFollowups";
import { Loader2, CheckCircle2, XCircle } from "lucide-react";
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
  const [selectedLeader, setSelectedLeader] = useState<string>("all");
  const [selectedHunter, setSelectedHunter] = useState<string>("all");

  const isLeaderOrAbove = hasRole("lider") || hasRole("creator") || hasRole("admin");
  const isMacroUser = profile?.email === "staborda@addi.com";

  const leaders = useMemo(() => [...new Set((data || []).map(d => d.leader_email).filter(Boolean))].sort() as string[], [data]);
  const filteredByLeader = useMemo(() => {
    if (!data) return [];
    if (!isLeaderOrAbove) return data.filter(d => d.hunter_email === profile?.email);
    if (selectedLeader === "all") return data;
    return data.filter(d => d.leader_email === selectedLeader);
  }, [data, isLeaderOrAbove, profile?.email, selectedLeader]);

  const hunters = useMemo(() => [...new Set(filteredByLeader.map(d => `${d.hunter_name}|${d.hunter_email}`))].sort(), [filteredByLeader]);
  const finalData = useMemo(() => {
    if (selectedHunter === "all") return filteredByLeader;
    return filteredByLeader.filter(d => d.hunter_email === selectedHunter.split("|")[1]);
  }, [filteredByLeader, selectedHunter]);

  if (isLoading) return <div className="flex items-center justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>;
  if (!data || data.length === 0) return <Card><CardContent className="py-8 text-center text-muted-foreground">No hay evaluaciones de calidad.</CardContent></Card>;
  if (!isLeaderOrAbove) return <StudentQualityView data={finalData} />;

  // Macro view
  if (isMacroUser) {
    const byLeader: Record<string, FollowupQualityEvaluation[]> = {};
    data.forEach(d => {
      const k = d.leader_email || "Sin líder";
      if (!byLeader[k]) byLeader[k] = [];
      byLeader[k].push(d);
    });

    return (
      <Card>
        <CardHeader><CardTitle className="text-lg">Evaluaciones de Calidad por Líder</CardTitle></CardHeader>
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
              {Object.entries(byLeader).sort().map(([leader, evals]) => {
                const avg = evals.reduce((s, e) => s + (e.score_numeric || 0), 0) / evals.length;
                return (
                  <TableRow key={leader}>
                    <TableCell className="font-medium">{leader}</TableCell>
                    <TableCell className="text-center">{evals.length}</TableCell>
                    <TableCell className="text-center">
                      <Badge variant={avg >= 90 ? "default" : avg >= 70 ? "secondary" : "destructive"}>{avg.toFixed(0)} / 100</Badge>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    );
  }

  // Leader view
  return (
    <div className="space-y-4">
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
        <StudentQualityView data={finalData} />
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
