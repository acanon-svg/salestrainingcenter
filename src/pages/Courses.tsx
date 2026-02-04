import React, { useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { useMyEnrollments, useCourses, useEnrollInCourse } from "@/hooks/useCourses";
import { CourseCard } from "@/components/courses/CourseCard";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Search, BookOpen, Clock, CheckCircle2, AlertCircle, Filter, Award } from "lucide-react";
import { dimensionLabels, TrainingDimension } from "@/lib/types";
import { useToast } from "@/hooks/use-toast";
import { isPast, differenceInDays } from "date-fns";
import { MyDiplomasSection } from "@/components/courses/MyDiplomasSection";

const Courses: React.FC = () => {
  const [search, setSearch] = useState("");
  const [dimensionFilter, setDimensionFilter] = useState<string>("all");
  const { toast } = useToast();

  const { data: enrollments, isLoading: loadingEnrollments } = useMyEnrollments();
  const { data: allCourses, isLoading: loadingCourses } = useCourses({ status: "published" });
  const enrollMutation = useEnrollInCourse();

  const handleEnroll = async (courseId: string) => {
    try {
      await enrollMutation.mutateAsync(courseId);
      toast({
        title: "¡Inscripción exitosa!",
        description: "Ya puedes comenzar el curso.",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  // Filter and categorize enrollments
  const enrolledCourseIds = new Set(enrollments?.map((e) => e.course_id) || []);

  const inProgressEnrollments = enrollments?.filter(
    (e) => e.status === "in_progress" || e.status === "enrolled"
  ) || [];

  const completedEnrollments = enrollments?.filter(
    (e) => e.status === "completed"
  ) || [];

  const expiredEnrollments = enrollments?.filter((e) => {
    const course = e.course;
    return course?.expires_at && isPast(new Date(course.expires_at)) && e.status !== "completed";
  }) || [];

  const pendingEnrollments = inProgressEnrollments.filter((e) => {
    const course = e.course;
    if (!course?.expires_at) return false;
    const daysUntilExpiry = differenceInDays(new Date(course.expires_at), new Date());
    return daysUntilExpiry <= 7 && daysUntilExpiry > 0;
  });

  // Available courses (not enrolled)
  const availableCourses = allCourses?.filter(
    (c) => !enrolledCourseIds.has(c.id)
  ) || [];

  // Apply filters
  const filterCourses = (courses: any[]) => {
    return courses.filter((item) => {
      const course = item.course || item;
      const matchesSearch = course.title?.toLowerCase().includes(search.toLowerCase()) ||
        course.description?.toLowerCase().includes(search.toLowerCase());
      const matchesDimension = dimensionFilter === "all" || course.dimension === dimensionFilter;
      return matchesSearch && matchesDimension;
    });
  };

  const isLoading = loadingEnrollments || loadingCourses;

  return (
    <DashboardLayout>
      <div className="space-y-8 animate-fade-in">
        {/* Header */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Mis Cursos</h1>
            <p className="text-muted-foreground">
              Explora y continúa tu aprendizaje
            </p>
          </div>

          {/* Quick Stats */}
          <div className="flex gap-3">
            <Badge variant="secondary" className="gap-2 px-3 py-1.5">
              <BookOpen className="w-4 h-4" />
              {inProgressEnrollments.length} en progreso
            </Badge>
            <Badge variant="secondary" className="gap-2 px-3 py-1.5 bg-success/10 text-success">
              <CheckCircle2 className="w-4 h-4" />
              {completedEnrollments.length} completados
            </Badge>
            {pendingEnrollments.length > 0 && (
              <Badge variant="destructive" className="gap-2 px-3 py-1.5">
                <AlertCircle className="w-4 h-4" />
                {pendingEnrollments.length} por vencer
              </Badge>
            )}
          </div>
        </div>

        {/* Filters */}
        <Card className="border-border/50">
          <CardContent className="pt-6">
            <div className="flex flex-col gap-4 md:flex-row">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar cursos..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={dimensionFilter} onValueChange={setDimensionFilter}>
                <SelectTrigger className="w-full md:w-48">
                  <Filter className="w-4 h-4 mr-2" />
                  <SelectValue placeholder="Dimensión" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas las dimensiones</SelectItem>
                  {Object.entries(dimensionLabels).map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Tabs */}
        <Tabs defaultValue="in-progress" className="w-full">
          <TabsList className="grid w-full grid-cols-5 lg:w-auto lg:inline-grid">
            <TabsTrigger value="in-progress" className="gap-2">
              <Clock className="w-4 h-4" />
              En Progreso
            </TabsTrigger>
            <TabsTrigger value="available" className="gap-2">
              <BookOpen className="w-4 h-4" />
              Disponibles
            </TabsTrigger>
            <TabsTrigger value="completed" className="gap-2">
              <CheckCircle2 className="w-4 h-4" />
              Completados
            </TabsTrigger>
            <TabsTrigger value="diplomas" className="gap-2">
              <Award className="w-4 h-4" />
              Mis Diplomas
            </TabsTrigger>
            <TabsTrigger value="expired" className="gap-2">
              <AlertCircle className="w-4 h-4" />
              Vencidos
            </TabsTrigger>
          </TabsList>

          <TabsContent value="in-progress" className="mt-6">
            {isLoading ? (
              <CourseGridSkeleton />
            ) : filterCourses(inProgressEnrollments).length > 0 ? (
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {filterCourses(inProgressEnrollments).map((enrollment: any) => (
                  <CourseCard
                    key={enrollment.id}
                    course={enrollment.course}
                    enrollment={{
                      progress_percentage: enrollment.progress_percentage,
                      status: enrollment.status,
                    }}
                  />
                ))}
              </div>
            ) : (
              <EmptyState
                icon={Clock}
                title="No hay cursos en progreso"
                description="Inscríbete en un curso para comenzar tu aprendizaje"
              />
            )}
          </TabsContent>

          <TabsContent value="available" className="mt-6">
            {isLoading ? (
              <CourseGridSkeleton />
            ) : filterCourses(availableCourses).length > 0 ? (
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {filterCourses(availableCourses).map((course: any) => (
                  <CourseCard
                    key={course.id}
                    course={course}
                    showEnrollButton
                    onEnroll={() => handleEnroll(course.id)}
                  />
                ))}
              </div>
            ) : (
              <EmptyState
                icon={BookOpen}
                title="No hay cursos disponibles"
                description="Todos los cursos ya están en tu lista"
              />
            )}
          </TabsContent>

          <TabsContent value="completed" className="mt-6">
            {isLoading ? (
              <CourseGridSkeleton />
            ) : filterCourses(completedEnrollments).length > 0 ? (
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {filterCourses(completedEnrollments).map((enrollment: any) => (
                  <CourseCard
                    key={enrollment.id}
                    course={enrollment.course}
                    enrollment={{
                      progress_percentage: enrollment.progress_percentage,
                      status: enrollment.status,
                    }}
                  />
                ))}
              </div>
            ) : (
              <EmptyState
                icon={CheckCircle2}
                title="No hay cursos completados"
                description="Completa cursos para verlos aquí"
              />
            )}
          </TabsContent>

          <TabsContent value="diplomas" className="mt-6">
            <MyDiplomasSection />
          </TabsContent>

          <TabsContent value="expired" className="mt-6">
            {isLoading ? (
              <CourseGridSkeleton />
            ) : filterCourses(expiredEnrollments).length > 0 ? (
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {filterCourses(expiredEnrollments).map((enrollment: any) => (
                  <CourseCard
                    key={enrollment.id}
                    course={enrollment.course}
                    enrollment={{
                      progress_percentage: enrollment.progress_percentage,
                      status: enrollment.status,
                    }}
                  />
                ))}
              </div>
            ) : (
              <EmptyState
                icon={AlertCircle}
                title="No hay cursos vencidos"
                description="¡Excelente! Mantén tu progreso al día"
              />
            )}
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
};

const CourseGridSkeleton: React.FC = () => (
  <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
    {[1, 2, 3].map((i) => (
      <Card key={i} className="overflow-hidden">
        <Skeleton className="h-40 w-full" />
        <CardHeader>
          <Skeleton className="h-6 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-4 w-full mb-2" />
          <Skeleton className="h-4 w-2/3" />
        </CardContent>
      </Card>
    ))}
  </div>
);

const EmptyState: React.FC<{
  icon: React.ElementType;
  title: string;
  description: string;
}> = ({ icon: Icon, title, description }) => (
  <Card className="border-dashed">
    <CardContent className="flex flex-col items-center justify-center py-16">
      <Icon className="w-12 h-12 text-muted-foreground/50 mb-4" />
      <h3 className="font-semibold text-lg">{title}</h3>
      <p className="text-muted-foreground text-sm">{description}</p>
    </CardContent>
  </Card>
);

export default Courses;
