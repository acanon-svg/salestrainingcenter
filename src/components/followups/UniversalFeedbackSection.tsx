import React, { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useAuth } from "@/contexts/AuthContext";
import { useUniversalFeedback, FollowupUniversalFeedback } from "@/hooks/useFollowups";
import { Loader2, FileText, Target, TrendingUp, CheckCircle, AlertTriangle } from "lucide-react";

const FEEDBACK_TYPES = ["Feedback 1-1", "Feedback Recurrente", "Feedback de Oportunidad", "PDP Inicial", "Seguimiento al PDP", "Resultado del PDP"];

const TYPE_COLORS: Record<string, string> = {
  "Feedback 1-1": "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
  "Feedback Recurrente": "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
  "Feedback de Oportunidad": "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200",
  "PDP Inicial": "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
  "Seguimiento al PDP": "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200",
  "Resultado del PDP": "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
};

const TYPE_ICONS: Record<string, React.ElementType> = {
  "Feedback 1-1": FileText,
  "Feedback Recurrente": FileText,
  "Feedback de Oportunidad": AlertTriangle,
  "PDP Inicial": Target,
  "Seguimiento al PDP": TrendingUp,
  "Resultado del PDP": CheckCircle,
};

const formatDate = (ts: string) => {
  const d = new Date(ts);
  return d.toLocaleDateString("es-CO", { day: "2-digit", month: "short", year: "numeric" });
};

const FeedbackCard: React.FC<{ item: FollowupUniversalFeedback }> = ({ item }) => {
  const Icon = TYPE_ICONS[item.feedback_type] || FileText;
  const colorClass = TYPE_COLORS[item.feedback_type] || "bg-muted text-muted-foreground";

  const renderFields = () => {
    if (["Feedback 1-1", "Feedback Recurrente", "Feedback de Oportunidad"].includes(item.feedback_type)) {
      return (
        <div className="space-y-3 text-sm">
          {item.hecho_observado && <div><span className="font-medium">Hecho observado:</span><p className="mt-1 text-muted-foreground whitespace-pre-wrap">{item.hecho_observado}</p></div>}
          {item.regla_metrica && <div><span className="font-medium">Regla/Métrica:</span><p className="mt-1 text-muted-foreground">{item.regla_metrica}</p></div>}
          {item.expectativa_clara && <div><span className="font-medium">Expectativa:</span><p className="mt-1 text-muted-foreground whitespace-pre-wrap">{item.expectativa_clara}</p></div>}
          {item.compromiso_colega && <div><span className="font-medium">Compromiso:</span><p className="mt-1 text-muted-foreground whitespace-pre-wrap">{item.compromiso_colega}</p></div>}
          {item.proxima_fecha_revision && <div><span className="font-medium">Próxima revisión:</span> <span className="text-muted-foreground">{item.proxima_fecha_revision}</span></div>}
        </div>
      );
    }
    if (["PDP Inicial", "PDP"].includes(item.feedback_type)) {
      return (
        <div className="space-y-3 text-sm">
          {item.diagnostico_desempeno && <div><span className="font-medium">Diagnóstico:</span><p className="mt-1 text-muted-foreground whitespace-pre-wrap">{item.diagnostico_desempeno}</p></div>}
          {item.objetivo_metrica_exito && <div><span className="font-medium">Objetivo:</span><p className="mt-1 text-muted-foreground whitespace-pre-wrap">{item.objetivo_metrica_exito}</p></div>}
          {item.plan_accion_semanas && <div><span className="font-medium">Plan de Acción:</span><p className="mt-1 text-muted-foreground whitespace-pre-wrap">{item.plan_accion_semanas}</p></div>}
        </div>
      );
    }
    return (
      <div className="space-y-3 text-sm">
        {item.oportunidades_trabajar && <div><span className="font-medium">Oportunidades:</span><p className="mt-1 text-muted-foreground whitespace-pre-wrap">{item.oportunidades_trabajar}</p></div>}
        {item.compromiso_seguimiento && <div><span className="font-medium">Compromiso:</span><p className="mt-1 text-muted-foreground whitespace-pre-wrap">{item.compromiso_seguimiento}</p></div>}
      </div>
    );
  };

  return (
    <div className="relative pl-8 pb-6 border-l-2 border-muted last:border-l-0">
      <div className="absolute -left-3 top-0">
        <div className={`w-6 h-6 rounded-full flex items-center justify-center ${colorClass}`}>
          <Icon className="h-3 w-3" />
        </div>
      </div>
      <div className="space-y-2">
        <div className="flex items-center gap-2 flex-wrap">
          <Badge className={colorClass}>{item.feedback_type}</Badge>
          <span className="text-xs text-muted-foreground">{formatDate(item.timestamp)}</span>
        </div>
        {renderFields()}
      </div>
    </div>
  );
};

const StudentFeedbackView: React.FC<{ data: FollowupUniversalFeedback[] }> = ({ data }) => {
  const [typeFilter, setTypeFilter] = useState("all");
  const filteredData = useMemo(() => typeFilter === "all" ? data : data.filter(d => d.feedback_type === typeFilter), [data, typeFilter]);
  const typeCounts = useMemo(() => {
    const c: Record<string, number> = {};
    data.forEach(d => { c[d.feedback_type] = (c[d.feedback_type] || 0) + 1; });
    return c;
  }, [data]);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {FEEDBACK_TYPES.map(type => (
          <Card key={type} className={`cursor-pointer transition-all ${typeFilter === type ? "ring-2 ring-primary" : ""}`}
            onClick={() => setTypeFilter(typeFilter === type ? "all" : type)}>
            <CardContent className="p-3 text-center">
              <p className="text-2xl font-bold">{typeCounts[type] || 0}</p>
              <p className="text-xs text-muted-foreground">{type}</p>
            </CardContent>
          </Card>
        ))}
      </div>
      <Card>
        <CardHeader><CardTitle className="text-lg">Historial de Feedback</CardTitle></CardHeader>
        <CardContent>
          {filteredData.length === 0 ? (
            <p className="text-center text-muted-foreground py-4">No hay feedbacks registrados.</p>
          ) : (
            <div className="space-y-2">{filteredData.map(item => <FeedbackCard key={item.id} item={item} />)}</div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export const UniversalFeedbackSection: React.FC = () => {
  const { data, isLoading } = useUniversalFeedback();
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

  const executives = useMemo(() => [...new Set(filteredByRegional.map(d => `${d.executive_name}|${d.executive_email}`))].sort(), [filteredByRegional]);
  const finalData = useMemo(() => {
    if (selectedExec === "all") return filteredByRegional;
    return filteredByRegional.filter(d => d.executive_email === selectedExec.split("|")[1]);
  }, [filteredByRegional, selectedExec]);

  if (isLoading) return <div className="flex items-center justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>;
  if (!data || data.length === 0) return <Card><CardContent className="py-8 text-center text-muted-foreground">No hay datos de feedback universal.</CardContent></Card>;
  if (!isLeaderOrAbove) return <StudentFeedbackView data={finalData} />;

  // Macro view
  if (isMacroUser) {
    const weeklyByRegional: Record<string, Record<string, Record<string, number>>> = {};
    data.forEach(item => {
      const d = new Date(item.timestamp);
      const ws = new Date(d); ws.setDate(d.getDate() - d.getDay());
      const wk = ws.toISOString().split("T")[0];
      if (!weeklyByRegional[item.regional]) weeklyByRegional[item.regional] = {};
      if (!weeklyByRegional[item.regional][wk]) weeklyByRegional[item.regional][wk] = {};
      weeklyByRegional[item.regional][wk][item.feedback_type] = (weeklyByRegional[item.regional][wk][item.feedback_type] || 0) + 1;
    });
    const allWeeks = [...new Set(Object.values(weeklyByRegional).flatMap(wm => Object.keys(wm)))].sort();

    return (
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
                  {allWeeks.map(w => {
                    const types = weeklyByRegional[reg]?.[w] || {};
                    const total = Object.values(types).reduce((s, v) => s + v, 0);
                    return (
                      <TableCell key={w} className="text-center">
                        <div className="flex flex-col items-center gap-0.5">
                          <span className="font-bold">{total}</span>
                          <div className="flex gap-0.5 flex-wrap justify-center">
                            {Object.entries(types).map(([type, count]) => (
                              <span key={type} className={`text-[9px] px-1 rounded ${TYPE_COLORS[type] || ""}`}>{count}</span>
                            ))}
                          </div>
                        </div>
                      </TableCell>
                    );
                  })}
                </TableRow>
              ))}
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
        <StudentFeedbackView data={finalData} />
      ) : (
        <Card>
          <CardHeader><CardTitle className="text-lg">Ejecutivos</CardTitle></CardHeader>
          <CardContent>
            <div className="grid gap-2">
              {executives.map(e => {
                const [name, email] = e.split("|");
                const execData = filteredByRegional.filter(d => d.executive_email === email);
                const typesSummary = execData.reduce((acc, d) => { acc[d.feedback_type] = (acc[d.feedback_type] || 0) + 1; return acc; }, {} as Record<string, number>);
                return (
                  <div key={e} className="flex items-center justify-between p-3 border rounded-lg cursor-pointer hover:bg-accent/50"
                    onClick={() => setSelectedExec(e)}>
                    <div>
                      <p className="font-medium">{name}</p>
                      <p className="text-xs text-muted-foreground">{email} · {execData.length} feedbacks</p>
                    </div>
                    <div className="flex gap-1 flex-wrap">
                      {Object.entries(typesSummary).map(([type, count]) => (
                        <Badge key={type} className={`text-[10px] ${TYPE_COLORS[type] || ""}`}>{count}</Badge>
                      ))}
                    </div>
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
