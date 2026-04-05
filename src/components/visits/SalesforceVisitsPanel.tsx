import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { MapPin, RefreshCw, TrendingUp, Users, Calendar, AlertCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface VisitRecord {
  sfUserId: string;
  name: string;
  email: string;
  visitsByDay: Record<string, number>;
  activitiesByDay: Record<string, number>;
  totalVisits: number;
  totalActivities: number;
}

interface SalesforceVisitsPanelProps {
  days?: number;
  showHeader?: boolean;
}

const REGION_MAP: Record<string, string> = {
  "005UJ000007wcgnYAA": "Ant. y Centro",
  "005UJ000008LPMzYAO": "Bogotá Norte",
  "005UJ000004cU1BYAU": "Bogotá Sur",
  "005UJ000006ZZ2gYAG": "Eje Cafetero",
  "005UJ000008BS9FYAW": "Nororiente",
  "005UJ000007NDbdYAG": "Suroccidente",
};

export const SalesforceVisitsPanel: React.FC<SalesforceVisitsPanelProps> = ({
  days = 7,
  showHeader = true,
}) => {
  const [data, setData] = useState<VisitRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchVisits = async () => {
    setLoading(true);
    setError(null);
    try {
      const { data: result, error: fnError } = await supabase.functions.invoke(
        "salesforce-visits",
        { body: { days } },
      );

      if (fnError) throw fnError;
      if (result?.data) {
        setData(result.data);
        setLastUpdated(new Date());
      }
    } catch (err: any) {
      const msg = err?.message || "Error al obtener visitas de Salesforce";
      setError(msg);
      toast({ title: "Error SF", description: msg, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVisits();
  }, [days]);

  // Get last N days for columns
  const getDayLabels = () => {
    const labels: string[] = [];
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date(Date.now() - i * 86400000);
      labels.push(d.toISOString().split("T")[0]);
    }
    return labels;
  };

  const dayLabels = getDayLabels();

  // Group by region (using supervisors)
  const regionGroups: Record<string, VisitRecord[]> = {};
  for (const record of data) {
    const region = REGION_MAP[record.sfUserId] || "Equipo";
    if (!regionGroups[region]) regionGroups[region] = [];
    regionGroups[region].push(record);
  }

  const totalVisitsAll = data.reduce((s, r) => s + r.totalVisits, 0);
  const totalActivitiesAll = data.reduce((s, r) => s + r.totalActivities, 0);
  const avgVisitsPerPerson = data.length > 0 ? Math.round(totalVisitsAll / data.length) : 0;

  return (
    <div className="space-y-4">
      {showHeader && (
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <MapPin className="h-5 w-5 text-[#ff6b35]" />
            <h2 className="text-xl font-bold text-gray-900">Visitas Field Sales</h2>
            <Badge variant="outline" className="text-xs">
              Últimos {days} días
            </Badge>
          </div>
          <div className="flex items-center gap-2">
            {lastUpdated && (
              <span className="text-xs text-gray-500">
                Act. {lastUpdated.toLocaleTimeString("es-CO", { hour: "2-digit", minute: "2-digit" })}
              </span>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={fetchVisits}
              disabled={loading}
              className="gap-2"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
              Actualizar
            </Button>
          </div>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-3 gap-4">
        <Card className="border-l-4 border-l-[#ff6b35]">
          <CardContent className="pt-4 pb-3">
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-[#ff6b35]" />
              <span className="text-xs text-gray-500">Total Visitas</span>
            </div>
            <p className="text-2xl font-bold mt-1">
              {loading ? <Skeleton className="h-7 w-16" /> : totalVisitsAll}
            </p>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-blue-500">
          <CardContent className="pt-4 pb-3">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-blue-500" />
              <span className="text-xs text-gray-500">Actividades</span>
            </div>
            <p className="text-2xl font-bold mt-1">
              {loading ? <Skeleton className="h-7 w-16" /> : totalActivitiesAll}
            </p>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-green-500">
          <CardContent className="pt-4 pb-3">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-green-500" />
              <span className="text-xs text-gray-500">Prom. por Hunter</span>
            </div>
            <p className="text-2xl font-bold mt-1">
              {loading ? <Skeleton className="h-7 w-16" /> : avgVisitsPerPerson}
            </p>
          </CardContent>
        </Card>
      </div>

      {error && (
        <Card className="border-orange-200 bg-orange-50">
          <CardContent className="pt-4 pb-3 flex items-center gap-2 text-orange-700">
            <AlertCircle className="h-4 w-4 flex-shrink-0" />
            <p className="text-sm">{error}</p>
          </CardContent>
        </Card>
      )}

      {/* Visit table by region */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-16 w-full rounded-lg" />
          ))}
        </div>
      ) : (
        Object.entries(regionGroups).map(([region, members]) => (
          <Card key={region}>
            <CardHeader className="py-3 px-4 bg-gray-50 rounded-t-lg">
              <CardTitle className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                <MapPin className="h-4 w-4 text-[#ff6b35]" />
                {region}
                <Badge variant="secondary" className="ml-auto text-xs">
                  {members.reduce((s, m) => s + m.totalVisits, 0)} visitas
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-gray-50/50">
                      <th className="text-left py-2 px-4 font-medium text-gray-600 min-w-[160px]">
                        Hunter
                      </th>
                      {dayLabels.map((d) => (
                        <th key={d} className="text-center py-2 px-2 font-medium text-gray-500 text-xs min-w-[40px]">
                          {new Date(d + "T12:00:00").toLocaleDateString("es-CO", {
                            weekday: "short",
                            day: "numeric",
                          })}
                        </th>
                      ))}
                      <th className="text-center py-2 px-3 font-medium text-gray-700 min-w-[60px]">
                        Total
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {members.map((member) => {
                      const total = member.totalVisits;
                      const isGood = total >= days * 0.8;
                      const isLow = total < days * 0.3;
                      return (
                        <tr key={member.sfUserId} className="border-b hover:bg-gray-50 transition-colors">
                          <td className="py-2 px-4">
                            <div>
                              <p className="font-medium text-gray-900 text-xs leading-tight">
                                {member.name.split(" ").slice(0, 2).join(" ")}
                              </p>
                              <p className="text-xs text-gray-400">{member.email.split("@")[0]}</p>
                            </div>
                          </td>
                          {dayLabels.map((d) => {
                            const count = member.visitsByDay[d] || 0;
                            return (
                              <td key={d} className="text-center py-2 px-2">
                                {count > 0 ? (
                                  <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-green-100 text-green-700 text-xs font-bold">
                                    {count}
                                  </span>
                                ) : (
                                  <span className="text-gray-300 text-xs">–</span>
                                )}
                              </td>
                            );
                          })}
                          <td className="text-center py-2 px-3">
                            <span
                              className={`inline-flex items-center justify-center px-2 py-1 rounded-full text-xs font-bold ${
                                isGood
                                  ? "bg-green-100 text-green-700"
                                  : isLow
                                  ? "bg-red-100 text-red-700"
                                  : "bg-yellow-100 text-yellow-700"
                              }`}
                            >
                              {total}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        ))
      )}

      {!loading && data.length === 0 && !error && (
        <Card className="border-dashed">
          <CardContent className="py-8 text-center">
            <Calendar className="h-8 w-8 text-gray-300 mx-auto mb-2" />
            <p className="text-gray-500 text-sm">No se encontraron visitas registradas en Salesforce</p>
            <p className="text-gray-400 text-xs mt-1">
              Verifica que las actividades de tipo "Visita" estén registradas en SF
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default SalesforceVisitsPanel;
