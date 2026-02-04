import React, { useState } from "react";
import { Link } from "react-router-dom";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
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
  Loader2,
  Award,
  GripVertical,
  ArrowUp,
  ArrowDown,
} from "lucide-react";
import { statusLabels, dimensionLabels } from "@/lib/types";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { useCreatorCourses, useDeleteCourse, useUpdateCourseOrder, CreatorCourse } from "@/hooks/useCreatorCourses";
import { MyDiplomasSection } from "@/components/courses/MyDiplomasSection";

const MyCourses: React.FC = () => {
  const { profile, hasRole } = useAuth();
  const { data: myCourses = [], isLoading } = useCreatorCourses();
  const deleteCourse = useDeleteCourse();
  const updateCourseOrder = useUpdateCourseOrder();
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [isReordering, setIsReordering] = useState(false);

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

  const handleDelete = async (courseId: string) => {
    setDeletingId(courseId);
    try {
      await deleteCourse.mutateAsync(courseId);
    } finally {
      setDeletingId(null);
    }
  };

  const handleMoveUp = async (course: CreatorCourse, courses: CreatorCourse[]) => {
    const currentIndex = courses.findIndex(c => c.id === course.id);
    if (currentIndex <= 0) return;
    
    const prevCourse = courses[currentIndex - 1];
    const newOrder = prevCourse.order_index + 1;
    await updateCourseOrder.mutateAsync({ courseId: course.id, newOrder });
  };

  const handleMoveDown = async (course: CreatorCourse, courses: CreatorCourse[]) => {
    const currentIndex = courses.findIndex(c => c.id === course.id);
    if (currentIndex >= courses.length - 1) return;
    
    const nextCourse = courses[currentIndex + 1];
    const newOrder = Math.max(0, nextCourse.order_index - 1);
    await updateCourseOrder.mutateAsync({ courseId: course.id, newOrder });
  };

  const publishedCourses = myCourses.filter((c) => c.status === "published");
  const draftCourses = myCourses.filter((c) => c.status === "draft" && !c.scheduled_at);
  const scheduledCourses = myCourses.filter(
    (c) => c.status === "draft" && c.scheduled_at && new Date(c.scheduled_at) > new Date()
  );
  const archivedCourses = myCourses.filter((c) => c.status === "archived");

  const totalEnrolled = myCourses.reduce((sum, c) => sum + c.enrolled_count, 0);
  const coursesWithScore = myCourses.filter((c) => c.avg_score !== null);
  const avgScore =
    coursesWithScore.length > 0
      ? coursesWithScore.reduce((sum, c) => sum + (c.avg_score || 0), 0) / coursesWithScore.length
      : 0;

  const renderCourseList = (courses: CreatorCourse[]) => {
    if (isLoading) {
      return (
        <div className="divide-y divide-border">
          {[1, 2, 3].map((i) => (
            <div key={i} className="p-4">
              <Skeleton className="h-16 w-full" />
            </div>
          ))}
        </div>
      );
    }

    if (courses.length === 0) {
      return (
        <div className="text-center py-8 text-muted-foreground">
          <BookOpen className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <p>No hay cursos en esta categoría.</p>
        </div>
      );
    }

    // Sort courses by order_index (highest first) for display
    const sortedCourses = [...courses].sort((a, b) => b.order_index - a.order_index);
    return (
      <div className="divide-y divide-border">
        {sortedCourses.map((course, index) => (
          <div
            key={course.id}
            className="flex items-center gap-4 p-4 hover:bg-muted/50 transition-colors"
          >
            {/* Order controls */}
            <div className="flex flex-col gap-1">
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6"
                disabled={index === 0 || updateCourseOrder.isPending}
                onClick={() => handleMoveUp(course, sortedCourses)}
              >
                <ArrowUp className="w-3 h-3" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6"
                disabled={index === sortedCourses.length - 1 || updateCourseOrder.isPending}
                onClick={() => handleMoveDown(course, sortedCourses)}
              >
                <ArrowDown className="w-3 h-3" />
              </Button>
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-3 mb-1 flex-wrap">
                <h3 className="font-medium truncate">{course.title}</h3>
                {getStatusBadge(course.status, course.scheduled_at)}
                <Badge variant="outline" className="text-xs">
                  {dimensionLabels[course.dimension as keyof typeof dimensionLabels] || course.dimension}
                </Badge>
              </div>
              <div className="flex items-center gap-4 text-sm text-muted-foreground flex-wrap">
                <span>
                  Creado: {format(new Date(course.created_at), "d MMM yyyy", { locale: es })}
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
                {course.avg_score !== null && (
                  <span className="flex items-center gap-1">
                    <BarChart className="w-3 h-3" />
                    {course.avg_score}% promedio
                  </span>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Link to={`/courses/${course.id}`}>
                <Button variant="ghost" size="icon">
                  <Eye className="w-4 h-4" />
                </Button>
              </Link>
              <Link to={`/courses/${course.id}/edit`}>
                <Button variant="ghost" size="icon">
                  <Edit className="w-4 h-4" />
                </Button>
              </Link>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-destructive hover:text-destructive"
                    disabled={deletingId === course.id}
                  >
                    {deletingId === course.id ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Trash2 className="w-4 h-4" />
                    )}
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>¿Eliminar este curso?</AlertDialogTitle>
                    <AlertDialogDescription>
                      Esta acción no se puede deshacer. Se eliminarán todos los materiales, quizzes e inscripciones
                      asociadas a este curso.
                      {course.enrolled_count > 0 && (
                        <span className="block mt-2 text-destructive font-medium">
                          ⚠️ Este curso tiene {course.enrolled_count} estudiantes inscritos.
                        </span>
                      )}
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={() => handleDelete(course.id)}
                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    >
                      Eliminar
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </div>
        ))}
      </div>
    );
  };

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
            <p className="text-muted-foreground">Gestiona los cursos que has creado</p>
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
                  {isLoading ? (
                    <Skeleton className="h-8 w-12" />
                  ) : (
                    <p className="text-2xl font-bold">{myCourses.length}</p>
                  )}
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
                  {isLoading ? (
                    <Skeleton className="h-8 w-12" />
                  ) : (
                    <p className="text-2xl font-bold">{publishedCourses.length}</p>
                  )}
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
                  {isLoading ? (
                    <Skeleton className="h-8 w-12" />
                  ) : (
                    <p className="text-2xl font-bold">{totalEnrolled}</p>
                  )}
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
                  {isLoading ? (
                    <Skeleton className="h-8 w-12" />
                  ) : (
                    <p className="text-2xl font-bold">{avgScore.toFixed(0)}%</p>
                  )}
                  <p className="text-sm text-muted-foreground">Promedio</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="all" className="w-full">
          <TabsList>
            <TabsTrigger value="all">Todos ({myCourses.length})</TabsTrigger>
            <TabsTrigger value="published">Publicados ({publishedCourses.length})</TabsTrigger>
            <TabsTrigger value="scheduled">
              <Timer className="w-3 h-3 mr-1" />
              Programados ({scheduledCourses.length})
            </TabsTrigger>
            <TabsTrigger value="draft">Borradores ({draftCourses.length})</TabsTrigger>
            <TabsTrigger value="archived">Archivados ({archivedCourses.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="mt-6">
            <Card className="border-border/50">
              <CardContent className="p-0">{renderCourseList(myCourses)}</CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="published" className="mt-6">
            <Card className="border-border/50">
              <CardContent className="p-0">{renderCourseList(publishedCourses)}</CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="scheduled" className="mt-6">
            <Card className="border-border/50">
              <CardContent className="p-0">{renderCourseList(scheduledCourses)}</CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="draft" className="mt-6">
            <Card className="border-border/50">
              <CardContent className="p-0">{renderCourseList(draftCourses)}</CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="archived" className="mt-6">
            <Card className="border-border/50">
              <CardContent className="p-0">{renderCourseList(archivedCourses)}</CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
};

export default MyCourses;