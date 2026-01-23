import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { format, subDays, startOfYear, endOfMonth, startOfMonth } from "date-fns";
import { es } from "date-fns/locale";

interface PeriodDefinition {
  // For quarter/semester comparisons (month-based)
  startMonth?: number;
  endMonth?: number;
  // For days-based comparisons
  daysAgo?: number;
  daysLength?: number;
  // Label for display
  label: string;
}

export interface PeriodConfig {
  period1: PeriodDefinition;
  period2: PeriodDefinition;
}

interface PeriodMetrics {
  label: string;
  dateRange: string;
  enrollments: number;
  completions: number;
  completionRate: number;
  avgScore: number;
}

export interface PeriodComparisonResult {
  period1: PeriodMetrics;
  period2: PeriodMetrics;
}

const calculatePeriodDates = (period: PeriodDefinition, currentYear: number) => {
  if (period.startMonth !== undefined && period.endMonth !== undefined) {
    // Month-based period (quarters, semesters)
    const start = startOfMonth(new Date(currentYear, period.startMonth, 1));
    const end = endOfMonth(new Date(currentYear, period.endMonth, 1));
    return { start, end };
  } else if (period.daysAgo !== undefined && period.daysLength !== undefined) {
    // Days-based period
    const end = subDays(new Date(), period.daysAgo - period.daysLength);
    const start = subDays(end, period.daysLength);
    return { start, end };
  }
  
  throw new Error("Invalid period definition");
};

const formatDateRange = (start: Date, end: Date) => {
  return `${format(start, "d MMM", { locale: es })} - ${format(end, "d MMM yyyy", { locale: es })}`;
};

export const usePeriodComparison = (config: PeriodConfig) => {
  return useQuery({
    queryKey: ["period-comparison", config],
    queryFn: async (): Promise<PeriodComparisonResult> => {
      const currentYear = new Date().getFullYear();
      
      // Calculate date ranges for both periods
      const period1Dates = calculatePeriodDates(config.period1, currentYear);
      const period2Dates = calculatePeriodDates(config.period2, currentYear);

      // Fetch enrollments for both periods in one query
      const earliestDate = period1Dates.start < period2Dates.start ? period1Dates.start : period2Dates.start;
      const latestDate = period1Dates.end > period2Dates.end ? period1Dates.end : period2Dates.end;

      const { data: enrollments } = await supabase
        .from("course_enrollments")
        .select("created_at, completed_at, status, score")
        .gte("created_at", earliestDate.toISOString())
        .lte("created_at", latestDate.toISOString());

      const calculateMetrics = (start: Date, end: Date, label: string): PeriodMetrics => {
        const periodEnrollments = enrollments?.filter((e) => {
          const createdAt = new Date(e.created_at);
          return createdAt >= start && createdAt <= end;
        }) || [];

        const completedEnrollments = periodEnrollments.filter((e) => e.status === "completed");
        const scores = completedEnrollments
          .filter((e) => e.score !== null)
          .map((e) => e.score as number);

        return {
          label,
          dateRange: formatDateRange(start, end),
          enrollments: periodEnrollments.length,
          completions: completedEnrollments.length,
          completionRate:
            periodEnrollments.length > 0
              ? Math.round((completedEnrollments.length / periodEnrollments.length) * 100)
              : 0,
          avgScore:
            scores.length > 0
              ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length)
              : 0,
        };
      };

      return {
        period1: calculateMetrics(period1Dates.start, period1Dates.end, config.period1.label),
        period2: calculateMetrics(period2Dates.start, period2Dates.end, config.period2.label),
      };
    },
  });
};
