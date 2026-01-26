import React from "react";
import { Link } from "react-router-dom";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  BookOpen,
  Plus,
  Eye,
  Edit,
  Trash2,
  Users,
  BarChart,
  Clock,
  CheckCircle,
  AlertCircle,
  Timer,
} from "lucide-react";
import { statusLabels, dimensionLabels } from "@/lib/types";
import { format } from "date-fns";
import { es } from "date-fns/locale";

// Mock data for creator's courses
const mockMyCourses = [
  {
    id: "1",
    title: "Técnicas Avanzadas de Ventas",
    status: "published",
    dimension: "entrenamiento",
    enrolled_count: 45,
    avg_score: 87,
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 30).toISOString(),
    published_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 25).toISOString(),
    scheduled_at: null,
  },
  {
    id: "2",
    title: "Onboarding Ventas 2024",
    status: "published",
    dimension: "onboarding",
    enrolled_count: 120,
    avg_score: 92,
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 60).toISOString(),
    published_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 55).toISOString(),
    scheduled_at: null,
  },
  {
    id: "3",
    title: "Manejo de Objeciones",
    status: "draft",
    dimension: "taller",
    enrolled_count: 0,
    avg_score: null,
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 5).toISOString(),
    published_at: null,
    scheduled_at: new Date(Date.now() + 1000 * 60 * 60 * 24 * 3).toISOString(), // Scheduled in 3 days
  },
  {
    id: "4",
    title: "Compliance y Ética",
    status: "archived",
    dimension: "refuerzo",
    enrolled_count: 85,
    avg_score: 78,
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 90).toISOString(),
    published_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 85).toISOString(),
    scheduled_at: null,
  },
  {
    id: "5",
    title: "Nuevas Políticas de Crédito",
    status: "draft",
    dimension: "refuerzo",
    enrolled_count: 0,
    avg_score: null,
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2).toISOString(),
    published_at: null,
    scheduled_at: new Date(Date.now() + 1000 * 60 * 60 * 24 * 7).toISOString(), // Scheduled in 7 days
  },
];

const MyCourses: React.FC = () => {
  const { profile } = useAuth();

  const getStatusBadge = (status: string, scheduled_at?: string | null) => {
    // Check if it's a scheduled course
    if (status === "draft" && scheduled_at) {
      const scheduledDate = new Date(scheduled_at);
      if (scheduledDate > new Date()) {
        return (
          <Badge className="bg-addi-cyan text-secondary gap-1">
            <Timer className="w-3 h-3" />
            Programado
          </Badge>
        );
      }
    }

    switch (status) {
      case "published":
        return (
          <Badge className="bg-success text-success-foreground gap-1">
            <CheckCircle className="w-3 h-3" />
            {statusLabels[status as keyof typeof statusLabels]}
          </Badge>
        );
      case "draft":
        return (
          <Badge variant="outline" className="gap-1 text-warning border-warning">
            <Clock className="w-3 h-3" />
            {statusLabels[status as keyof typeof statusLabels]}
          </Badge>
        );
      case "archived":
        return (
          <Badge variant="secondary" className="gap-1">
            <AlertCircle className="w-3 h-3" />
            {statusLabels[status as keyof typeof statusLabels]}
          </Badge>
        );
      default:
        return null;
    }
  };

  const publishedCourses = mockMyCourses.filter((c) => c.status === "published");
  const draftCourses = mockMyCourses.filter((c) => c.status === "draft" && !c.scheduled_at);
  const scheduledCourses = mockMyCourses.filter((c) => c.status === "draft" && c.scheduled_at && new Date(c.scheduled_at) > new Date());
  const archivedCourses = mockMyCourses.filter((c) => c.status === "archived");

  const totalEnrolled = mockMyCourses.reduce((sum, c) => sum + c.enrolled_count, 0);
  const avgScore =
    mockMyCourses.filter((c) => c.avg_score).reduce((sum, c) => sum + (c.avg_score || 0), 0) /
    mockMyCourses.filter((c) => c.avg_score).length;

  return (
    <DashboardLayout>
      <div className="space-y-8 animate-fade-in">
        {/* Header */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
              <BookOpen className="w-8 h-8 text-primary" />
              Mis Creaciones
            </h1>
            <p className="text-muted-foreground">
              Gestiona los cursos que has creado
            </p>
          </div>

          <Link to="/courses/create">
            <Button className="gap-2">
              <Plus className="w-4 h-4" />
              Crear Nuevo Curso
            </Button>
          </Link>
        </div>

        {/* Stats */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card className="border-border/50">
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-lg bg-primary/10">
                  <BookOpen className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{mockMyCourses.length}</p>
                  <p className="text-sm text-muted-foreground">Cursos creados</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-border/50">
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-lg bg-success/10">
                  <CheckCircle className="w-6 h-6 text-success" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{publishedCourses.length}</p>
                  <p className="text-sm text-muted-foreground">Publicados</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-border/50">
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-lg bg-addi-yellow/10">
                  <Users className="w-6 h-6 text-addi-yellow" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{totalEnrolled}</p>
                  <p className="text-sm text-muted-foreground">Inscripciones</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-border/50">
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-lg bg-primary/10">
                  <BarChart className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{avgScore.toFixed(0)}%</p>
                  <p className="text-sm text-muted-foreground">Promedio</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="all" className="w-full">
          <TabsList>
            <TabsTrigger value="all">
              Todos ({mockMyCourses.length})
            </TabsTrigger>
            <TabsTrigger value="published">
              Publicados ({publishedCourses.length})
            </TabsTrigger>
            <TabsTrigger value="scheduled">
              <Timer className="w-3 h-3 mr-1" />
              Programados ({scheduledCourses.length})
            </TabsTrigger>
            <TabsTrigger value="draft">
              Borradores ({draftCourses.length})
            </TabsTrigger>
            <TabsTrigger value="archived">
              Archivados ({archivedCourses.length})
            </TabsTrigger>
          </TabsList>

          {["all", "published", "scheduled", "draft", "archived"].map((tab) => (
            <TabsContent key={tab} value={tab} className="mt-6">
              <Card className="border-border/50">
                <CardContent className="p-0">
                  <div className="divide-y divide-border">
                    {(tab === "all"
                      ? mockMyCourses
                      : tab === "scheduled"
                      ? scheduledCourses
                      : tab === "draft"
                      ? draftCourses
                      : mockMyCourses.filter((c) => c.status === tab)
                    ).map((course) => (
                      <div
                        key={course.id}
                        className="flex items-center gap-4 p-4 hover:bg-muted/50 transition-colors"
                      >
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-3 mb-1">
                            <h3 className="font-medium truncate">{course.title}</h3>
                            {getStatusBadge(course.status, course.scheduled_at)}
                            <Badge variant="outline" className="text-xs">
                              {dimensionLabels[course.dimension as keyof typeof dimensionLabels]}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            <span>
                              Creado:{" "}
                              {format(new Date(course.created_at), "d MMM yyyy", { locale: es })}
                            </span>
                            {course.scheduled_at && new Date(course.scheduled_at) > new Date() && (
                              <span className="flex items-center gap-1 text-addi-cyan">
                                <Timer className="w-3 h-3" />
                                Publica: {format(new Date(course.scheduled_at), "d MMM yyyy, HH:mm", { locale: es })}
                              </span>
                            )}
                            {course.enrolled_count > 0 && (
                              <span className="flex items-center gap-1">
                                <Users className="w-3 h-3" />
                                {course.enrolled_count} inscritos
                              </span>
                            )}
                            {course.avg_score && (
                              <span className="flex items-center gap-1">
                                <BarChart className="w-3 h-3" />
                                {course.avg_score}% promedio
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <Button variant="ghost" size="icon">
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button variant="ghost" size="icon">
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-destructive hover:text-destructive"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          ))}
        </Tabs>
      </div>
    </DashboardLayout>
  );
};

export default MyCourses;
