import React, { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calculator, DollarSign, Info, CreditCard, Percent, Banknote } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface Plan {
  value: string;
  label: string;
  days: number;
  commissionRate: number;
}

const PLANS: Plan[] = [
  { value: "7days", label: "7 días", days: 7, commissionRate: 0.09 },
  { value: "30days", label: "30 días", days: 30, commissionRate: 0.065 },
  { value: "60days", label: "60 días", days: 60, commissionRate: 0.055 },
];

const IVA_RATE = 0.19;

export const AddiPlansCalculator: React.FC = () => {
  const [ticketPromedio, setTicketPromedio] = useState<number>(0);
  const [selectedPlan, setSelectedPlan] = useState<string>("");

  const selectedPlanData = useMemo(() => {
    return PLANS.find(p => p.value === selectedPlan);
  }, [selectedPlan]);

  const calculations = useMemo(() => {
    if (!selectedPlanData || ticketPromedio <= 0) {
      return {
        comisionAntesIVA: 0,
        iva: 0,
        totalCobro: 0,
        tePagaremos: 0,
      };
    }

    const comisionAntesIVA = ticketPromedio * selectedPlanData.commissionRate;
    const iva = comisionAntesIVA * IVA_RATE;
    const totalCobro = comisionAntesIVA + iva;
    const tePagaremos = ticketPromedio - totalCobro;

    return {
      comisionAntesIVA,
      iva,
      totalCobro,
      tePagaremos,
    };
  }, [ticketPromedio, selectedPlanData]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("es-CO", {
      style: "currency",
      currency: "COP",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const formatPercent = (value: number) => {
    return `${(value * 100).toFixed(1)}%`;
  };

  return (
    <div className="space-y-6">
      {/* Input Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5 text-primary" />
            Datos del Aliado
          </CardTitle>
          <CardDescription>
            Ingresa el ticket promedio y selecciona el plan para calcular los valores
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Variable 1: Ticket Promedio */}
          <div className="space-y-2">
            <Label htmlFor="ticketPromedio" className="flex items-center gap-2">
              <DollarSign className="h-4 w-4" />
              Ticket Promedio del Aliado
            </Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">
                COP
              </span>
              <Input
                id="ticketPromedio"
                type="number"
                value={ticketPromedio || ""}
                onChange={(e) => setTicketPromedio(parseFloat(e.target.value) || 0)}
                placeholder="0"
                className="pl-14 font-mono text-lg"
              />
            </div>
            <p className="text-xs text-muted-foreground">
              Ingresa el valor promedio de las transacciones del aliado en pesos colombianos
            </p>
          </div>

          {/* Variable 2: Plan del Aliado */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <Calculator className="h-4 w-4" />
              Plan del Aliado
            </Label>
            <Select value={selectedPlan} onValueChange={setSelectedPlan}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Selecciona un plan" />
              </SelectTrigger>
              <SelectContent>
                {PLANS.map((plan) => (
                  <SelectItem key={plan.value} value={plan.value}>
                    <div className="flex items-center gap-2">
                      <span>{plan.label}</span>
                      <Badge variant="secondary" className="text-xs">
                        {formatPercent(plan.commissionRate)} comisión
                      </Badge>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Plan Information Alert */}
            {selectedPlanData && (
              <Alert className="mt-3 border-primary/20 bg-primary/5">
                <Info className="h-4 w-4 text-primary" />
                <AlertDescription className="text-sm">
                  El plan de <strong>{selectedPlanData.days} días</strong> tiene un cargo de{" "}
                  <strong className="text-primary">{formatPercent(selectedPlanData.commissionRate)}</strong> de comisión
                  sobre el valor del ticket.
                </AlertDescription>
              </Alert>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Results Section */}
      {selectedPlan && ticketPromedio > 0 && (
        <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-background">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Banknote className="h-5 w-5 text-primary" />
              Resultados del Cálculo
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-2">
              {/* Variable 3: Comisión antes de IVA */}
              <div className="p-4 rounded-lg bg-background border">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-muted-foreground">
                    Comisión antes de IVA
                  </span>
                  <Percent className="h-4 w-4 text-muted-foreground" />
                </div>
                <div className="text-xl font-bold text-foreground">
                  {formatCurrency(calculations.comisionAntesIVA)}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {formatPercent(selectedPlanData?.commissionRate || 0)} del ticket promedio
                </p>
              </div>

              {/* Variable 4: IVA */}
              <div className="p-4 rounded-lg bg-background border">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-muted-foreground">
                    IVA (19%)
                  </span>
                  <Percent className="h-4 w-4 text-muted-foreground" />
                </div>
                <div className="text-xl font-bold text-foreground">
                  {formatCurrency(calculations.iva)}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  19% sobre la comisión
                </p>
              </div>

              {/* Variable 5: Total que te cobraremos */}
              <div className="p-4 rounded-lg bg-destructive/10 border border-destructive/20">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-destructive">
                    💳 Esto te cobraremos en Addi
                  </span>
                  <DollarSign className="h-4 w-4 text-destructive" />
                </div>
                <div className="text-2xl font-bold text-destructive">
                  {formatCurrency(calculations.totalCobro)}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Comisión + IVA
                </p>
              </div>

              {/* Variable 6: Te pagaremos */}
              <div className="p-4 rounded-lg bg-green-500/10 border border-green-500/20">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-green-600 dark:text-green-400">
                    💰 Te pagaremos al cumplir el tiempo de tu plan
                  </span>
                  <Banknote className="h-4 w-4 text-green-600 dark:text-green-400" />
                </div>
                <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                  {formatCurrency(calculations.tePagaremos)}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Después de {selectedPlanData?.days} días
                </p>
              </div>
            </div>

            {/* Summary */}
            <div className="mt-6 p-4 rounded-lg bg-muted/50 border">
              <h4 className="font-semibold mb-2 flex items-center gap-2">
                <Info className="h-4 w-4" />
                Resumen de la transacción
              </h4>
              <div className="space-y-1 text-sm">
                <p>
                  <span className="text-muted-foreground">Ticket promedio:</span>{" "}
                  <strong>{formatCurrency(ticketPromedio)}</strong>
                </p>
                <p>
                  <span className="text-muted-foreground">Plan seleccionado:</span>{" "}
                  <strong>{selectedPlanData?.label}</strong> ({formatPercent(selectedPlanData?.commissionRate || 0)})
                </p>
                <p>
                  <span className="text-muted-foreground">Cobro Addi:</span>{" "}
                  <strong className="text-destructive">{formatCurrency(calculations.totalCobro)}</strong>
                </p>
                <p>
                  <span className="text-muted-foreground">Recibirás:</span>{" "}
                  <strong className="text-green-600 dark:text-green-400">{formatCurrency(calculations.tePagaremos)}</strong>
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Empty state */}
      {(!selectedPlan || ticketPromedio <= 0) && (
        <Card>
          <CardContent className="py-12 text-center">
            <Calculator className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">
              Ingresa el ticket promedio y selecciona un plan para ver los cálculos
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
