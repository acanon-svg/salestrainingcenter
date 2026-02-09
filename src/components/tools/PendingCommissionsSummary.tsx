import React, { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Clock, MapPin, CheckCircle2 } from "lucide-react";
import { usePendingCommissions, CommissionReview } from "@/hooks/useCommissionReviews";

interface Props {
  month: number;
  year: number;
}

export const PendingCommissionsSummary: React.FC<Props> = ({ month, year }) => {
  const { data: pending, isLoading } = usePendingCommissions(month, year);

  const byRegional = useMemo(() => {
    if (!pending) return [];
    const map = new Map<string, CommissionReview[]>();
    for (const c of pending) {
      const key = c.regional || "Sin regional";
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(c);
    }
    return Array.from(map.entries())
      .sort((a, b) => b[1].length - a[1].length);
  }, [pending]);

  const totalPending = pending?.length || 0;

  if (isLoading) return <Skeleton className="h-[200px] w-full" />;

  if (totalPending === 0) {
    return (
      <Card className="border-emerald-200 bg-emerald-50/50 dark:border-emerald-800 dark:bg-emerald-950/20">
        <CardContent className="py-8 text-center">
          <CheckCircle2 className="h-10 w-10 mx-auto text-emerald-500 mb-3" />
          <p className="text-sm font-medium text-emerald-700 dark:text-emerald-400">
            Todas las comisiones de este período han sido revisadas
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Clock className="h-5 w-5 text-amber-500" />
          Comisiones Pendientes por Aprobar
          <Badge variant="secondary" className="ml-auto text-base">
            {totalPending}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {byRegional.map(([regional, items]) => (
            <Card key={regional} className="border-amber-200/60 dark:border-amber-800/40">
              <CardContent className="pt-4 pb-3">
                <div className="flex items-center gap-2 mb-2">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  <span className="font-semibold text-sm">{regional}</span>
                  <Badge variant="outline" className="ml-auto border-amber-300 text-amber-700 dark:text-amber-400">
                    {items.length} pendiente{items.length > 1 ? "s" : ""}
                  </Badge>
                </div>
                <ul className="space-y-1 max-h-32 overflow-y-auto">
                  {items.map((c) => (
                    <li key={c.id} className="text-xs text-muted-foreground truncate">
                      • {c.user_name || c.user_email}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
