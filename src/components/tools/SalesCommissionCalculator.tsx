import React, { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import { 
  Calculator, 
  DollarSign, 
  Percent, 
  Lock, 
  LockOpen, 
  AlertTriangle,
  Target,
  TrendingUp,
  Trophy,
  Sparkles
} from "lucide-react";
import { CommissionCalculatorConfig } from "@/hooks/useCommissionCalculatorConfig";
import { useMonthlyConfigForMonth, getMonthName } from "@/hooks/useCommissionMonthlyConfig";
import { MonthSelector } from "./MonthSelector";
import { cn } from "@/lib/utils";

interface SalesCommissionCalculatorProps {
  config: CommissionCalculatorConfig;
  userRole: "student" | "lider" | "admin" | "creator";
}

export const SalesCommissionCalculator: React.FC<SalesCommissionCalculatorProps> = ({
  config,
  userRole,
}) => {
  // Current month/year for default selection
  const currentMonth = new Date().getMonth() + 1;
  const currentYear = new Date().getFullYear();

  // Month selector state
  const [selectedMonth, setSelectedMonth] = useState(currentMonth);
  const [selectedYear, setSelectedYear] = useState(currentYear);

  // Input values (editable by student/leader)
  const [firmasReales, setFirmasReales] = useState<number>(0);
  const [originacionesReales, setOriginacionesReales] = useState<number>(0);
  const [gmvReal, setGmvReal] = useState<number>(0);

  const isCreatorOrAdmin = userRole === "admin" || userRole === "creator";

  // Fetch monthly config if available
  const { data: monthlyConfig } = useMonthlyConfigForMonth(config.id, selectedMonth, selectedYear);

  // Use monthly config if available, otherwise use base config
  const effectiveConfig = useMemo(() => {
    if (monthlyConfig) {
      return {
        meta_firmas: monthlyConfig.meta_firmas,
        meta_originaciones: monthlyConfig.meta_originaciones,
        meta_gmv_usd: monthlyConfig.meta_gmv_usd,
        base_comisional: monthlyConfig.base_comisional,
      };
    }
    return {
      meta_firmas: config.meta_firmas,
      meta_originaciones: config.meta_originaciones,
      meta_gmv_usd: config.meta_gmv_usd,
      base_comisional: config.base_comisional,
    };
  }, [monthlyConfig, config]);

  // Calculate percentages and results
  const calculations = useMemo(() => {
    // Variable 1: Firmas (Candado de apertura)
    const porcentajeFirmas = effectiveConfig.meta_firmas > 0 
      ? (firmasReales / effectiveConfig.meta_firmas) * 100 
      : 0;
    const candadoDesbloqueado = porcentajeFirmas >= 85;

    // Variable 2: Originaciones (50% participación)
    const porcentajeOriginaciones = effectiveConfig.meta_originaciones > 0 
      ? (originacionesReales / effectiveConfig.meta_originaciones) * 100 
      : 0;
    const participacionOriginaciones = porcentajeOriginaciones * 0.5;

    // Variable 3: GMV (50% participación)
    const porcentajeGMV = effectiveConfig.meta_gmv_usd > 0 
      ? (gmvReal / effectiveConfig.meta_gmv_usd) * 100 
      : 0;
    const participacionGMV = porcentajeGMV * 0.5;

    // Total commission calculation
    const porcentajeTotal = participacionOriginaciones + participacionGMV;
    const comisionTotal = (porcentajeTotal / 100) * effectiveConfig.base_comisional;

    return {
      porcentajeFirmas,
      candadoDesbloqueado,
      porcentajeOriginaciones,
      participacionOriginaciones,
      porcentajeGMV,
      participacionGMV,
      porcentajeTotal,
      comisionTotal,
    };
  }, [firmasReales, originacionesReales, gmvReal, effectiveConfig]);

  const getCommissionMessage = () => {
    const { comisionTotal, candadoDesbloqueado } = calculations;
    
    if (!candadoDesbloqueado) {
      return {
        icon: <AlertTriangle className="h-6 w-6" />,
        message: "⚠️ Recuerda que no has desbloqueado el candado de apertura. Aunque puedes ver tu comisión proyectada, debes alcanzar el 85% de firmas para aplicar a la bonificación.",
        bgClass: "bg-destructive/10 border-destructive/30",
        textClass: "text-destructive",
      };
    }

    if (comisionTotal < 1200000) {
      return {
        icon: <TrendingUp className="h-6 w-6" />,
        message: "💪 ¡Ánimo! Tienes todo el potencial para lograr mejores resultados. Enfócate en tus metas y verás cómo tu esfuerzo se transforma en grandes logros. ¡Tú puedes!",
        bgClass: "bg-amber-500/10 border-amber-500/30",
        textClass: "text-amber-600",
      };
    }

    if (comisionTotal >= 1200000 && comisionTotal <= 1500000) {
      return {
        icon: <Target className="h-6 w-6" />,
        message: "🔥 ¡Estás muy cerca! No bajes la guardia, estás a punto de alcanzar tu meta. Un último esfuerzo y lo conseguirás. ¡Sigue así!",
        bgClass: "bg-primary/10 border-primary/30",
        textClass: "text-primary",
      };
    }

    return {
      icon: <Trophy className="h-6 w-6" />,
      message: "🎉 ¡Felicitaciones! Has hecho un trabajo excepcional. Has superado las expectativas y demostrado un desempeño sobresaliente. ¡Pero no te detengas, aún puedes lograr mucho más!",
      bgClass: "bg-emerald-500/10 border-emerald-500/30",
      textClass: "text-emerald-600",
    };
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("es-CO", {
      style: "currency",
      currency: "COP",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const formatCurrencyUSD = (value: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const commissionMessage = getCommissionMessage();

  return (
    <div className="space-y-6">
      {/* Month Selector - Only for students and leaders */}
      {!isCreatorOrAdmin && (
        <MonthSelector
          selectedMonth={selectedMonth}
          selectedYear={selectedYear}
          onMonthChange={setSelectedMonth}
          onYearChange={setSelectedYear}
        />
      )}

      {/* Configuration Info */}
      <Card className="border-muted">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Calculator className="h-5 w-5" />
                {config.name}
              </CardTitle>
              {config.description && (
                <CardDescription>{config.description}</CardDescription>
              )}
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              {!isCreatorOrAdmin && (
                <Badge variant="secondary">
                  {getMonthName(selectedMonth)} {selectedYear}
                </Badge>
              )}
              <Badge variant="outline">
                Base: {formatCurrency(effectiveConfig.base_comisional)}
              </Badge>
              {monthlyConfig && !isCreatorOrAdmin && (
                <Badge variant="default" className="bg-emerald-500">
                  Metas del mes
                </Badge>
              )}
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Variable 1: Firmas - Candado de Apertura */}
      <Card className={cn(
        "transition-all duration-300",
        calculations.candadoDesbloqueado 
          ? "border-emerald-500/50 bg-emerald-500/5" 
          : "border-destructive/50 bg-destructive/5"
      )}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {calculations.candadoDesbloqueado ? (
              <LockOpen className="h-5 w-5 text-emerald-500" />
            ) : (
              <Lock className="h-5 w-5 text-destructive" />
            )}
            Variable 1: Candado de Apertura (Firmas)
          </CardTitle>
          <CardDescription>
            Debes alcanzar mínimo el 85% de la meta de firmas para desbloquear la bonificación
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-3">
            {/* Meta de Firmas */}
            <div className="space-y-2">
              <Label className="text-muted-foreground">Meta de Firmas</Label>
              <div className="flex items-center gap-2">
                <Target className="h-4 w-4 text-muted-foreground" />
                <span className="text-lg font-semibold">{effectiveConfig.meta_firmas}</span>
              </div>
              {isCreatorOrAdmin && (
                <p className="text-xs text-muted-foreground">
                  Configurable desde ajustes
                </p>
              )}
            </div>

            {/* Firmas Reales */}
            <div className="space-y-2">
              <Label htmlFor="firmas-reales">Firmas Realizadas</Label>
              <Input
                id="firmas-reales"
                type="number"
                min={0}
                value={firmasReales}
                onChange={(e) => setFirmasReales(parseInt(e.target.value) || 0)}
                className="font-mono"
              />
            </div>

            {/* Porcentaje de Cumplimiento */}
            <div className="space-y-2">
              <Label className="text-muted-foreground">% Cumplimiento</Label>
              <div className="flex items-center gap-2">
                <Percent className="h-4 w-4 text-muted-foreground" />
                <span className={cn(
                  "text-lg font-bold",
                  calculations.candadoDesbloqueado ? "text-emerald-600" : "text-destructive"
                )}>
                  {calculations.porcentajeFirmas.toFixed(1)}%
                </span>
              </div>
              <Progress 
                value={Math.min(calculations.porcentajeFirmas, 100)} 
                className="h-2"
              />
            </div>
          </div>

          {!calculations.candadoDesbloqueado && (
            <Alert variant="destructive" className="mt-4">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                ⚠️ <strong>Candado de apertura activo:</strong> No aplicas para bonificación. 
                Necesitas alcanzar el 85% de firmas ({Math.ceil(effectiveConfig.meta_firmas * 0.85)} firmas).
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Variable 2: Originaciones */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5 text-primary" />
            Variable 2: Originaciones
            <Badge variant="secondary" className="ml-2">50% participación</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {/* Meta de Originaciones */}
            <div className="space-y-2">
              <Label className="text-muted-foreground">Meta del Mes</Label>
              <div className="flex items-center gap-2">
                <Target className="h-4 w-4 text-muted-foreground" />
                <span className="text-lg font-semibold">
                  {effectiveConfig.meta_originaciones.toLocaleString("es-CO")}
                </span>
              </div>
            </div>

            {/* Originaciones Reales */}
            <div className="space-y-2">
              <Label htmlFor="originaciones-reales">Valor Real</Label>
              <Input
                id="originaciones-reales"
                type="number"
                min={0}
                value={originacionesReales}
                onChange={(e) => setOriginacionesReales(parseFloat(e.target.value) || 0)}
                className="font-mono"
              />
            </div>

            {/* Porcentaje de Ejecución */}
            <div className="space-y-2">
              <Label className="text-muted-foreground">% Ejecución</Label>
              <div className="flex items-center gap-2">
                <Percent className="h-4 w-4 text-muted-foreground" />
                <span className="text-lg font-bold text-primary">
                  {calculations.porcentajeOriginaciones.toFixed(1)}%
                </span>
              </div>
            </div>

            {/* Resultado con Participación */}
            <div className="space-y-2">
              <Label className="text-muted-foreground">Resultado (×50%)</Label>
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-amber-500" />
                <span className="text-lg font-bold text-amber-600">
                  {calculations.participacionOriginaciones.toFixed(2)}%
                </span>
              </div>
            </div>
          </div>
          <Progress 
            value={Math.min(calculations.porcentajeOriginaciones, 100)} 
            className="h-2"
          />
        </CardContent>
      </Card>

      {/* Variable 3: GMV */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5 text-primary" />
            Variable 3: GMV (USD)
            <Badge variant="secondary" className="ml-2">50% participación</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {/* Meta de GMV */}
            <div className="space-y-2">
              <Label className="text-muted-foreground">Meta del Mes (USD)</Label>
              <div className="flex items-center gap-2">
                <Target className="h-4 w-4 text-muted-foreground" />
                <span className="text-lg font-semibold">
                  {formatCurrencyUSD(effectiveConfig.meta_gmv_usd)}
                </span>
              </div>
            </div>

            {/* GMV Real */}
            <div className="space-y-2">
              <Label htmlFor="gmv-real">Valor Real (USD)</Label>
              <Input
                id="gmv-real"
                type="number"
                min={0}
                step={0.01}
                value={gmvReal}
                onChange={(e) => setGmvReal(parseFloat(e.target.value) || 0)}
                className="font-mono"
              />
            </div>

            {/* Porcentaje de Ejecución */}
            <div className="space-y-2">
              <Label className="text-muted-foreground">% Ejecución</Label>
              <div className="flex items-center gap-2">
                <Percent className="h-4 w-4 text-muted-foreground" />
                <span className="text-lg font-bold text-primary">
                  {calculations.porcentajeGMV.toFixed(1)}%
                </span>
              </div>
            </div>

            {/* Resultado con Participación */}
            <div className="space-y-2">
              <Label className="text-muted-foreground">Resultado (×50%)</Label>
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-amber-500" />
                <span className="text-lg font-bold text-amber-600">
                  {calculations.participacionGMV.toFixed(2)}%
                </span>
              </div>
            </div>
          </div>
          <Progress 
            value={Math.min(calculations.porcentajeGMV, 100)} 
            className="h-2"
          />
        </CardContent>
      </Card>

      <Separator />

      {/* Final Commission Result */}
      <Card className={cn(
        "border-2 transition-all duration-300",
        commissionMessage.bgClass
      )}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-xl">
            <Trophy className="h-6 w-6" />
            Resultado Final de Comisión
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-3">
            {/* Porcentaje Total */}
            <div className="text-center p-4 rounded-lg bg-background border">
              <p className="text-sm text-muted-foreground mb-1">% Total Ejecución</p>
              <p className="text-3xl font-bold text-primary">
                {calculations.porcentajeTotal.toFixed(2)}%
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Originaciones + GMV
              </p>
            </div>

            {/* Base Comisional */}
            <div className="text-center p-4 rounded-lg bg-background border">
              <p className="text-sm text-muted-foreground mb-1">Base Comisional</p>
              <p className="text-3xl font-bold">
                {formatCurrency(effectiveConfig.base_comisional)}
              </p>
            </div>

            {/* Comisión Total */}
            <div className={cn(
              "text-center p-4 rounded-lg border-2",
              calculations.comisionTotal >= 1500000 
                ? "bg-emerald-500/20 border-emerald-500" 
                : calculations.comisionTotal >= 1200000 
                  ? "bg-primary/20 border-primary" 
                  : "bg-amber-500/20 border-amber-500"
            )}>
              <p className="text-sm text-muted-foreground mb-1">Tu Comisión</p>
              <p className={cn(
                "text-3xl font-bold",
                calculations.comisionTotal >= 1500000 
                  ? "text-emerald-600" 
                  : calculations.comisionTotal >= 1200000 
                    ? "text-primary" 
                    : "text-amber-600"
              )}>
                {formatCurrency(calculations.comisionTotal)}
              </p>
            </div>
          </div>

          {/* Message based on performance */}
          <div className={cn(
            "flex items-start gap-3 p-4 rounded-lg border",
            commissionMessage.bgClass
          )}>
            <div className={commissionMessage.textClass}>
              {commissionMessage.icon}
            </div>
            <p className={cn("text-sm", commissionMessage.textClass)}>
              {commissionMessage.message}
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
