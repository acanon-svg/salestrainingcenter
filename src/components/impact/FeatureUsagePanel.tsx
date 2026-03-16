import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Download, AlertTriangle } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from "recharts";
import type { FeatureUsageStat } from "@/hooks/useImpactDashboardData";

interface Props {
  featureStats: FeatureUsageStat[];
  last7days: string[];
  totalActiveUsers: number;
  onExport: () => void;
}

export const FeatureUsagePanel: React.FC<Props> = ({ featureStats, last7days, totalActiveUsers, onExport }) => {
  const deadFeatures = featureStats.filter(f => f.is_dead);

  const barData = featureStats.map(f => ({
    name: f.feature_label,
    uses: f.total_uses,
    pct: f.pct_active_users,
    isDead: f.is_dead,
  }));

  // Trend data for line chart
  const trendData = last7days.map((day, i) => {
    const entry: Record<string, any> = { day: day.substring(5) }; // MM-DD
    featureStats.slice(0, 6).forEach(f => {
      entry[f.feature_key] = f.trend_7d[i] || 0;
    });
    return entry;
  });

  const trendColors = [
    "hsl(var(--primary))",
    "hsl(var(--chart-2))",
    "hsl(var(--chart-3))",
    "hsl(var(--chart-4))",
    "hsl(var(--chart-5))",
    "hsl(var(--destructive))",
  ];

  return (
    <div className="space-y-4">
      {/* Dead features callout */}
      {deadFeatures.length > 0 && (
        <Card className="border-destructive/30 bg-destructive/5">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-destructive mt-0.5" />
              <div>
                <p className="font-semibold text-destructive">
                  {deadFeatures.length} funcionalidad{deadFeatures.length > 1 ? "es" : ""} con baja adopción
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  Usadas por menos del 20% de usuarios activos en los últimos 30 días:
                </p>
                <div className="flex flex-wrap gap-2 mt-2">
                  {deadFeatures.map(f => (
                    <Badge key={f.feature_key} variant="destructive" className="text-xs">
                      {f.feature_label} ({f.pct_active_users}%)
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Ranked bar chart */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-base">Uso por Funcionalidad</CardTitle>
          <Button variant="outline" size="sm" onClick={onExport}>
            <Download className="h-4 w-4 mr-1" /> CSV
          </Button>
        </CardHeader>
        <CardContent>
          <div className="h-[400px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={barData} layout="vertical" margin={{ top: 5, right: 30, left: 120, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" className="opacity-30" horizontal={false} />
                <XAxis type="number" />
                <YAxis dataKey="name" type="category" width={110} tick={{ fontSize: 12 }} />
                <Tooltip
                  content={({ payload }) => {
                    if (!payload?.length) return null;
                    const d = payload[0]?.payload;
                    return (
                      <div className="bg-popover border rounded-lg p-3 shadow-lg text-sm">
                        <p className="font-medium">{d.name}</p>
                        <p>Total usos: {d.uses.toLocaleString()}</p>
                        <p>{d.pct}% de usuarios activos</p>
                      </div>
                    );
                  }}
                />
                <Bar
                  dataKey="uses"
                  fill="hsl(var(--primary))"
                  radius={[0, 4, 4, 0]}
                  barSize={20}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* 7-day trend */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Tendencia 7 días (Top 6 funcionalidades)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trendData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                <XAxis dataKey="day" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip />
                {featureStats.slice(0, 6).map((f, i) => (
                  <Line
                    key={f.feature_key}
                    dataKey={f.feature_key}
                    name={f.feature_label}
                    stroke={trendColors[i]}
                    strokeWidth={2}
                    dot={false}
                  />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </div>
          <div className="flex flex-wrap gap-3 mt-2 justify-center">
            {featureStats.slice(0, 6).map((f, i) => (
              <div key={f.feature_key} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: trendColors[i] }} />
                {f.feature_label}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
