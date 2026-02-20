import React from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  DollarSign,
  Lock,
  LockOpen,
  Target,
  TrendingUp,
  Trophy,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Eye,
} from "lucide-react";
import { cn } from "@/lib/utils";

const formatCOP = (value: number) =>
  new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);

const MOCK_EXECUTIVES = [
  {
    name: "Carlos Martínez",
    email: "cmartinez@addi.com",
    firmasMeta: 120, firmasReal: 108, 
    origMeta: 85000000, origReal: 92000000,
    gmvMeta: 45000, gmvReal: 41000,
    baseComisional: 1500000,
    status: "approved" as const,
  },
  {
    name: "Laura Gómez",
    email: "lgomez@addi.com",
    firmasMeta: 120, firmasReal: 135,
    origMeta: 85000000, origReal: 98000000,
    gmvMeta: 45000, gmvReal: 52000,
    baseComisional: 1500000,
    status: "approved" as const,
  },
  {
    name: "Andrés Restrepo",
    email: "arestrepo@addi.com",
    firmasMeta: 120, firmasReal: 95,
    origMeta: 85000000, origReal: 70000000,
    gmvMeta: 45000, gmvReal: 35000,
    baseComisional: 1500000,
    status: "pending" as const,
  },
  {
    name: "María Torres",
    email: "mtorres@addi.com",
    firmasMeta: 120, firmasReal: 60,
    origMeta: 85000000, origReal: 45000000,
    gmvMeta: 45000, gmvReal: 20000,
    baseComisional: 1500000,
    status: "rejected" as const,
  },
];

export const DemoFieldSalesCommissions: React.FC = () => {
  return (
    <div className="space-y-6">
      <Alert className="border-primary/30 bg-primary/5">
        <Eye className="h-4 w-4" />
        <AlertDescription>
          <strong>Modo Demo:</strong> Estos son datos ficticios de ejemplo. No afectan los datos reales del sistema.
        </AlertDescription>
      </Alert>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Target className="h-4 w-4" />
              Total Ejecutivos
            </div>
            <p className="text-2xl font-bold mt-1">4</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <CheckCircle className="h-4 w-4 text-emerald-500" />
              Aprobadas
            </div>
            <p className="text-2xl font-bold mt-1 text-emerald-600">2</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <AlertTriangle className="h-4 w-4 text-amber-500" />
              Pendientes
            </div>
            <p className="text-2xl font-bold mt-1 text-amber-600">1</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <XCircle className="h-4 w-4 text-destructive" />
              Rechazadas
            </div>
            <p className="text-2xl font-bold mt-1 text-destructive">1</p>
          </CardContent>
        </Card>
      </div>

      {/* Executive Cards */}
      {MOCK_EXECUTIVES.map((exec) => {
        const firmasPct = (exec.firmasReal / exec.firmasMeta) * 100;
        const origPct = (exec.origReal / exec.origMeta) * 100;
        const gmvPct = (exec.gmvReal / exec.gmvMeta) * 100;
        const candado = firmasPct >= 85;
        const indicadorPonderado = (origPct * 0.5 + gmvPct * 0.5);
        const comision = (indicadorPonderado / 100) * exec.baseComisional;

        return (
          <Card key={exec.email} className="overflow-hidden">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg">{exec.name}</CardTitle>
                  <CardDescription>{exec.email}</CardDescription>
                </div>
                <Badge
                  variant={exec.status === "approved" ? "default" : exec.status === "rejected" ? "destructive" : "secondary"}
                  className={exec.status === "approved" ? "bg-emerald-500" : ""}
                >
                  {exec.status === "approved" ? "Aprobada" : exec.status === "rejected" ? "Rechazada" : "Pendiente"}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Firmas / Candado */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-1.5">
                    {candado ? (
                      <LockOpen className="h-4 w-4 text-emerald-500" />
                    ) : (
                      <Lock className="h-4 w-4 text-destructive" />
                    )}
                    Firmas: {exec.firmasReal}/{exec.firmasMeta}
                  </span>
                  <span className={cn("font-semibold", candado ? "text-emerald-600" : "text-destructive")}>
                    {firmasPct.toFixed(1)}%
                  </span>
                </div>
                <Progress value={Math.min(firmasPct, 100)} className="h-2" />
              </div>

              <Separator />

              {/* Indicators */}
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Originaciones</p>
                  <p className="font-semibold">{origPct.toFixed(1)}% <span className="text-xs text-muted-foreground">(×50%)</span></p>
                </div>
                <div>
                  <p className="text-muted-foreground">GMV (USD)</p>
                  <p className="font-semibold">{gmvPct.toFixed(1)}% <span className="text-xs text-muted-foreground">(×50%)</span></p>
                </div>
              </div>

              <Separator />

              {/* Total */}
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-2 text-sm font-medium">
                  <DollarSign className="h-4 w-4" />
                  Comisión Calculada
                </span>
                <span className="text-lg font-bold text-primary">
                  {formatCOP(candado ? comision : 0)}
                </span>
              </div>

              {!candado && (
                <p className="text-xs text-destructive">
                  ⚠️ No aplica a comisión por no alcanzar el 85% del candado de firmas
                </p>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};
