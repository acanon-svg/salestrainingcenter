import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line, CartesianGrid } from "recharts";
import { TrendingUp, RefreshCw, ExternalLink, AlertCircle, Database, Clock } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface ProductivityMetrics {
  totalLeads?: number | null;
  leadsConvertidos?: number | null;
  tasaConversion?: number | null;
  visitasRealizadas?: number | null;
  tiempoPromedioEtapas?: number | null;
  pipelineValor?: number | null;
  periodo�: string | null;
  [key: string]: any;
}

interface DatabricksData {
  source: string;
  message?: string;
  metrics?: ProductivityMetrics;
  [key: string]: any;
}

const DATABRICKS_URL =
  "https://dbc-1e362619-07d3.cloud.databricks.com/dashboardsv3/01f05cda99261c0590d2e43f7d512415/published/pages/0f44cc90?o=7726698426071309&f_0f44cc90%7Ef8611e37=ferrelectricosrojass-online";

interface DatabricksPanelProps {
  showHeader?: boolean;
  compact?: boolean;
}

export const DatabricksPanel: React.FC<DatabricksPanelProps> = ({
  showHeader = true,
  compact = false,
}) => {
  const [data, setData] = useState<DatabricksData | null>(null);
  const [loading, setLoading] = useState(false);
  const [cached, setCached] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const { toast } = useToast();

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const { data: result, error: fnError } = await supabase.functions.invoke(
        "databricks-productivity",
      );

      if (fnError) throw fnError;
      if (result?.data) {
        setData(result.data);
        setCached(result.cached || false);
        setLastUpdated(new Date());
      }
    } catch (err: any) {
      const msg = err?.message || "Error al obtener datos de Databricks";
      setError(msg);
      toast({ title: "Error Databricks", description: msg, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const isUnavailable = data?.source === "unavailable";
  const metrics = data?.metrics || {};

  const formatNumber = (n: number | null | undefined) => {
    if (n == null) return "—";
    return n.toLocaleString("es-CO");
  };

  const formatPct = (n: number | null | undefined) => {
    if (n == null) return "—";
    return `${n.toFixed(1)}%`;
  };

  const kpis = [
    {
      label: "Total Leads",
      value: formatNumber(metrics.totalLeads),
      icon: Database,
      color: "text-blue-600",
      bg: "bg-blue-50",
      border: "border-l-blue-500",
    },
    {
      label: "Leads Convertidos",
      value: formatNumber(metrics.leadsConvertidos),
      icon: TrendingUp,
      color: "text-green-600",
      bg: "bg-green-50",
      border: "border-l-green-500",
    },
    {
      label: "Tasa Conversión",
      value: formatPct(metrics.tasaConversion),
      icon: TrendingUp,
      color: "text-[#ff6b35]",
      bg: "bg-orange-50",
      border: "border-l-[#ff6b35]",
    },
    {
      label: "Tiempo Prom. Etapas",
      value: metrics.tiempoPromedioEtapas ? `${metrics.tiempoPromedioEtapas} días` : "—",
      icon: Clock,
      color: "text-purple-600",
      bg: "bg-purple-50",
      border: "border-l-purple-500",
    },
  ];

  return (
    <div className="space-y-4">
      {showHeader && (
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Database className="h-5 w-5 text-[#ff6b35]" />
            <h2 className="text-xl font-bold text-gray-900">Productividad del Equipo</h2>
            {cached && (
              <Badge variant="outline" className="text-xs text-gray-400">
                En caché
              </Badge>
            )}
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
              onClick={fetchData}
              disabled={loading}
              className="gap-2"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
              Actualizar
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => window.open(DATABRICKS_URL, "_blank")}
              className="gap-2"
            >
              <ExternalLink className="h-4 w-4" />
              Ver en Databricks
            </Button>
          </div>
        </div>
      )}

      {/* Unavailable warning */}
      {isUnavailable && (
        <Card className="border-orange-200 bg-orange-50">
          <CardContent className="pt-4 pb-3 flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-orange-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-orange-800">Dashboard no accesible</p>
              <p className="text-xs text-orange-700 mt-0.5">{data?.message}</p>
              <Button
                variant="link"
                size="sm"
                className="h-auto p-0 text-orange-700 text-xs mt-1"
                onClick={() => window.open(DATABRICKS_URL, "_blank")}
              >
                Abrir dashboard directamente →
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* KPI Cards */}
      {!compact && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {kpis.map(({ label, value, icon: Icon, color, bg, border }) => (
            <Card key={label} className={`border-l-4 ${border}`}>
              <CardContent className="pt-4 pb-3">
                <div className={`flex items-center gap-2 ${bg} rounded-md p-1.5 w-fit mb-2`}>
                  <Icon className={`h-4 w-4 ${color}`} />
                </div>
                <p className="text-xs text-gray-500 mb-0.5">{label}</p>
                <p className="text-2xl font-bold text-gray-900">
                  {loading ? <Skeleton className="h-7 w-16" /> : value}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Embed Dashboard iframe */}
      <Card>
        <CardHeader className="py-3 px-4">
          <CardTitle className="text-sm font-semibold text-gray-700 flex items-center gap-2">
            <Database className="h-4 w-4 text-[#ff6b35]" />
            Dashboard de Productividad — Databricks
            <Badge variant="secondary" className="ml-auto text-xs">Live</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="relative w-full" style={{ height: "500px" }}>
            <iframe
              src={DATABRICKS_URL}
              className="w-full h-full border-0 rounded-b-lg"
              title="Dashboard Productividad Databricks"
              sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
              loading="lazy"
            />
            <div className="absolute bottom-3 right-3">
              <Button
                size="sm"
                variant="secondary"
                onClick={() => window.open(DATABRICKS_URL, "_blank")}
                className="gap-2 text-xs shadow-md"
              >
                <ExternalLink className="h-3 w-3" />
                Abrir en pestaña
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {error && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-3 pb-3 flex items-center gap-2 text-red-700">
            <AlertCircle className="h-4 w-4 flex-shrink-0" />
            <p className="text-sm">{error}</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default DatabricksPanel;
