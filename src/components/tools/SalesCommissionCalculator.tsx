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
  const [originacionesRealesM1, setOriginacionesRealesM1] = useState<number>(0);
  const [gmvReal, setGmvReal] = useState<number>(0);
  const [gmvRealM1, setGmvRealM1] = useState<number>(0);

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
        ? (originacionesRealesM1 / effectiveConfig.meta_originaciones_m1) * 100 : 0;
      participacionOriginacionesM1 = porcentajeOriginacionesM1 * 0.25;

      porcentajeGMV = effectiveConfig.meta_gmv_usd > 0 
        ? (gmvReal / effectiveConfig.meta_gmv_usd) * 100 : 0;
      participacionGMV = porcentajeGMV * 0.25;

      porcentajeGMVM1 = effectiveConfig.meta_gmv_m1 > 0
        ? (gmvRealM1 / effectiveConfig.meta_gmv_m1) * 100 : 0;
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
      const firmasCompliancePct = effectiveConfig.meta_firmas > 0
        ? (firmasReales / effectiveConfig.meta_firmas) * 100
        : 0;
      let bestAccelerator: typeof accelerators[0] | null = null;
      accelerators.forEach((acc) => {
        if (firmasCompliancePct >= acc.min_firmas) {
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
  }, [firmasReales, originacionesReales, originacionesRealesM1, gmvReal, gmvRealM1, effectiveConfig, accelerators, usesM1]);

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
    <div className="space-y-4">
      {/* Month Selector */}
      {!isCreatorOrAdmin && (
        <MonthSelector
          selectedMonth={selectedMonth}
          selectedYear={selectedYear}
          onMonthChange={setSelectedMonth}
          onYearChange={setSelectedYear}
        />
      )}

      {/* Top bar: Config + Commission Total */}
      <div className="flex items-stretch gap-3 flex-wrap">
        {/* Config Info */}
        <Card className="border-muted flex-1 min-w-[200px]">
          <CardContent className="py-3 px-4">
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <div className="flex items-center gap-2">
                <Calculator className="h-4 w-4 text-muted-foreground" />
                <span className="font-semibold text-sm">{config.name}</span>
                {!isCreatorOrAdmin && (
                  <Badge variant="secondary" className="text-xs">
                    {getMonthName(selectedMonth)} {selectedYear}
                  </Badge>
                )}
              </div>
              <Badge variant="outline" className="text-xs">
                Base: {formatCurrency(effectiveConfig.base_comisional)}
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* Commission Total - Top Right */}
        <Card className={cn(
          "border-2 min-w-[180px]",
          calculations.comisionTotal >= 1500000 
            ? "bg-emerald-500/10 border-emerald-500" 
            : calculations.comisionTotal >= 1200000 
              ? "bg-primary/10 border-primary" 
              : calculations.comisionTotal > 0
                ? "bg-amber-500/10 border-amber-500"
                : "border-muted"
        )}>
          <CardContent className="py-3 px-4 text-center">
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-0.5">Tu Comisión</p>
            <p className={cn(
              "text-2xl font-bold",
              calculations.comisionTotal >= 1500000 
                ? "text-emerald-600" 
                : calculations.comisionTotal >= 1200000 
                  ? "text-primary" 
                  : calculations.comisionTotal > 0
                    ? "text-amber-600"
                    : "text-muted-foreground"
            )}>
              {formatCurrency(calculations.comisionTotal)}
            </p>
            {calculations.acceleratorBonus > 0 && (
              <p className="text-[10px] text-amber-600 font-medium">
                (incl. +{formatCurrency(calculations.acceleratorBonus)} acelerador)
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Firmas + Accelerators in one card */}
      <Card className={cn(
        "transition-all duration-300",
        calculations.candadoDesbloqueado 
          ? "border-emerald-500/50 bg-emerald-500/5" 
          : "border-destructive/50 bg-destructive/5"
      )}>
        <CardContent className="py-3 px-4">
          <div className="flex items-center gap-2 mb-3">
            {calculations.candadoDesbloqueado ? (
              <LockOpen className="h-4 w-4 text-emerald-500" />
            ) : (
              <Lock className="h-4 w-4 text-destructive" />
            )}
            <span className="font-semibold text-sm">Candado de Apertura (Firmas)</span>
            <span className={cn(
              "text-sm font-bold ml-auto",
              calculations.candadoDesbloqueado ? "text-emerald-600" : "text-destructive"
            )}>
              {calculations.porcentajeFirmas.toFixed(1)}%
            </span>
          </div>

          <div className="grid gap-3 grid-cols-3 items-end">
            <div>
              <Label className="text-xs text-muted-foreground">Meta</Label>
              <div className="flex items-center gap-1">
                <Target className="h-3 w-3 text-muted-foreground" />
                <span className="font-semibold">{effectiveConfig.meta_firmas}</span>
              </div>
            </div>
            <div>
              <Label htmlFor="firmas-reales" className="text-xs">Firmas Realizadas</Label>
              <Input
                id="firmas-reales"
                type="number"
                min={0}
                value={firmasReales}
                onChange={(e) => setFirmasReales(parseInt(e.target.value) || 0)}
                className="font-mono h-8 text-sm"
              />
            </div>
            <div>
              <Progress 
                value={Math.min(calculations.porcentajeFirmas, 100)} 
                className="h-2"
              />
              {!calculations.candadoDesbloqueado && (
                <p className="text-[10px] text-destructive mt-1">
                  Mín. 85% ({Math.ceil(effectiveConfig.meta_firmas * 0.85)} firmas)
                </p>
              )}
            </div>
          </div>

          {/* Inline accelerators */}
          {accelerators && accelerators.length > 0 && (
            <>
              <Separator className="my-3" />
              <div className="flex items-center gap-2 flex-wrap">
                <Zap className="h-3.5 w-3.5 text-amber-500" />
                <span className="text-xs font-medium text-muted-foreground">Aceleradores:</span>
                {accelerators.map((acc) => {
                  const isApplied = calculations.appliedAccelerators.some(
                    (a) => a.min_firmas === acc.min_firmas && a.bonus_percentage === acc.bonus_percentage
                  );
                  return (
                    <Badge
                      key={acc.id}
                      variant={isApplied ? "default" : "outline"}
                      className={cn(
                        "text-[10px] font-mono",
                        isApplied && "bg-amber-500 text-white"
                      )}
                    >
                      ≥{acc.min_firmas}% → +{acc.bonus_percentage}%
                      {isApplied && calculations.appliedAccelerators.find(a => a.min_firmas === acc.min_firmas)?.bonusAmount
                        ? ` (${formatCurrency(calculations.appliedAccelerators.find(a => a.min_firmas === acc.min_firmas)!.bonusAmount)})`
                        : ""}
                    </Badge>
                  );
                })}
                {!calculations.acceleratorEligible && (
                  <span className="text-[10px] text-muted-foreground">(Req. 100% ponderado)</span>
                )}
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Originaciones M0 + M1 in one card */}
      <Card>
        <CardContent className="py-3 px-4">
          <div className="flex items-center gap-2 mb-3">
            <DollarSign className="h-4 w-4 text-primary" />
            <span className="font-semibold text-sm">Originaciones</span>
            {usesM1 && <Badge variant="secondary" className="text-[10px]">M0 + M1 × 25%</Badge>}
            {!usesM1 && <Badge variant="secondary" className="text-[10px]">50%</Badge>}
            <span className="text-sm font-bold text-amber-600 ml-auto">
              {(calculations.participacionOriginaciones + calculations.participacionOriginacionesM1).toFixed(2)}%
            </span>
          </div>

          {/* M0 row */}
          <div className="grid gap-3 grid-cols-4 items-end">
            <div>
              <Label className="text-xs text-muted-foreground">Meta {usesM1 ? 'M0' : ''}</Label>
              <span className="font-semibold text-sm block">{effectiveConfig.meta_originaciones.toLocaleString("es-CO")}</span>
            </div>
            <div>
              <Label htmlFor="originaciones-reales" className="text-xs">Real {usesM1 ? 'M0' : ''}</Label>
              <Input
                id="originaciones-reales"
                type="number"
                min={0}
                value={originacionesReales}
                onChange={(e) => setOriginacionesReales(parseFloat(e.target.value) || 0)}
                className="font-mono h-8 text-sm"
              />
            </div>
            <div className="text-center">
              <Label className="text-xs text-muted-foreground">% Ejec.</Label>
              <span className="text-sm font-bold text-primary block">{calculations.porcentajeOriginaciones.toFixed(1)}%</span>
            </div>
            <div className="text-center">
              <Label className="text-xs text-muted-foreground">Res. (×{usesM1 ? '25' : '50'}%)</Label>
              <span className="text-sm font-bold text-amber-600 block">{calculations.participacionOriginaciones.toFixed(2)}%</span>
            </div>
          </div>

          {/* M1 row */}
          {usesM1 && effectiveConfig.meta_originaciones_m1 > 0 && (
            <>
              <Separator className="my-2" />
              <div className="grid gap-3 grid-cols-4 items-end">
                <div>
                  <Label className="text-xs text-muted-foreground">Meta M1</Label>
                  <span className="font-semibold text-sm block">{effectiveConfig.meta_originaciones_m1.toLocaleString("es-CO")}</span>
                </div>
                <div>
                  <Label htmlFor="originaciones-reales-m1" className="text-xs">Real M1</Label>
                  <Input
                    id="originaciones-reales-m1"
                    type="number"
                    min={0}
                    value={originacionesRealesM1}
                    onChange={(e) => setOriginacionesRealesM1(parseFloat(e.target.value) || 0)}
                    className="font-mono h-8 text-sm"
                  />
                </div>
                <div className="text-center">
                  <Label className="text-xs text-muted-foreground">% Ejec.</Label>
                  <span className="text-sm font-bold text-primary block">{calculations.porcentajeOriginacionesM1.toFixed(1)}%</span>
                </div>
                <div className="text-center">
                  <Label className="text-xs text-muted-foreground">Res. (×25%)</Label>
                  <span className="text-sm font-bold text-amber-600 block">{calculations.participacionOriginacionesM1.toFixed(2)}%</span>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* GMV M0 + M1 in one card */}
      <Card>
        <CardContent className="py-3 px-4">
          <div className="flex items-center gap-2 mb-3">
            <DollarSign className="h-4 w-4 text-primary" />
            <span className="font-semibold text-sm">GMV (USD)</span>
            {usesM1 && <Badge variant="secondary" className="text-[10px]">M0 + M1 × 25%</Badge>}
            {!usesM1 && <Badge variant="secondary" className="text-[10px]">50%</Badge>}
            <span className="text-sm font-bold text-amber-600 ml-auto">
              {(calculations.participacionGMV + calculations.participacionGMVM1).toFixed(2)}%
            </span>
          </div>

          {/* M0 row */}
          <div className="grid gap-3 grid-cols-4 items-end">
            <div>
              <Label className="text-xs text-muted-foreground">Meta {usesM1 ? 'M0' : '(USD)'}</Label>
              <span className="font-semibold text-sm block">{formatCurrencyUSD(effectiveConfig.meta_gmv_usd)}</span>
            </div>
            <div>
              <Label htmlFor="gmv-real" className="text-xs">Real {usesM1 ? 'M0' : '(USD)'}</Label>
              <Input
                id="gmv-real"
                type="number"
                min={0}
                step={0.01}
                value={gmvReal}
                onChange={(e) => setGmvReal(parseFloat(e.target.value) || 0)}
                className="font-mono h-8 text-sm"
              />
            </div>
            <div className="text-center">
              <Label className="text-xs text-muted-foreground">% Ejec.</Label>
              <span className="text-sm font-bold text-primary block">{calculations.porcentajeGMV.toFixed(1)}%</span>
            </div>
            <div className="text-center">
              <Label className="text-xs text-muted-foreground">Res. (×{usesM1 ? '25' : '50'}%)</Label>
              <span className="text-sm font-bold text-amber-600 block">{calculations.participacionGMV.toFixed(2)}%</span>
            </div>
          </div>

          {/* M1 row */}
          {usesM1 && effectiveConfig.meta_gmv_m1 > 0 && (
            <>
              <Separator className="my-2" />
              <div className="grid gap-3 grid-cols-4 items-end">
                <div>
                  <Label className="text-xs text-muted-foreground">Meta M1</Label>
                  <span className="font-semibold text-sm block">{formatCurrencyUSD(effectiveConfig.meta_gmv_m1)}</span>
                </div>
                <div>
                  <Label htmlFor="gmv-real-m1" className="text-xs">Real M1</Label>
                  <Input
                    id="gmv-real-m1"
                    type="number"
                    min={0}
                    step={0.01}
                    value={gmvRealM1}
                    onChange={(e) => setGmvRealM1(parseFloat(e.target.value) || 0)}
                    className="font-mono h-8 text-sm"
                  />
                </div>
                <div className="text-center">
                  <Label className="text-xs text-muted-foreground">% Ejec.</Label>
                  <span className="text-sm font-bold text-primary block">{calculations.porcentajeGMVM1.toFixed(1)}%</span>
                </div>
                <div className="text-center">
                  <Label className="text-xs text-muted-foreground">Res. (×25%)</Label>
                  <span className="text-sm font-bold text-amber-600 block">{calculations.participacionGMVM1.toFixed(2)}%</span>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Compact Result Summary */}
      <Card className={cn("border-2", commissionMessage.bgClass)}>
        <CardContent className="py-3 px-4">
          <div className="flex items-center gap-4 flex-wrap">
            <div className="flex items-center gap-2">
              <Trophy className="h-5 w-5" />
              <span className="font-semibold text-sm">Resultado Final</span>
            </div>
            <div className="flex items-center gap-4 ml-auto flex-wrap">
              <div className="text-center">
                <p className="text-[10px] text-muted-foreground">% Total</p>
                <p className="text-lg font-bold text-primary">{calculations.porcentajeTotal.toFixed(2)}%</p>
              </div>
              <div className="text-center">
                <p className="text-[10px] text-muted-foreground">Base</p>
                <p className="text-lg font-bold">{formatCurrency(calculations.comisionBase)}</p>
              </div>
              {calculations.acceleratorBonus > 0 && (
                <div className="text-center">
                  <p className="text-[10px] text-muted-foreground">Acelerador</p>
                  <p className="text-lg font-bold text-amber-600">+{formatCurrency(calculations.acceleratorBonus)}</p>
                </div>
              )}
              <div className={cn(
                "text-center px-3 py-1 rounded-lg border",
                calculations.comisionTotal >= 1500000 
                  ? "bg-emerald-500/20 border-emerald-500" 
                  : calculations.comisionTotal >= 1200000 
                    ? "bg-primary/20 border-primary" 
                    : "bg-amber-500/20 border-amber-500"
              )}>
                <p className="text-[10px] text-muted-foreground">Total</p>
                <p className={cn(
                  "text-xl font-bold",
                  calculations.comisionTotal >= 1500000 ? "text-emerald-600" 
                    : calculations.comisionTotal >= 1200000 ? "text-primary" 
                    : "text-amber-600"
                )}>
                  {formatCurrency(calculations.comisionTotal)}
                </p>
              </div>
            </div>
          </div>

          {/* Compact motivational message */}
          <div className={cn("flex items-center gap-2 mt-2 text-xs", commissionMessage.textClass)}>
            {commissionMessage.icon}
            <p className="line-clamp-2">{commissionMessage.message}</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
