import React, { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/AuthContext";
import { useAccompaniments, FollowupAccompaniment } from "@/hooks/useFollowups";
import { Loader2 } from "lucide-react";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Legend } from "recharts";

const COMPETENCIES = [
  "¿El abordaje que realiza el ejecutivo en calle es el adecuado?",
  "¿El ejecutivo usa el pitch comercial ajustado a cada aliado?",
  "¿El ejecutivo es claro en todo el proceso de negociación?",
  "¿Aborda al aliado con conocimiento y confianza del producto y la marca?",
  "¿El ejecutivo transforma las objeciones en oportunidades de cierre?",
  "¿El ejecutivo optimiza su zona, barriendo adecuadamente el lugar?",
];

const COMP_KEYS = [
  "comp_abordaje", "comp_pitch_comercial", "comp_claridad_negociacion",
  "comp_conocimiento_confianza", "comp_objeciones_cierre", "comp_optimiza_zona",
] as const;

const craftToNum = (v: string | null) => {
  if (!v) return 0;
  const match = v.match(/A(\d)/);
  return match ? parseInt(match[1]) : 0;
};

const formatDate = (ts: string) => {
  const d = new Date(ts);
  return d.toLocaleDateString("es-CO", { day: "2-digit", month: "short", year: "numeric" });
};

const StudentAccompanimentView: React.FC<{ data: FollowupAccompaniment[] }> = ({ data }) => {
  const [craftFilter, setCraftFilter] = useState("all");

  const chartData = useMemo(() => data.map((item) => ({
    date: formatDate(item.timestamp),
    negociacion: craftToNum(item.craft_negociacion),
    objeciones: craftToNum(item.craft_manejo_objeciones),
    persuasion: craftToNum(item.craft_persuasion),
    herramientas: craftToNum(item.craft_herramientas),
    conocimiento: craftToNum(item.craft_conocimiento_productos),
  })), [data]);

  const chartConfig = {
    negociacion: { label: "Negociación", color: "#8b5cf6" },
    objeciones: { label: "Manejo de Objeciones", color: "#f59e0b" },
    persuasion: { label: "Persuasión", color: "#10b981" },
    herramientas: { label: "Herramientas", color: "#3b82f6" },
    conocimiento: { label: "Conocimiento Productos", color: "#ef4444" },
  };

  const visibleCrafts = craftFilter === "all" ? Object.keys(chartConfig) : [craftFilter];

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">Evolución de Crafts</CardTitle>
            <Select value={craftFilter} onValueChange={setCraftFilter}>
              <SelectTrigger className="w-[220px]"><SelectValue placeholder="Filtrar craft" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los Crafts</SelectItem>
                <SelectItem value="negociacion">Negociación</SelectItem>
                <SelectItem value="objeciones">Manejo de Objeciones</SelectItem>
                <SelectItem value="persuasion">Persuasión</SelectItem>
                <SelectItem value="herramientas">Herramientas</SelectItem>
                <SelectItem value="conocimiento">Conocimiento Productos</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          {chartData.length > 0 ? (
            <ChartContainer config={chartConfig} className="h-[300px] w-full">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" fontSize={12} />
                <YAxis domain={[0, 4]} ticks={[0, 1, 2, 3, 4]} tickFormatter={(v) => `A${v}`} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Legend />
                {visibleCrafts.includes("negociacion") && <Line type="monotone" dataKey="negociacion" stroke="#8b5cf6" name="Negociación" strokeWidth={2} dot />}
                {visibleCrafts.includes("objeciones") && <Line type="monotone" dataKey="objeciones" stroke="#f59e0b" name="Manejo de Objeciones" strokeWidth={2} dot />}
                {visibleCrafts.includes("persuasion") && <Line type="monotone" dataKey="persuasion" stroke="#10b981" name="Persuasión" strokeWidth={2} dot />}
                {visibleCrafts.includes("herramientas") && <Line type="monotone" dataKey="herramientas" stroke="#3b82f6" name="Herramientas" strokeWidth={2} dot />}
                {visibleCrafts.includes("conocimiento") && <Line type="monotone" dataKey="conocimiento" stroke="#ef4444" name="Conocimiento Productos" strokeWidth={2} dot />}
              </LineChart>
            </ChartContainer>
          ) : (
            <p className="text-center text-muted-foreground py-8">No hay datos de acompañamientos.</p>
          )}
        </CardContent>
      </Card>

      {data.length > 0 && (
        <Card>
          <CardHeader><CardTitle className="text-lg">Competencias por Sesión</CardTitle></CardHeader>
          <CardContent className="overflow-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="min-w-[300px]">Competencia</TableHead>
                  {data.map((item, i) => (
                    <TableHead key={i} className="text-center min-w-[120px]">{formatDate(item.timestamp)}</TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {COMPETENCIES.map((comp, ci) => (
                  <TableRow key={ci}>
                    <TableCell className="text-sm">{comp}</TableCell>
                    {data.map((item, i) => {
                      const val = item[COMP_KEYS[ci] as keyof FollowupAccompaniment] as number | null;
                      return (
                        <TableCell key={i} className="text-center">
                          <Badge variant={val && val >= 4 ? "default" : val && val >= 3 ? "secondary" : "destructive"}>
                            {val ?? "-"} / 5
                          </Badge>
                        </TableCell>
                      );
                    })}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {data.length > 0 && (
        <Card>
          <CardHeader><CardTitle className="text-lg">Oportunidades y Observaciones</CardTitle></CardHeader>
          <CardContent className="overflow-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="min-w-[300px]">Dimensión</TableHead>
                  {data.map((item, i) => (
                    <TableHead key={i} className="text-center min-w-[200px]">{formatDate(item.timestamp)}</TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow>
                  <TableCell className="font-medium text-sm">Oportunidades de entrenamiento/calidad</TableCell>
                  {data.map((item, i) => (
                    <TableCell key={i} className="text-sm whitespace-pre-wrap max-w-[300px]">{item.oportunidades_entrenamiento || "-"}</TableCell>
                  ))}
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium text-sm">Observaciones del acompañamiento</TableCell>
                  {data.map((item, i) => (
                    <TableCell key={i} className="text-sm whitespace-pre-wrap max-w-[300px]">{item.observaciones || "-"}</TableCell>
                  ))}
                </TableRow>
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export const AccompanimentsSection: React.FC = () => {
  const { data, isLoading } = useAccompaniments();
  const { profile, hasRole } = useAuth();
  const [selectedRegional, setSelectedRegional] = useState<string>("all");
  const [selectedExec, setSelectedExec] = useState<string>("all");

  const isLeaderOrAbove = hasRole("lider") || hasRole("creator") || hasRole("admin");
  const isMacroUser = profile?.email === "staborda@addi.com";

  const regionals = useMemo(() => [...new Set((data || []).map(d => d.regional))].sort(), [data]);
  const filteredByRegional = useMemo(() => {
    if (!data) return [];
    if (!isLeaderOrAbove) return data.filter(d => d.executive_email === profile?.email);
    if (selectedRegional === "all") return data;
    return data.filter(d => d.regional === selectedRegional);
  }, [data, isLeaderOrAbove, profile?.email, selectedRegional]);

  const executives = useMemo(() => {
    return [...new Set(filteredByRegional.map(d => `${d.executive_name}|${d.executive_email}`))].sort();
  }, [filteredByRegional]);

  const finalData = useMemo(() => {
    if (selectedExec === "all") return filteredByRegional;
    const email = selectedExec.split("|")[1];
    return filteredByRegional.filter(d => d.executive_email === email);
  }, [filteredByRegional, selectedExec]);

  if (isLoading) {
    return <div className="flex items-center justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>;
  }

  if (!data || data.length === 0) {
    return <Card><CardContent className="py-8 text-center text-muted-foreground">No hay datos de acompañamientos. Solicita una sincronización a tu administrador.</CardContent></Card>;
  }

  // Student view
  if (!isLeaderOrAbove) {
    return <StudentAccompanimentView data={finalData} />;
  }

  // Macro view for staborda
  if (isMacroUser) {
    const weeklyByRegional: Record<string, Record<string, number>> = {};
    data.forEach(item => {
      const d = new Date(item.timestamp);
      const weekStart = new Date(d);
      weekStart.setDate(d.getDate() - d.getDay());
      const weekKey = weekStart.toISOString().split("T")[0];
      if (!weeklyByRegional[item.regional]) weeklyByRegional[item.regional] = {};
      weeklyByRegional[item.regional][weekKey] = (weeklyByRegional[item.regional][weekKey] || 0) + 1;
    });
    const allWeeks = [...new Set(Object.values(weeklyByRegional).flatMap(wm => Object.keys(wm)))].sort();

    const lowestCraftRegionals = (() => {
      const avgByRegional: Record<string, { total: number; count: number }> = {};
      data.forEach(item => {
        const crafts = [item.craft_negociacion, item.craft_manejo_objeciones, item.craft_persuasion, item.craft_herramientas, item.craft_conocimiento_productos];
        const avg = crafts.reduce((s, c) => s + craftToNum(c), 0) / crafts.length;
        if (!avgByRegional[item.regional]) avgByRegional[item.regional] = { total: 0, count: 0 };
        avgByRegional[item.regional].total += avg;
        avgByRegional[item.regional].count++;
      });
      return Object.entries(avgByRegional).map(([regional, { total, count }]) => ({ regional, avg: total / count })).sort((a, b) => a.avg - b.avg);
    })();

    return (
      <div className="space-y-6">
        <Card>
          <CardHeader><CardTitle className="text-lg">Feedbacks por Regional (semanal)</CardTitle></CardHeader>
          <CardContent className="overflow-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Regional</TableHead>
                  {allWeeks.map(w => <TableHead key={w} className="text-center text-xs">Sem {w}</TableHead>)}
                </TableRow>
              </TableHeader>
              <TableBody>
                {Object.keys(weeklyByRegional).sort().map(reg => (
                  <TableRow key={reg}>
                    <TableCell className="font-medium">{reg}</TableCell>
                    {allWeeks.map(w => <TableCell key={w} className="text-center">{weeklyByRegional[reg]?.[w] || 0}</TableCell>)}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="text-lg">Regionales con Crafts más bajos</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-3">
              {lowestCraftRegionals.map(({ regional, avg }) => (
                <div key={regional} className="flex items-center justify-between p-3 rounded-lg border">
                  <span className="font-medium">{regional}</span>
                  <Badge variant={avg < 1.5 ? "destructive" : avg < 2.5 ? "secondary" : "default"}>Promedio: A{avg.toFixed(1)}</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Leader view
  return (
    <div className="space-y-4">
      <div className="flex gap-4 flex-wrap">
        <Select value={selectedRegional} onValueChange={(v) => { setSelectedRegional(v); setSelectedExec("all"); }}>
          <SelectTrigger className="w-[200px]"><SelectValue placeholder="Regional" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas las regionales</SelectItem>
            {regionals.map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={selectedExec} onValueChange={setSelectedExec}>
          <SelectTrigger className="w-[260px]"><SelectValue placeholder="Ejecutivo" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos los ejecutivos</SelectItem>
            {executives.map(e => <SelectItem key={e} value={e}>{e.split("|")[0]}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {selectedExec !== "all" ? (
        <StudentAccompanimentView data={finalData} />
      ) : (
        <Card>
          <CardHeader><CardTitle className="text-lg">Selecciona un ejecutivo</CardTitle></CardHeader>
          <CardContent>
            <div className="grid gap-2">
              {executives.map(e => {
                const [name, email] = e.split("|");
                const execData = filteredByRegional.filter(d => d.executive_email === email);
                const avgCraft = execData.reduce((s, d) => {
                  const crafts = [d.craft_negociacion, d.craft_manejo_objeciones, d.craft_persuasion, d.craft_herramientas, d.craft_conocimiento_productos];
                  return s + crafts.reduce((ss, c) => ss + craftToNum(c), 0) / 5;
                }, 0) / (execData.length || 1);
                return (
                  <div key={e} className="flex items-center justify-between p-3 border rounded-lg cursor-pointer hover:bg-accent/50"
                    onClick={() => setSelectedExec(e)}>
                    <div>
                      <p className="font-medium">{name}</p>
                      <p className="text-xs text-muted-foreground">{email} · {execData.length} acompañamientos</p>
                    </div>
                    <Badge variant={avgCraft < 1.5 ? "destructive" : avgCraft < 2.5 ? "secondary" : "default"}>A{avgCraft.toFixed(1)}</Badge>
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
