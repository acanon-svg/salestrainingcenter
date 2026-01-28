import React, { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Calculator, DollarSign, Percent, Hash } from "lucide-react";
import { CalculatorVariable, CalculatorFormula } from "@/hooks/useTools";

interface CommissionCalculatorProps {
  variables: CalculatorVariable[];
  formulas: CalculatorFormula[];
  userRole: "student" | "lider" | "admin" | "creator";
}

export const CommissionCalculator: React.FC<CommissionCalculatorProps> = ({
  variables,
  formulas,
  userRole,
}) => {
  const [values, setValues] = useState<Record<string, number>>(() => {
    const initial: Record<string, number> = {};
    variables.forEach((v) => {
      initial[v.name] = v.default_value;
    });
    return initial;
  });

  // Filter variables based on user role
  const visibleVariables = useMemo(() => {
    return variables.filter((v) => {
      if (userRole === "admin" || userRole === "creator") return true;
      if (userRole === "lider") return v.visible_to_leaders;
      return v.visible_to_students;
    });
  }, [variables, userRole]);

  // Filter formulas based on user role
  const visibleFormulas = useMemo(() => {
    return formulas.filter((f) => {
      if (userRole === "admin" || userRole === "creator") return true;
      if (userRole === "lider") return f.visible_to_leaders;
      return f.visible_to_students;
    });
  }, [formulas, userRole]);

  // Calculate formula results
  const results = useMemo(() => {
    const calculated: Record<string, number> = {};

    // Create a context with variables and their weights
    const context: Record<string, number> = { ...values };
    variables.forEach((v) => {
      context[`${v.name}_peso`] = v.weight;
    });

    visibleFormulas.forEach((formula) => {
      try {
        // Replace variable names with their values
        let expression = formula.formula;
        
        // Sort by length (longest first) to avoid partial replacements
        const sortedVarNames = Object.keys(context).sort((a, b) => b.length - a.length);
        
        sortedVarNames.forEach((varName) => {
          const regex = new RegExp(`\\b${varName}\\b`, "g");
          expression = expression.replace(regex, String(context[varName] ?? 0));
        });

        // Safe evaluation using Function constructor
        // Only allows basic math operations
        const sanitized = expression.replace(/[^0-9+\-*/().]/g, "");
        if (sanitized !== expression.replace(/\s/g, "")) {
          throw new Error("Invalid characters in formula");
        }
        
        // eslint-disable-next-line no-new-func
        const result = new Function(`return (${expression})`)();
        calculated[formula.name] = typeof result === "number" && !isNaN(result) ? result : 0;
      } catch (error) {
        calculated[formula.name] = 0;
      }
    });

    return calculated;
  }, [values, variables, visibleFormulas]);

  const formatValue = (value: number, type: string) => {
    switch (type) {
      case "currency":
        return new Intl.NumberFormat("es-CO", {
          style: "currency",
          currency: "COP",
          minimumFractionDigits: 0,
          maximumFractionDigits: 0,
        }).format(value);
      case "percentage":
        return `${value.toFixed(2)}%`;
      default:
        return value.toLocaleString("es-CO");
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "currency":
        return <DollarSign className="h-4 w-4" />;
      case "percentage":
        return <Percent className="h-4 w-4" />;
      default:
        return <Hash className="h-4 w-4" />;
    }
  };

  if (visibleVariables.length === 0 && visibleFormulas.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <Calculator className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <p className="text-muted-foreground">
            Esta calculadora aún no tiene variables ni fórmulas configuradas.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Variables Input Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calculator className="h-5 w-5" />
            Variables de Entrada
          </CardTitle>
          <CardDescription>
            Ingresa los valores para calcular tus comisiones
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {visibleVariables.map((variable) => (
              <div key={variable.id} className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor={variable.name} className="flex items-center gap-2">
                    {getTypeIcon(variable.variable_type)}
                    {variable.label}
                  </Label>
                  {variable.weight !== 1 && (
                    <Badge variant="outline" className="text-xs">
                      Peso: {variable.weight}
                    </Badge>
                  )}
                </div>
                <Input
                  id={variable.name}
                  type="number"
                  value={values[variable.name] ?? variable.default_value}
                  onChange={(e) =>
                    setValues({ ...values, [variable.name]: parseFloat(e.target.value) || 0 })
                  }
                  min={variable.min_value ?? undefined}
                  max={variable.max_value ?? undefined}
                  className="font-mono"
                />
                {variable.description && (
                  <p className="text-xs text-muted-foreground">{variable.description}</p>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Results Section */}
      {visibleFormulas.length > 0 && (
        <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-background">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-primary" />
              Resultados del Cálculo
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-2">
              {visibleFormulas.map((formula, index) => (
                <React.Fragment key={formula.id}>
                  <div className="p-4 rounded-lg bg-background border">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-muted-foreground">
                        {formula.label}
                      </span>
                      {getTypeIcon(formula.result_type)}
                    </div>
                    <div className="text-2xl font-bold text-primary">
                      {formatValue(results[formula.name] ?? 0, formula.result_type)}
                    </div>
                    {formula.description && (
                      <p className="text-xs text-muted-foreground mt-2">
                        {formula.description}
                      </p>
                    )}
                  </div>
                  {index < visibleFormulas.length - 1 && index % 2 === 1 && (
                    <Separator className="col-span-2 my-2" />
                  )}
                </React.Fragment>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
