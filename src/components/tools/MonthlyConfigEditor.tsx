import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar, Save, Target, DollarSign, Check } from "lucide-react";
import { toast } from "sonner";
import { CommissionCalculatorConfig } from "@/hooks/useCommissionCalculatorConfig";
import {
  useMonthlyConfigs,
  useUpsertMonthlyConfig,
  getMonthName,
} from "@/hooks/useCommissionMonthlyConfig";

interface MonthlyConfigEditorProps {
  config: CommissionCalculatorConfig;
}

const MONTHS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];

export const MonthlyConfigEditor: React.FC<MonthlyConfigEditorProps> = ({ config }) => {
  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth() + 1;

  const [selectedYear, setSelectedYear] = useState(currentYear);
  const [selectedMonth, setSelectedMonth] = useState(currentMonth);
  
  const { data: monthlyConfigs = [], isLoading } = useMonthlyConfigs(config.id);
  const upsertConfig = useUpsertMonthlyConfig();

  const [formData, setFormData] = useState({
    meta_firmas: config.meta_firmas,
    meta_originaciones: config.meta_originaciones,
    meta_gmv_usd: config.meta_gmv_usd,
    base_comisional: config.base_comisional,
  });

  // Load existing monthly config when month/year changes
  useEffect(() => {
    const existingConfig = monthlyConfigs.find(
      (mc) => mc.month === selectedMonth && mc.year === selectedYear
    );

    if (existingConfig) {
      setFormData({
        meta_firmas: existingConfig.meta_firmas,
        meta_originaciones: existingConfig.meta_originaciones,
        meta_gmv_usd: existingConfig.meta_gmv_usd,
        base_comisional: existingConfig.base_comisional,
      });
    } else {
      // Use base config values as default
      setFormData({
        meta_firmas: config.meta_firmas,
        meta_originaciones: config.meta_originaciones,
        meta_gmv_usd: config.meta_gmv_usd,
        base_comisional: config.base_comisional,
      });
    }
  }, [selectedMonth, selectedYear, monthlyConfigs, config]);

  const handleSave = async () => {
    try {
      await upsertConfig.mutateAsync({
        config_id: config.id,
        month: selectedMonth,
        year: selectedYear,
        meta_firmas: formData.meta_firmas,
        meta_originaciones: formData.meta_originaciones,
        meta_gmv_usd: formData.meta_gmv_usd,
        base_comisional: formData.base_comisional,
        created_by: null,
      });
      toast.success(`Metas de ${getMonthName(selectedMonth)} ${selectedYear} guardadas`);
    } catch (error) {
      toast.error("Error al guardar las metas mensuales");
    }
  };

  const isConfigured = (month: number, year: number) => {
    return monthlyConfigs.some((mc) => mc.month === month && mc.year === year);
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("es-CO", {
      style: "currency",
      currency: "COP",
      minimumFractionDigits: 0,
    }).format(value);
  };

  return (
    <Card className="mt-4">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Calendar className="h-5 w-5" />
          Configuración Mensual de Metas
        </CardTitle>
        <CardDescription>
          Define metas específicas para cada mes del año
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Year and Month selector */}
        <div className="flex flex-wrap gap-4">
          <div className="space-y-2">
            <Label>Año</Label>
            <Select
              value={selectedYear.toString()}
              onValueChange={(v) => setSelectedYear(parseInt(v))}
            >
              <SelectTrigger className="w-[120px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {[currentYear - 1, currentYear, currentYear + 1].map((year) => (
                  <SelectItem key={year} value={year.toString()}>
                    {year}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Mes</Label>
            <Select
              value={selectedMonth.toString()}
              onValueChange={(v) => setSelectedMonth(parseInt(v))}
            >
              <SelectTrigger className="w-[160px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {MONTHS.map((month) => (
                  <SelectItem key={month} value={month.toString()}>
                    <div className="flex items-center gap-2">
                      {getMonthName(month)}
                      {isConfigured(month, selectedYear) && (
                        <Check className="h-3 w-3 text-emerald-500" />
                      )}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Monthly overview */}
        <div className="flex flex-wrap gap-2">
          {MONTHS.map((month) => (
            <Badge
              key={month}
              variant={isConfigured(month, selectedYear) ? "default" : "outline"}
              className={`cursor-pointer transition-all ${
                selectedMonth === month
                  ? "ring-2 ring-primary ring-offset-2"
                  : ""
              } ${
                isConfigured(month, selectedYear)
                  ? "bg-emerald-500 hover:bg-emerald-600"
                  : "hover:bg-muted"
              }`}
              onClick={() => setSelectedMonth(month)}
            >
              {getMonthName(month).slice(0, 3)}
            </Badge>
          ))}
        </div>

        {/* Form for selected month */}
        <div className="p-4 border rounded-lg bg-muted/30">
          <h4 className="font-medium mb-4 flex items-center gap-2">
            <Target className="h-4 w-4" />
            Metas para {getMonthName(selectedMonth)} {selectedYear}
          </h4>
          
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="space-y-2">
              <Label htmlFor="monthly-firmas">Meta de Firmas</Label>
              <Input
                id="monthly-firmas"
                type="number"
                min={0}
                value={formData.meta_firmas}
                onChange={(e) =>
                  setFormData({ ...formData, meta_firmas: parseInt(e.target.value) || 0 })
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="monthly-originaciones">Meta Originaciones</Label>
              <Input
                id="monthly-originaciones"
                type="number"
                min={0}
                value={formData.meta_originaciones}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    meta_originaciones: parseFloat(e.target.value) || 0,
                  })
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="monthly-gmv">Meta GMV (USD)</Label>
              <Input
                id="monthly-gmv"
                type="number"
                min={0}
                step={0.01}
                value={formData.meta_gmv_usd}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    meta_gmv_usd: parseFloat(e.target.value) || 0,
                  })
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="monthly-base">Base Comisional (COP)</Label>
              <Input
                id="monthly-base"
                type="number"
                min={0}
                value={formData.base_comisional}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    base_comisional: parseFloat(e.target.value) || 0,
                  })
                }
              />
            </div>
          </div>

          <div className="flex justify-end mt-4">
            <Button onClick={handleSave} disabled={upsertConfig.isPending}>
              <Save className="h-4 w-4 mr-2" />
              Guardar Metas de {getMonthName(selectedMonth)}
            </Button>
          </div>
        </div>

        {/* Configured months summary */}
        {monthlyConfigs.filter((mc) => mc.year === selectedYear).length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-muted-foreground">
              Meses configurados en {selectedYear}:
            </h4>
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {monthlyConfigs
                .filter((mc) => mc.year === selectedYear)
                .map((mc) => (
                  <div
                    key={mc.id}
                    className="p-3 border rounded-lg text-sm bg-background"
                  >
                    <div className="font-medium">{getMonthName(mc.month)}</div>
                    <div className="text-muted-foreground text-xs mt-1 space-y-0.5">
                      <div>Firmas: {mc.meta_firmas}</div>
                      <div>Originaciones: {mc.meta_originaciones.toLocaleString()}</div>
                      <div>GMV: ${mc.meta_gmv_usd.toLocaleString()}</div>
                      <div>Base: {formatCurrency(mc.base_comisional)}</div>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
