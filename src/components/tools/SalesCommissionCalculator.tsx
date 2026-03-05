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
  Sparkles,
  Zap
} from "lucide-react";
import { CommissionCalculatorConfig } from "@/hooks/useCommissionCalculatorConfig";
import { useCommissionAccelerators } from "@/hooks/useCommissionAccelerators";
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
  
  // Fetch accelerators for this config
  const { data: accelerators } = useCommissionAccelerators(config.id);

  // Whether this month uses M0/M1 (March+)
  const usesM1 = selectedMonth >= 3;

  // Use monthly config if available, otherwise use base config
  const effectiveConfig = useMemo(() => {
    if (monthlyConfig) {
      return {
        meta_firmas: monthlyConfig.meta_firmas,
        meta_originaciones: monthlyConfig.meta_originaciones,
        meta_gmv_usd: monthlyConfig.meta_gmv_usd,
        base_comisional: monthlyConfig.base_comisional,
        meta_originaciones_m1: (monthlyConfig as any).meta_originaciones_m1 ?? 0,
        meta_gmv_m1: (monthlyConfig as any).meta_gmv_m1 ?? 0,
      };
    }
    return {
      meta_firmas: config.meta_firmas,
      meta_originaciones: config.meta_originaciones,
      meta_gmv_usd: config.meta_gmv_usd,
      base_comisional: config.base_comisional,
      meta_originaciones_m1: 0,
      meta_gmv_m1: 0,
    };
  }, [monthlyConfig, config]);

  // Calculate percentages and results
  const calculations = useMemo(() => {
    // Variable 1: Firmas (Candado de apertura)
    const porcentajeFirmas = effectiveConfig.meta_firmas > 0 
      ? (firmasReales / effectiveConfig.meta_firmas) * 100 
      : 0;
    const candadoDesbloqueado = porcentajeFirmas >= 85;

    let porcentajeOriginaciones: number;
    let participacionOriginaciones: number;
    let porcentajeGMV: number;
    let participacionGMV: number;
    let porcentajeOriginacionesM1 = 0;
    let participacionOriginacionesM1 = 0;
    let porcentajeGMVM1 = 0;
    let participacionGMVM1 = 0;

    if (usesM1 && (effectiveConfig.meta_originaciones_m1 > 0 || effectiveConfig.meta_gmv_m1 > 0)) {
      // M0/M1: 25% each
      porcentajeOriginaciones = effectiveConfig.meta_originaciones > 0 
        ? (originacionesReales / effectiveConfig.meta_originaciones) * 100 : 0;
      participacionOriginaciones = porcentajeOriginaciones * 0.25;

      porcentajeOriginacionesM1 = effectiveConfig.meta_originaciones_m1 > 0
        ? (originacionesReales / effectiveConfig.meta_originaciones_m1) * 100 : 0;
      participacionOriginacionesM1 = porcentajeOriginacionesM1 * 0.25;

      porcentajeGMV = effectiveConfig.meta_gmv_usd > 0 
        ? (gmvReal / effectiveConfig.meta_gmv_usd) * 100 : 0;
      participacionGMV = porcentajeGMV * 0.25;

      porcentajeGMVM1 = effectiveConfig.meta_gmv_m1 > 0
        ? (gmvReal / effectiveConfig.meta_gmv_m1) * 100 : 0;
      participacionGMVM1 = porcentajeGMVM1 * 0.25;
    } else {
      // Jan/Feb: 50% each
      porcentajeOriginaciones = effectiveConfig.meta_originaciones > 0 
        ? (originacionesReales / effectiveConfig.meta_originaciones) * 100 : 0;
      participacionOriginaciones = porcentajeOriginaciones * 0.5;

      porcentajeGMV = effectiveConfig.meta_gmv_usd > 0 
        ? (gmvReal / effectiveConfig.meta_gmv_usd) * 100 : 0;
      participacionGMV = porcentajeGMV * 0.5;
    }

    // Total commission calculation
    const porcentajeTotal = participacionOriginaciones + participacionGMV + participacionOriginacionesM1 + participacionGMVM1;
    const indicadoresCumplen = porcentajeTotal >= 85;
    const comisionBase = (candadoDesbloqueado && indicadoresCumplen)
      ? (porcentajeTotal / 100) * effectiveConfig.base_comisional
      : 0;

    // Accelerator: applies when weighted total >= 100%
    const acceleratorEligible = porcentajeTotal >= 100;
    let acceleratorBonus = 0;
    let appliedAccelerators: { min_firmas: number; bonus_percentage: number; description: string | null; bonusAmount: number }[] = [];

    if (acceleratorEligible && accelerators && accelerators.length > 0) {
      let bestAccelerator: typeof accelerators[0] | null = null;
      accelerators.forEach((acc) => {
        if (firmasReales >= acc.min_firmas) {
          if (!bestAccelerator || acc.bonus_percentage > bestAccelerator.bonus_percentage) {
            bestAccelerator = acc;
          }
        }
      });

      if (bestAccelerator) {
        const best = bestAccelerator as typeof accelerators[0];
        const bonus = (best.bonus_percentage / 100) * comisionBase;
        acceleratorBonus = bonus;
        appliedAccelerators.push({
          min_firmas: best.min_firmas,
          bonus_percentage: best.bonus_percentage,
          description: best.description,
          bonusAmount: bonus,
        });
      }
    }

    const comisionTotal = comisionBase + acceleratorBonus;

    return {
      porcentajeFirmas,
      candadoDesbloqueado,
      indicadoresCumplen,
      porcentajeOriginaciones,
      participacionOriginaciones,
      porcentajeOriginacionesM1,
      participacionOriginacionesM1,
      porcentajeGMV,
      participacionGMV,
      porcentajeGMVM1,
      participacionGMVM1,
      porcentajeTotal,
      comisionBase,
      comisionTotal,
      acceleratorEligible,
      acceleratorBonus,
      appliedAccelerators,
    };
  }, [firmasReales, originacionesReales, gmvReal, effectiveConfig, accelerators, usesM1]);

  const getCommissionMessage = () => {
    const { comisionTotal, candadoDesbloqueado, indicadoresCumplen } = calculations;
    
    if (!candadoDesbloqueado) {
      return {
        icon: <AlertTriangle className="h-6 w-6" />,
        message: "⚠️ Recuerda que no has desbloqueado el candado de apertura. Debes alcanzar el 85% de firmas para aplicar a la bonificación.",
        bgClass: "bg-destructive/10 border-destructive/30",
        textClass: "text-destructive",
      };
    }

    if (!indicadoresCumplen) {
      return {
        icon: <AlertTriangle className="h-6 w-6" />,
        message: "⚠️ La suma ponderada de Originaciones y GMV no alcanza el 85% mínimo requerido para generar comisión.",
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

      {/* Variable 2: Originaciones M0 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5 text-primary" />
            Variable 2: Originaciones {usesM1 ? 'M0' : ''}
            <Badge variant="secondary" className="ml-2">{usesM1 ? '25%' : '50%'} participación</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="space-y-2">
              <Label className="text-muted-foreground">Meta del Mes</Label>
              <div className="flex items-center gap-2">
                <Target className="h-4 w-4 text-muted-foreground" />
                <span className="text-lg font-semibold">
                  {effectiveConfig.meta_originaciones.toLocaleString("es-CO")}
                </span>
              </div>
            </div>
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
            <div className="space-y-2">
              <Label className="text-muted-foreground">% Ejecución</Label>
              <div className="flex items-center gap-2">
                <Percent className="h-4 w-4 text-muted-foreground" />
                <span className="text-lg font-bold text-primary">
                  {calculations.porcentajeOriginaciones.toFixed(1)}%
                </span>
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-muted-foreground">Resultado (×{usesM1 ? '25' : '50'}%)</Label>
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

      {/* Variable 2b: Originaciones M1 (March+) */}
      {usesM1 && effectiveConfig.meta_originaciones_m1 > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-primary" />
              Variable 2b: Originaciones M1
              <Badge variant="secondary" className="ml-2">25% participación</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div className="space-y-2">
                <Label className="text-muted-foreground">Meta M1</Label>
                <div className="flex items-center gap-2">
                  <Target className="h-4 w-4 text-muted-foreground" />
                  <span className="text-lg font-semibold">
                    {effectiveConfig.meta_originaciones_m1.toLocaleString("es-CO")}
                  </span>
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-muted-foreground">Valor Real</Label>
                <span className="text-lg font-semibold block pt-1">{originacionesReales.toLocaleString("es-CO")}</span>
              </div>
              <div className="space-y-2">
                <Label className="text-muted-foreground">% Ejecución</Label>
                <div className="flex items-center gap-2">
                  <Percent className="h-4 w-4 text-muted-foreground" />
                  <span className="text-lg font-bold text-primary">
                    {calculations.porcentajeOriginacionesM1.toFixed(1)}%
                  </span>
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-muted-foreground">Resultado (×25%)</Label>
                <div className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-amber-500" />
                  <span className="text-lg font-bold text-amber-600">
                    {calculations.participacionOriginacionesM1.toFixed(2)}%
                  </span>
                </div>
              </div>
            </div>
            <Progress 
              value={Math.min(calculations.porcentajeOriginacionesM1, 100)} 
              className="h-2"
            />
          </CardContent>
        </Card>
      )}

      {/* Variable 3: GMV M0 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5 text-primary" />
            Variable 3: GMV (USD) {usesM1 ? 'M0' : ''}
            <Badge variant="secondary" className="ml-2">{usesM1 ? '25%' : '50%'} participación</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="space-y-2">
              <Label className="text-muted-foreground">Meta del Mes (USD)</Label>
              <div className="flex items-center gap-2">
                <Target className="h-4 w-4 text-muted-foreground" />
                <span className="text-lg font-semibold">
                  {formatCurrencyUSD(effectiveConfig.meta_gmv_usd)}
                </span>
              </div>
            </div>
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
            <div className="space-y-2">
              <Label className="text-muted-foreground">% Ejecución</Label>
              <div className="flex items-center gap-2">
                <Percent className="h-4 w-4 text-muted-foreground" />
                <span className="text-lg font-bold text-primary">
                  {calculations.porcentajeGMV.toFixed(1)}%
                </span>
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-muted-foreground">Resultado (×{usesM1 ? '25' : '50'}%)</Label>
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

      {/* Variable 3b: GMV M1 (March+) */}
      {usesM1 && effectiveConfig.meta_gmv_m1 > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-primary" />
              Variable 3b: GMV (USD) M1
              <Badge variant="secondary" className="ml-2">25% participación</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div className="space-y-2">
                <Label className="text-muted-foreground">Meta M1 (USD)</Label>
                <div className="flex items-center gap-2">
                  <Target className="h-4 w-4 text-muted-foreground" />
                  <span className="text-lg font-semibold">
                    {formatCurrencyUSD(effectiveConfig.meta_gmv_m1)}
                  </span>
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-muted-foreground">Valor Real (USD)</Label>
                <span className="text-lg font-semibold block pt-1">{formatCurrencyUSD(gmvReal)}</span>
              </div>
              <div className="space-y-2">
                <Label className="text-muted-foreground">% Ejecución</Label>
                <div className="flex items-center gap-2">
                  <Percent className="h-4 w-4 text-muted-foreground" />
                  <span className="text-lg font-bold text-primary">
                    {calculations.porcentajeGMVM1.toFixed(1)}%
                  </span>
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-muted-foreground">Resultado (×25%)</Label>
                <div className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-amber-500" />
                  <span className="text-lg font-bold text-amber-600">
                    {calculations.participacionGMVM1.toFixed(2)}%
                  </span>
                </div>
              </div>
            </div>
            <Progress 
              value={Math.min(calculations.porcentajeGMVM1, 100)} 
              className="h-2"
            />
          </CardContent>
        </Card>
      )}

      {/* Accelerators Section */}
      {accelerators && accelerators.length > 0 && (
        <Card className={cn(
          "transition-all duration-300",
          calculations.acceleratorEligible
            ? "border-amber-500/30 bg-amber-500/5"
            : "border-muted"
        )}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5 text-amber-500" />
              Aceleradores de Firmas
            </CardTitle>
            <CardDescription>
              {calculations.acceleratorEligible
                ? "¡Cumples el 100% en el ponderado de originaciones y GMV! Los aceleradores están activos."
                : "Para activar los aceleradores debes cumplir el 100% en el ponderado de originaciones y GMV."}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {accelerators.map((acc) => {
              const isApplied = calculations.appliedAccelerators.some(
                (a) => a.min_firmas === acc.min_firmas && a.bonus_percentage === acc.bonus_percentage
              );
              return (
                <div
                  key={acc.id}
                  className={cn(
                    "flex items-center justify-between p-3 rounded-lg border",
                    isApplied
                      ? "bg-amber-500/10 border-amber-500/40"
                      : "bg-muted/30 border-muted opacity-60"
                  )}
                >
                  <div className="flex items-center gap-3">
                    <Badge variant={isApplied ? "default" : "outline"} className={cn(
                      "font-mono",
                      isApplied && "bg-amber-500 text-white"
                    )}>
                      ≥ {acc.min_firmas} firmas
                    </Badge>
                    <span className="text-sm font-medium">+{acc.bonus_percentage}% sobre comisión</span>
                    {acc.description && (
                      <span className="text-xs text-muted-foreground">({acc.description})</span>
                    )}
                  </div>
                  <div className="text-right">
                    {isApplied ? (
                      <span className="text-sm font-bold text-amber-600">
                        +{formatCurrency(calculations.appliedAccelerators.find(
                          (a) => a.min_firmas === acc.min_firmas
                        )?.bonusAmount || 0)}
                      </span>
                    ) : (
                      <span className="text-xs text-muted-foreground">No aplica</span>
                    )}
                  </div>
                </div>
              );
            })}

            {!calculations.acceleratorEligible && (
              <Alert className="mt-2">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  Necesitas alcanzar el 100% en originaciones y GMV para desbloquear los aceleradores.
                </AlertDescription>
              </Alert>
            )}

            {calculations.acceleratorBonus > 0 && (
              <div className="text-right pt-2 border-t">
                <span className="text-sm text-muted-foreground mr-2">Total aceleradores:</span>
                <span className="text-lg font-bold text-amber-600">
                  +{formatCurrency(calculations.acceleratorBonus)}
                </span>
              </div>
            )}
          </CardContent>
        </Card>
      )}

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
          <div className={cn(
            "grid gap-4",
            calculations.acceleratorBonus > 0 ? "sm:grid-cols-4" : "sm:grid-cols-3"
          )}>
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

            {/* Comisión Base */}
            <div className="text-center p-4 rounded-lg bg-background border">
              <p className="text-sm text-muted-foreground mb-1">Comisión Base</p>
              <p className="text-3xl font-bold">
                {formatCurrency(calculations.comisionBase)}
              </p>
            </div>

            {/* Accelerator Bonus */}
            {calculations.acceleratorBonus > 0 && (
              <div className="text-center p-4 rounded-lg bg-amber-500/10 border border-amber-500/30">
                <p className="text-sm text-muted-foreground mb-1">Aceleradores</p>
                <p className="text-3xl font-bold text-amber-600">
                  +{formatCurrency(calculations.acceleratorBonus)}
                </p>
              </div>
            )}

            {/* Comisión Total */}
            <div className={cn(
              "text-center p-4 rounded-lg border-2",
              calculations.comisionTotal >= 1500000 
                ? "bg-emerald-500/20 border-emerald-500" 
                : calculations.comisionTotal >= 1200000 
                  ? "bg-primary/20 border-primary" 
                  : "bg-amber-500/20 border-amber-500"
            )}>
              <p className="text-sm text-muted-foreground mb-1">Tu Comisión Total</p>
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
