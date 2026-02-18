import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { BookOpen, Users, BarChart, CheckCircle } from "lucide-react";

interface MyCoursesStatsProps {
  totalCourses: number;
  publishedCount: number;
  totalEnrolled: number;
  avgScore: number;
  isLoading: boolean;
}

export const MyCoursesStats: React.FC<MyCoursesStatsProps> = ({
  totalCourses, publishedCount, totalEnrolled, avgScore, isLoading,
}) => {
  const stats = [
    { icon: BookOpen, value: totalCourses, label: "Cursos creados", colorClass: "bg-primary/10 text-primary" },
    { icon: CheckCircle, value: publishedCount, label: "Publicados", colorClass: "bg-success/10 text-success" },
    { icon: Users, value: totalEnrolled, label: "Inscripciones", colorClass: "bg-addi-yellow/10 text-addi-yellow" },
    { icon: BarChart, value: `${avgScore.toFixed(0)}%`, label: "Promedio", colorClass: "bg-primary/10 text-primary" },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-4">
      {stats.map((stat, i) => (
        <Card key={i} className="border-border/50">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className={`p-3 rounded-lg ${stat.colorClass.split(" ")[0]}`}>
                <stat.icon className={`w-6 h-6 ${stat.colorClass.split(" ")[1]}`} />
              </div>
              <div>
                {isLoading ? (
                  <Skeleton className="h-8 w-12" />
                ) : (
                  <p className="text-2xl font-bold">{stat.value}</p>
                )}
                <p className="text-sm text-muted-foreground">{stat.label}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};
