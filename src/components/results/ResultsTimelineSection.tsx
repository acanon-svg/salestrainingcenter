import React, { useState, useMemo } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";
import { AlertCircle } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useTeamResults } from "@/hooks/useTeamResults";
import { useRegionals } from "@/hooks/useRegionals";
import { ResultsTimelineChart } from "./ResultsTimelineChart";

type Indicator = "firmas" | "originaciones" | "gmv";

const PRIVILEGED_EMAILS = ["staborda@addi.com", "dbarragan@addi.com"];

interface Props {
  /** For student view — filter to single user */
  userEmail?: string;
}

export const ResultsTimelineSection: React.FC<Props> = ({ userEmail }) => {
  const { profile, hasRole } = useAuth();
  const isCreator = hasRole("creator");
  const isLeader = hasRole("lider");
  const email = profile?.email || "";

  // Determine access levels
  const canFilterRegional = isCreator || PRIVILEGED_EMAILS.includes(email);

  const [indicator, setIndicator] = useState<Indicator>("firmas");
  const [selectedRegional, setSelectedRegional] = useState<string>(
    canFilterRegional ? "" : (profile?.regional || "")
  );

  const { data: regionals } = useRegionals();

  // For leaders, always filter by their own regional
  const queryRegional = isLeader && !canFilterRegional
    ? profile?.regional || undefined
    : selectedRegional || undefined;

  const { data: results, isLoading } = useTeamResults({
    regional: queryRegional,
    email: userEmail,
  });

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-[400px] w-full" />
      </div>
    );
  }

  if (!results || results.length === 0) {
    return (
      <Card className="border-border/50">
        <CardContent className="pt-6 text-center py-12">
          <AlertCircle className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-50" />
          <p className="text-muted-foreground">
            No hay datos de línea temporal para mostrar.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Independent filters for timeline chart */}
      <div className="flex flex-wrap items-end gap-4">
        <div className="space-y-2">
          <Label className="text-xs text-muted-foreground">Indicador</Label>
          <Select value={indicator} onValueChange={(v) => setIndicator(v as Indicator)}>
            <SelectTrigger className="w-44">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="firmas">Firmas</SelectItem>
              <SelectItem value="originaciones">Originaciones</SelectItem>
              <SelectItem value="gmv">GMV (USD)</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {canFilterRegional && (
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">Regional</Label>
            <Select value={selectedRegional} onValueChange={setSelectedRegional}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Seleccionar regional" />
              </SelectTrigger>
              <SelectContent>
                {regionals?.map((r) => (
                  <SelectItem key={r} value={r}>
                    {r}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
      </div>

      <ResultsTimelineChart
        data={results}
        indicator={indicator}
        showOnlyUser={userEmail}
      />
    </div>
  );
};
