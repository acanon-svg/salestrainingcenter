import React, { useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import {
  BarChart3,
  Users,
  BookOpen,
  TrendingUp,
  TrendingDown,
  Download,
  Filter,
  Calendar,
  Trophy,
  Target,
  Clock,
  CheckCircle,
} from "lucide-react";
import { format, subDays } from "date-fns";
import { es } from "date-fns/locale";

// Mock data for reports
const mockOverviewStats = {
  totalCourses: 24,
  totalEnrollments: 1250,
  avgCompletionRate: 78,
  avgScore: 85,
  activeUsers: 320,
  coursesThisMonth: 5,
};

const mockRegionalData = [
  { name: "Norte", users: 120, courses_completed: 450, avg_score: 87, completion_rate: 82 },
  { name: "Centro", users: 95, courses_completed: 380, avg_score: 84, completion_rate: 76 },
  { name: "Sur", users: 85, courses_completed: 320, avg_score: 82, completion_rate: 74 },
  { name: "Oriente", users: 60, courses_completed: 210, avg_score: 88, completion_rate: 85 },
];

const mockTeamData = [
  { team: "Ventas Norte A", regional: "Norte", users: 25, avg_score: 89, completion_rate: 85 },
  { team: "Ventas Norte B", regional: "Norte", users: 22, avg_score: 86, completion_rate: 80 },
  { team: "Ventas Centro A", regional: "Centro", users: 28, avg_score: 84, completion_rate: 78 },
  { team: "Ventas Centro B", regional: "Centro", users: 20, avg_score: 82, completion_rate: 72 },
  { team: "Ventas Sur A", regional: "Sur", users: 18, avg_score: 83, completion_rate: 76 },
];

const mockCoursePerformance = [
  { name: "Onboarding 2024", enrollments: 320, completions: 285, avg_score: 92 },
  { name: "Técnicas de Ventas", enrollments: 250, completions: 198, avg_score: 87 },
  { name: "Compliance", enrollments: 180, completions: 165, avg_score: 95 },
  { name: "Manejo de Objeciones", enrollments: 145, completions: 112, avg_score: 78 },
  { name: "Cierre de Ventas", enrollments: 120, completions: 89, avg_score: 82 },
];

const Reports: React.FC = () => {
  const [dateRange, setDateRange] = useState("30");
  const [selectedRegional, setSelectedRegional] = useState("all");
  const [selectedTeam, setSelectedTeam] = useState("all");

  const handleExport = () => {
    // Simulate export
    console.log("Exporting report...");
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
              Dashboard de desempeño general del equipo
            </p>
          </div>

          <div className="flex gap-3">
            <Button variant="outline" onClick={handleExport}>
              <Download className="w-4 h-4 mr-2" />
              Exportar
            </Button>
          </div>
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
                    <SelectItem value="norte">Norte</SelectItem>
                    <SelectItem value="centro">Centro</SelectItem>
                    <SelectItem value="sur">Sur</SelectItem>
                    <SelectItem value="oriente">Oriente</SelectItem>
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
                    {mockTeamData.map((t) => (
                      <SelectItem key={t.team} value={t.team}>
                        {t.team}
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
                <p className="text-2xl font-bold">{mockOverviewStats.totalCourses}</p>
                <p className="text-xs text-muted-foreground">Cursos Activos</p>
              </div>
            </CardContent>
          </Card>
          <Card className="border-border/50">
            <CardContent className="pt-6">
              <div className="text-center">
                <Users className="w-8 h-8 mx-auto mb-2 text-primary" />
                <p className="text-2xl font-bold">{mockOverviewStats.activeUsers}</p>
                <p className="text-xs text-muted-foreground">Usuarios Activos</p>
              </div>
            </CardContent>
          </Card>
          <Card className="border-border/50">
            <CardContent className="pt-6">
              <div className="text-center">
                <Target className="w-8 h-8 mx-auto mb-2 text-success" />
                <p className="text-2xl font-bold">{mockOverviewStats.totalEnrollments}</p>
                <p className="text-xs text-muted-foreground">Inscripciones</p>
              </div>
            </CardContent>
          </Card>
          <Card className="border-border/50">
            <CardContent className="pt-6">
              <div className="text-center">
                <CheckCircle className="w-8 h-8 mx-auto mb-2 text-success" />
                <p className="text-2xl font-bold">{mockOverviewStats.avgCompletionRate}%</p>
                <p className="text-xs text-muted-foreground">Tasa Completado</p>
              </div>
            </CardContent>
          </Card>
          <Card className="border-border/50">
            <CardContent className="pt-6">
              <div className="text-center">
                <Trophy className="w-8 h-8 mx-auto mb-2 text-addi-yellow" />
                <p className="text-2xl font-bold">{mockOverviewStats.avgScore}%</p>
                <p className="text-xs text-muted-foreground">Promedio General</p>
              </div>
            </CardContent>
          </Card>
          <Card className="border-border/50">
            <CardContent className="pt-6">
              <div className="text-center">
                <TrendingUp className="w-8 h-8 mx-auto mb-2 text-success" />
                <p className="text-2xl font-bold">+{mockOverviewStats.coursesThisMonth}</p>
                <p className="text-xs text-muted-foreground">Este Mes</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Detailed Reports Tabs */}
        <Tabs defaultValue="regional" className="w-full">
          <TabsList>
            <TabsTrigger value="regional">Por Regional</TabsTrigger>
            <TabsTrigger value="teams">Por Equipo</TabsTrigger>
            <TabsTrigger value="courses">Por Curso</TabsTrigger>
            <TabsTrigger value="custom">Reporte Custom</TabsTrigger>
          </TabsList>

          {/* Regional Tab */}
          <TabsContent value="regional" className="mt-6">
            <Card className="border-border/50">
              <CardHeader>
                <CardTitle>Desempeño por Regional</CardTitle>
                <CardDescription>Métricas de cada regional</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {mockRegionalData.map((regional) => (
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
              </CardContent>
            </Card>
          </TabsContent>

          {/* Teams Tab */}
          <TabsContent value="teams" className="mt-6">
            <Card className="border-border/50">
              <CardHeader>
                <CardTitle>Desempeño por Equipo</CardTitle>
                <CardDescription>Métricas detalladas de cada equipo</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-border">
                        <th className="text-left py-3 px-4 font-medium">Equipo</th>
                        <th className="text-left py-3 px-4 font-medium">Regional</th>
                        <th className="text-center py-3 px-4 font-medium">Usuarios</th>
                        <th className="text-center py-3 px-4 font-medium">Promedio</th>
                        <th className="text-center py-3 px-4 font-medium">Completado</th>
                      </tr>
                    </thead>
                    <tbody>
                      {mockTeamData.map((team) => (
                        <tr key={team.team} className="border-b border-border/50 hover:bg-muted/50">
                          <td className="py-3 px-4 font-medium">{team.team}</td>
                          <td className="py-3 px-4">
                            <Badge variant="outline">{team.regional}</Badge>
                          </td>
                          <td className="py-3 px-4 text-center">{team.users}</td>
                          <td className="py-3 px-4 text-center">
                            <Badge
                              variant={team.avg_score >= 85 ? "default" : "secondary"}
                              className={team.avg_score >= 85 ? "bg-success" : ""}
                            >
                              {team.avg_score}%
                            </Badge>
                          </td>
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-2">
                              <Progress value={team.completion_rate} className="h-2 flex-1" />
                              <span className="text-sm">{team.completion_rate}%</span>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Courses Tab */}
          <TabsContent value="courses" className="mt-6">
            <Card className="border-border/50">
              <CardHeader>
                <CardTitle>Desempeño por Curso</CardTitle>
                <CardDescription>Estadísticas de cada curso</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {mockCoursePerformance.map((course, index) => (
                    <div
                      key={course.name}
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
                          {course.avg_score}% promedio
                        </Badge>
                        <p className="text-sm text-muted-foreground mt-1">
                          {Math.round((course.completions / course.enrollments) * 100)}% completado
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Custom Report Tab */}
          <TabsContent value="custom" className="mt-6">
            <Card className="border-border/50">
              <CardHeader>
                <CardTitle>Generador de Reportes Personalizados</CardTitle>
                <CardDescription>
                  Crea reportes combinando diferentes métricas
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid gap-4 md:grid-cols-3">
                  <div className="space-y-2">
                    <Label>Métricas a incluir</Label>
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar métricas" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="enrollments">Inscripciones</SelectItem>
                        <SelectItem value="completions">Completados</SelectItem>
                        <SelectItem value="scores">Calificaciones</SelectItem>
                        <SelectItem value="time">Tiempo en curso</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Agrupar por</Label>
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar agrupación" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="user">Usuario</SelectItem>
                        <SelectItem value="team">Equipo</SelectItem>
                        <SelectItem value="regional">Regional</SelectItem>
                        <SelectItem value="course">Curso</SelectItem>
                        <SelectItem value="dimension">Dimensión</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Formato de exportación</Label>
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder="Formato" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="csv">CSV</SelectItem>
                        <SelectItem value="excel">Excel</SelectItem>
                        <SelectItem value="pdf">PDF</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="p-8 rounded-lg border-2 border-dashed border-border text-center">
                  <BarChart3 className="w-12 h-12 mx-auto mb-4 text-muted-foreground/50" />
                  <p className="text-muted-foreground">
                    Selecciona los parámetros para generar tu reporte personalizado
                  </p>
                  <Button className="mt-4">
                    <Download className="w-4 h-4 mr-2" />
                    Generar Reporte
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
};

export default Reports;
