import React, { useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import {
  BarChart3,
  Users,
  BookOpen,
  TrendingUp,
  TrendingDown,
  Download,
  Calendar,
  Trophy,
  Target,
  CheckCircle,
  AlertCircle,
  FileSpreadsheet,
  FileText,
  ChevronDown,
} from "lucide-react";
import {
  useOverviewStats,
  useRegionalData,
  useTeamData,
  useCoursePerformance,
  useAvailableTeams,
  useAvailableRegionals,
  useTrendData,
  useStatusDistribution,
  useMonthlyComparison,
} from "@/hooks/useReportsData";
import { ComplianceBarChart } from "@/components/reports/ComplianceBarChart";
import { TrendLineChart } from "@/components/reports/TrendLineChart";
import { StatusPieChart } from "@/components/reports/StatusPieChart";
import { MonthlyComparisonChart } from "@/components/reports/MonthlyComparisonChart";
import { PeriodComparisonCard } from "@/components/reports/PeriodComparisonCard";
import {
  exportRegionalData,
  exportTeamData,
  exportCourseData,
  exportMonthlyData,
  exportFullComplianceReport,
  type ExportFormat,
} from "@/lib/exportUtils";
import { toast } from "sonner";

const Reports: React.FC = () => {
  const [dateRange, setDateRange] = useState("30");
  const [selectedRegional, setSelectedRegional] = useState("all");
  const [selectedTeam, setSelectedTeam] = useState("all");

  const filters = {
    dateRange: parseInt(dateRange),
    regional: selectedRegional,
    team: selectedTeam,
  };

  const { data: overviewStats, isLoading: loadingOverview } = useOverviewStats(filters);
  const { data: regionalData, isLoading: loadingRegional } = useRegionalData(filters);
  const { data: teamData, isLoading: loadingTeams } = useTeamData(filters);
  const { data: courseData, isLoading: loadingCourses } = useCoursePerformance(filters);
  const { data: trendData, isLoading: loadingTrend } = useTrendData(filters);
  const { data: statusData, isLoading: loadingStatus } = useStatusDistribution(filters);
  const { data: monthlyData, isLoading: loadingMonthly } = useMonthlyComparison();
  const { data: availableTeams } = useAvailableTeams();
  const { data: availableRegionals } = useAvailableRegionals();

  const handleExport = (type: "regional" | "teams" | "courses" | "monthly" | "full", format: ExportFormat) => {
    try {
      switch (type) {
        case "regional":
          if (regionalData && regionalData.length > 0) {
            exportRegionalData(regionalData, format);
            toast.success(`Reporte regional exportado como ${format.toUpperCase()}`);
          } else {
            toast.error("No hay datos regionales para exportar");
          }
          break;
        case "teams":
          if (teamData && teamData.length > 0) {
            exportTeamData(teamData, format);
            toast.success(`Reporte de equipos exportado como ${format.toUpperCase()}`);
          } else {
            toast.error("No hay datos de equipos para exportar");
          }
          break;
        case "courses":
          if (courseData && courseData.length > 0) {
            exportCourseData(courseData, format);
            toast.success(`Reporte de cursos exportado como ${format.toUpperCase()}`);
          } else {
            toast.error("No hay datos de cursos para exportar");
          }
          break;
        case "monthly":
          if (monthlyData && monthlyData.length > 0) {
            exportMonthlyData(monthlyData, format);
            toast.success(`Comparativa mensual exportada como ${format.toUpperCase()}`);
          } else {
            toast.error("No hay datos mensuales para exportar");
          }
          break;
        case "full":
          if (regionalData && teamData) {
            exportFullComplianceReport(regionalData, teamData, format);
            toast.success(`Reporte completo exportado como ${format.toUpperCase()}`);
          } else {
            toast.error("No hay datos suficientes para exportar");
          }
          break;
      }
    } catch (error) {
      toast.error("Error al exportar el reporte");
      console.error("Export error:", error);
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-8 animate-fade-in">
        {/* Header */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
              <BarChart3 className="w-8 h-8 text-primary" />
              Reportes y Estadísticas
            </h1>
            <p className="text-muted-foreground">
              Dashboard de desempeño y compliance del equipo
            </p>
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline">
                <Download className="w-4 h-4 mr-2" />
                Exportar
                <ChevronDown className="w-4 h-4 ml-2" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>Reporte Completo</DropdownMenuLabel>
              <DropdownMenuItem onClick={() => handleExport("full", "csv")}>
                <FileText className="w-4 h-4 mr-2" />
                Exportar todo a CSV
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleExport("full", "excel")}>
                <FileSpreadsheet className="w-4 h-4 mr-2" />
                Exportar todo a Excel
              </DropdownMenuItem>
              
              <DropdownMenuSeparator />
              <DropdownMenuLabel>Por Regional</DropdownMenuLabel>
              <DropdownMenuItem onClick={() => handleExport("regional", "csv")}>
                <FileText className="w-4 h-4 mr-2" />
                Regional - CSV
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleExport("regional", "excel")}>
                <FileSpreadsheet className="w-4 h-4 mr-2" />
                Regional - Excel
              </DropdownMenuItem>
              
              <DropdownMenuSeparator />
              <DropdownMenuLabel>Por Equipo</DropdownMenuLabel>
              <DropdownMenuItem onClick={() => handleExport("teams", "csv")}>
                <FileText className="w-4 h-4 mr-2" />
                Equipos - CSV
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleExport("teams", "excel")}>
                <FileSpreadsheet className="w-4 h-4 mr-2" />
                Equipos - Excel
              </DropdownMenuItem>
              
              <DropdownMenuSeparator />
              <DropdownMenuLabel>Por Curso</DropdownMenuLabel>
              <DropdownMenuItem onClick={() => handleExport("courses", "csv")}>
                <FileText className="w-4 h-4 mr-2" />
                Cursos - CSV
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleExport("courses", "excel")}>
                <FileSpreadsheet className="w-4 h-4 mr-2" />
                Cursos - Excel
              </DropdownMenuItem>
              
              <DropdownMenuSeparator />
              <DropdownMenuLabel>Comparativa Mensual</DropdownMenuLabel>
              <DropdownMenuItem onClick={() => handleExport("monthly", "csv")}>
                <FileText className="w-4 h-4 mr-2" />
                Mensual - CSV
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleExport("monthly", "excel")}>
                <FileSpreadsheet className="w-4 h-4 mr-2" />
                Mensual - Excel
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Filters */}
        <Card className="border-border/50">
          <CardContent className="pt-6">
            <div className="flex flex-wrap gap-4">
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">Período</Label>
                <Select value={dateRange} onValueChange={setDateRange}>
                  <SelectTrigger className="w-40">
                    <Calendar className="w-4 h-4 mr-2" />
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="7">Últimos 7 días</SelectItem>
                    <SelectItem value="15">Últimos 15 días</SelectItem>
                    <SelectItem value="30">Últimos 30 días</SelectItem>
                    <SelectItem value="90">Últimos 90 días</SelectItem>
                    <SelectItem value="365">Último año</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">Regional</Label>
                <Select value={selectedRegional} onValueChange={setSelectedRegional}>
                  <SelectTrigger className="w-40">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas</SelectItem>
                    {availableRegionals?.map((regional) => (
                      <SelectItem key={regional} value={regional.toLowerCase()}>
                        {regional}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">Equipo</Label>
                <Select value={selectedTeam} onValueChange={setSelectedTeam}>
                  <SelectTrigger className="w-48">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    {availableTeams?.map((team) => (
                      <SelectItem key={team} value={team}>
                        {team}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Overview Stats */}
        <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-6">
          <Card className="border-border/50">
            <CardContent className="pt-6">
              <div className="text-center">
                <BookOpen className="w-8 h-8 mx-auto mb-2 text-primary" />
                {loadingOverview ? (
                  <Skeleton className="h-8 w-12 mx-auto" />
                ) : (
                  <p className="text-2xl font-bold">{overviewStats?.totalCourses || 0}</p>
                )}
                <p className="text-xs text-muted-foreground">Cursos Activos</p>
              </div>
            </CardContent>
          </Card>
          <Card className="border-border/50">
            <CardContent className="pt-6">
              <div className="text-center">
                <Users className="w-8 h-8 mx-auto mb-2 text-primary" />
                {loadingOverview ? (
                  <Skeleton className="h-8 w-12 mx-auto" />
                ) : (
                  <p className="text-2xl font-bold">{overviewStats?.activeUsers || 0}</p>
                )}
                <p className="text-xs text-muted-foreground">Usuarios Activos</p>
              </div>
            </CardContent>
          </Card>
          <Card className="border-border/50">
            <CardContent className="pt-6">
              <div className="text-center">
                <Target className="w-8 h-8 mx-auto mb-2 text-success" />
                {loadingOverview ? (
                  <Skeleton className="h-8 w-12 mx-auto" />
                ) : (
                  <p className="text-2xl font-bold">{overviewStats?.totalEnrollments || 0}</p>
                )}
                <p className="text-xs text-muted-foreground">Inscripciones</p>
              </div>
            </CardContent>
          </Card>
          <Card className="border-border/50">
            <CardContent className="pt-6">
              <div className="text-center">
                <CheckCircle className="w-8 h-8 mx-auto mb-2 text-success" />
                {loadingOverview ? (
                  <Skeleton className="h-8 w-12 mx-auto" />
                ) : (
                  <p className="text-2xl font-bold">{overviewStats?.avgCompletionRate || 0}%</p>
                )}
                <p className="text-xs text-muted-foreground">Tasa Completado</p>
              </div>
            </CardContent>
          </Card>
          <Card className="border-border/50">
            <CardContent className="pt-6">
              <div className="text-center">
                <Trophy className="w-8 h-8 mx-auto mb-2 text-addi-yellow" />
                {loadingOverview ? (
                  <Skeleton className="h-8 w-12 mx-auto" />
                ) : (
                  <p className="text-2xl font-bold">{overviewStats?.avgScore || 0}%</p>
                )}
                <p className="text-xs text-muted-foreground">Promedio General</p>
              </div>
            </CardContent>
          </Card>
          <Card className="border-border/50">
            <CardContent className="pt-6">
              <div className="text-center">
                <TrendingUp className="w-8 h-8 mx-auto mb-2 text-success" />
                {loadingOverview ? (
                  <Skeleton className="h-8 w-12 mx-auto" />
                ) : (
                  <p className="text-2xl font-bold">+{overviewStats?.completedThisPeriod || 0}</p>
                )}
                <p className="text-xs text-muted-foreground">Completados (período)</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Charts Section */}
        <div className="grid gap-6 lg:grid-cols-2">
          <ComplianceBarChart data={regionalData} isLoading={loadingRegional} />
          <StatusPieChart data={statusData} isLoading={loadingStatus} />
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <TrendLineChart data={trendData} isLoading={loadingTrend} dateRange={dateRange} />
          <MonthlyComparisonChart data={monthlyData} isLoading={loadingMonthly} />
        </div>

        {/* Period Comparison */}
        <PeriodComparisonCard />

        {/* Detailed Reports Tabs */}
        <Tabs defaultValue="regional" className="w-full">
          <TabsList>
            <TabsTrigger value="regional">Por Regional</TabsTrigger>
            <TabsTrigger value="teams">Por Equipo</TabsTrigger>
            <TabsTrigger value="courses">Por Curso</TabsTrigger>
            <TabsTrigger value="compliance">Compliance</TabsTrigger>
          </TabsList>

          {/* Regional Tab */}
          <TabsContent value="regional" className="mt-6">
            <Card className="border-border/50">
              <CardHeader>
                <CardTitle>Desempeño por Regional</CardTitle>
                <CardDescription>Métricas de compliance y desempeño de cada regional</CardDescription>
              </CardHeader>
              <CardContent>
                {loadingRegional ? (
                  <div className="space-y-4">
                    {[1, 2, 3].map((i) => (
                      <Skeleton key={i} className="h-32 w-full" />
                    ))}
                  </div>
                ) : regionalData && regionalData.length > 0 ? (
                  <div className="space-y-4">
                    {regionalData.map((regional) => (
                      <div
                        key={regional.name}
                        className="p-4 rounded-lg border border-border/50 space-y-3"
                      >
                        <div className="flex items-center justify-between">
                          <h3 className="font-semibold text-lg">{regional.name}</h3>
                          <Badge variant="secondary">{regional.users} usuarios</Badge>
                        </div>

                        <div className="grid gap-4 md:grid-cols-3">
                          <div>
                            <p className="text-sm text-muted-foreground mb-1">
                              Cursos Completados
                            </p>
                            <p className="text-xl font-bold">{regional.courses_completed}</p>
                          </div>
                          <div>
                            <p className="text-sm text-muted-foreground mb-1">
                              Promedio Calificación
                            </p>
                            <div className="flex items-center gap-2">
                              <p className="text-xl font-bold">{regional.avg_score}%</p>
                              {regional.avg_score >= 85 ? (
                                <TrendingUp className="w-4 h-4 text-success" />
                              ) : regional.avg_score >= 70 ? (
                                <TrendingUp className="w-4 h-4 text-addi-yellow" />
                              ) : (
                                <TrendingDown className="w-4 h-4 text-destructive" />
                              )}
                            </div>
                          </div>
                          <div>
                            <p className="text-sm text-muted-foreground mb-1">
                              Tasa de Completado
                            </p>
                            <div className="space-y-1">
                              <p className="text-xl font-bold">{regional.completion_rate}%</p>
                              <Progress value={regional.completion_rate} className="h-2" />
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <AlertCircle className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>No hay datos de regionales disponibles</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Teams Tab */}
          <TabsContent value="teams" className="mt-6">
            <Card className="border-border/50">
              <CardHeader>
                <CardTitle>Desempeño por Equipo</CardTitle>
                <CardDescription>Métricas detalladas de compliance por equipo</CardDescription>
              </CardHeader>
              <CardContent>
                {loadingTeams ? (
                  <Skeleton className="h-64 w-full" />
                ) : teamData && teamData.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-border">
                          <th className="text-left py-3 px-4 font-medium">Equipo</th>
                          <th className="text-left py-3 px-4 font-medium">Regional</th>
                          <th className="text-center py-3 px-4 font-medium">Usuarios</th>
                          <th className="text-center py-3 px-4 font-medium">Completados</th>
                          <th className="text-center py-3 px-4 font-medium">Promedio</th>
                          <th className="text-center py-3 px-4 font-medium">Compliance</th>
                        </tr>
                      </thead>
                      <tbody>
                        {teamData.map((team) => (
                          <tr key={team.team} className="border-b border-border/50 hover:bg-muted/50">
                            <td className="py-3 px-4 font-medium">{team.team}</td>
                            <td className="py-3 px-4">
                              <Badge variant="outline">{team.regional || "N/A"}</Badge>
                            </td>
                            <td className="py-3 px-4 text-center">{team.users}</td>
                            <td className="py-3 px-4 text-center">{team.courses_completed}</td>
                            <td className="py-3 px-4 text-center">
                              <Badge
                                variant={team.avg_score >= 85 ? "default" : "secondary"}
                                className={team.avg_score >= 85 ? "bg-success" : team.avg_score >= 70 ? "bg-addi-yellow text-black" : ""}
                              >
                                {team.avg_score}%
                              </Badge>
                            </td>
                            <td className="py-3 px-4">
                              <div className="flex items-center gap-2">
                                <Progress 
                                  value={team.completion_rate} 
                                  className={`h-2 flex-1 ${team.completion_rate >= 80 ? "[&>div]:bg-success" : team.completion_rate >= 60 ? "[&>div]:bg-addi-yellow" : "[&>div]:bg-destructive"}`} 
                                />
                                <span className="text-sm font-medium w-12">{team.completion_rate}%</span>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <AlertCircle className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>No hay datos de equipos disponibles</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Courses Tab */}
          <TabsContent value="courses" className="mt-6">
            <Card className="border-border/50">
              <CardHeader>
                <CardTitle>Desempeño por Curso</CardTitle>
                <CardDescription>Estadísticas de inscripción y completado por curso</CardDescription>
              </CardHeader>
              <CardContent>
                {loadingCourses ? (
                  <div className="space-y-4">
                    {[1, 2, 3, 4].map((i) => (
                      <Skeleton key={i} className="h-20 w-full" />
                    ))}
                  </div>
                ) : courseData && courseData.length > 0 ? (
                  <div className="space-y-4">
                    {courseData.map((course, index) => {
                      const completionRate = course.enrollments > 0 
                        ? Math.round((course.completions / course.enrollments) * 100) 
                        : 0;
                      
                      return (
                        <div
                          key={course.id}
                          className="flex items-center gap-4 p-4 rounded-lg border border-border/50"
                        >
                          <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                            <span className="font-semibold text-primary">{index + 1}</span>
                          </div>
                          <div className="flex-1">
                            <h4 className="font-medium">{course.name}</h4>
                            <div className="flex gap-4 text-sm text-muted-foreground mt-1">
                              <span>{course.enrollments} inscritos</span>
                              <span>{course.completions} completados</span>
                            </div>
                          </div>
                          <div className="text-right">
                            <Badge
                              variant={course.avg_score >= 85 ? "default" : "secondary"}
                              className={course.avg_score >= 85 ? "bg-success" : ""}
                            >
                              {course.avg_score > 0 ? `${course.avg_score}% promedio` : "Sin datos"}
                            </Badge>
                            <p className="text-sm text-muted-foreground mt-1">
                              {completionRate}% completado
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <AlertCircle className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>No hay cursos con inscripciones</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Compliance Tab */}
          <TabsContent value="compliance" className="mt-6">
            <div className="grid gap-6 lg:grid-cols-2">
              {/* Compliance Overview */}
              <Card className="border-border/50">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CheckCircle className="w-5 h-5 text-success" />
                    Resumen de Compliance
                  </CardTitle>
                  <CardDescription>Estado general de cumplimiento de entrenamientos</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="text-center p-6 bg-muted/30 rounded-lg">
                    <p className="text-5xl font-bold text-primary mb-2">
                      {overviewStats?.avgCompletionRate || 0}%
                    </p>
                    <p className="text-muted-foreground">Tasa de Compliance General</p>
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-3 bg-success/10 rounded-lg">
                      <div className="flex items-center gap-2">
                        <CheckCircle className="w-5 h-5 text-success" />
                        <span>Equipos en compliance (≥80%)</span>
                      </div>
                      <Badge className="bg-success">
                        {teamData?.filter(t => t.completion_rate >= 80).length || 0}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-addi-yellow/10 rounded-lg">
                      <div className="flex items-center gap-2">
                        <AlertCircle className="w-5 h-5 text-addi-yellow" />
                        <span>Equipos en riesgo (60-79%)</span>
                      </div>
                      <Badge className="bg-addi-yellow text-black">
                        {teamData?.filter(t => t.completion_rate >= 60 && t.completion_rate < 80).length || 0}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-destructive/10 rounded-lg">
                      <div className="flex items-center gap-2">
                        <TrendingDown className="w-5 h-5 text-destructive" />
                        <span>Equipos sin compliance (&lt;60%)</span>
                      </div>
                      <Badge variant="destructive">
                        {teamData?.filter(t => t.completion_rate < 60).length || 0}
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Teams Requiring Attention */}
              <Card className="border-border/50">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <AlertCircle className="w-5 h-5 text-destructive" />
                    Equipos que Requieren Atención
                  </CardTitle>
                  <CardDescription>Equipos con tasa de compliance menor al 80%</CardDescription>
                </CardHeader>
                <CardContent>
                  {loadingTeams ? (
                    <div className="space-y-3">
                      {[1, 2, 3].map((i) => (
                        <Skeleton key={i} className="h-16 w-full" />
                      ))}
                    </div>
                  ) : teamData && teamData.filter(t => t.completion_rate < 80).length > 0 ? (
                    <div className="space-y-3">
                      {teamData
                        .filter(t => t.completion_rate < 80)
                        .sort((a, b) => a.completion_rate - b.completion_rate)
                        .slice(0, 5)
                        .map((team) => (
                          <div 
                            key={team.team} 
                            className={`p-3 rounded-lg border ${
                              team.completion_rate < 60 
                                ? "border-destructive/50 bg-destructive/5" 
                                : "border-addi-yellow/50 bg-addi-yellow/5"
                            }`}
                          >
                            <div className="flex items-center justify-between mb-2">
                              <span className="font-medium">{team.team}</span>
                              <Badge variant="outline">{team.regional || "N/A"}</Badge>
                            </div>
                            <div className="flex items-center gap-2">
                              <Progress 
                                value={team.completion_rate} 
                                className={`h-2 flex-1 ${
                                  team.completion_rate < 60 
                                    ? "[&>div]:bg-destructive" 
                                    : "[&>div]:bg-addi-yellow"
                                }`} 
                              />
                              <span className="text-sm font-medium">{team.completion_rate}%</span>
                            </div>
                            <p className="text-xs text-muted-foreground mt-1">
                              {team.users} usuarios · {team.courses_completed} cursos completados
                            </p>
                          </div>
                        ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-success">
                      <CheckCircle className="w-12 h-12 mx-auto mb-4" />
                      <p className="font-medium">¡Todos los equipos están en compliance!</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Regional Compliance Comparison */}
              <Card className="border-border/50 lg:col-span-2">
                <CardHeader>
                  <CardTitle>Comparativa de Compliance por Regional</CardTitle>
                  <CardDescription>Análisis comparativo del cumplimiento por región</CardDescription>
                </CardHeader>
                <CardContent>
                  {loadingRegional ? (
                    <Skeleton className="h-48 w-full" />
                  ) : regionalData && regionalData.length > 0 ? (
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                      {regionalData.map((regional) => {
                        const isCompliant = regional.completion_rate >= 80;
                        const isAtRisk = regional.completion_rate >= 60 && regional.completion_rate < 80;
                        
                        return (
                          <div 
                            key={regional.name}
                            className={`p-4 rounded-lg border-2 ${
                              isCompliant 
                                ? "border-success bg-success/5" 
                                : isAtRisk 
                                ? "border-addi-yellow bg-addi-yellow/5" 
                                : "border-destructive bg-destructive/5"
                            }`}
                          >
                            <div className="flex items-center justify-between mb-3">
                              <h4 className="font-semibold">{regional.name}</h4>
                              {isCompliant ? (
                                <CheckCircle className="w-5 h-5 text-success" />
                              ) : isAtRisk ? (
                                <AlertCircle className="w-5 h-5 text-addi-yellow" />
                              ) : (
                                <TrendingDown className="w-5 h-5 text-destructive" />
                              )}
                            </div>
                            <p className="text-3xl font-bold mb-1">{regional.completion_rate}%</p>
                            <p className="text-sm text-muted-foreground">Tasa de compliance</p>
                            <div className="mt-3 pt-3 border-t border-border/50 text-sm">
                              <div className="flex justify-between">
                                <span className="text-muted-foreground">Usuarios</span>
                                <span className="font-medium">{regional.users}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-muted-foreground">Promedio</span>
                                <span className="font-medium">{regional.avg_score}%</span>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      <AlertCircle className="w-12 h-12 mx-auto mb-4 opacity-50" />
                      <p>No hay datos de regionales disponibles</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
};

export default Reports;
