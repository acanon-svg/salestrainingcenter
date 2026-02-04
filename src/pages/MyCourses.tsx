import React, { useState } from "react";
import { Link } from "react-router-dom";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { BookOpen, Plus, Users, BarChart, CheckCircle, Timer } from "lucide-react";
import {
  useCreatorCourses,
  useDeleteCourse,
  useBulkUpdateCourseOrder,
  usePublishCourse,
  useArchiveCourse,
  CreatorCourse,
} from "@/hooks/useCreatorCourses";
import { DraggableCourseList } from "@/components/courses/DraggableCourseList";

const MyCourses: React.FC = () => {
  const { profile } = useAuth();
  const { data: myCourses = [], isLoading } = useCreatorCourses();
  const deleteCourse = useDeleteCourse();
  const bulkUpdateOrder = useBulkUpdateCourseOrder();
  const publishCourse = usePublishCourse();
  const archiveCourse = useArchiveCourse();
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [publishingId, setPublishingId] = useState<string | null>(null);
  const [archivingId, setArchivingId] = useState<string | null>(null);

  const handleDelete = async (courseId: string) => {
    setDeletingId(courseId);
    try {
      await deleteCourse.mutateAsync(courseId);
    } finally {
      setDeletingId(null);
    }
  };

  const handlePublish = async (courseId: string) => {
    setPublishingId(courseId);
    try {
      await publishCourse.mutateAsync(courseId);
    } finally {
      setPublishingId(null);
    }
  };

  const handleArchive = async (courseId: string) => {
    setArchivingId(courseId);
    try {
      await archiveCourse.mutateAsync(courseId);
    } finally {
      setArchivingId(null);
    }
  };

  const handleReorder = async (reorderedCourses: CreatorCourse[]) => {
    // Assign new order indices based on position (reverse because highest = first)
    const updates = reorderedCourses.map((course, index) => ({
      id: course.id,
      order_index: reorderedCourses.length - index, // First item gets highest index
    }));
    await bulkUpdateOrder.mutateAsync(updates);
  };

  // Filter courses by status
  const publishedCourses = myCourses.filter((c) => c.status === "published");
  const draftCourses = myCourses.filter((c) => c.status === "draft" && !c.scheduled_at);
  const scheduledCourses = myCourses.filter(
    (c) => c.status === "draft" && c.scheduled_at && new Date(c.scheduled_at) > new Date()
  );
  const archivedCourses = myCourses.filter((c) => c.status === "archived");

  // Stats
  const totalEnrolled = myCourses.reduce((sum, c) => sum + c.enrolled_count, 0);
  const coursesWithScore = myCourses.filter((c) => c.avg_score !== null);
  const avgScore =
    coursesWithScore.length > 0
      ? coursesWithScore.reduce((sum, c) => sum + (c.avg_score || 0), 0) / coursesWithScore.length
      : 0;

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
              Gestiona los cursos que has creado • Arrastra para reordenar
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
            <DraggableCourseList
              courses={myCourses}
              isLoading={isLoading}
              onReorder={handleReorder}
              onDelete={handleDelete}
              onPublish={handlePublish}
              onArchive={handleArchive}
              deletingId={deletingId}
              publishingId={publishingId}
              archivingId={archivingId}
            />
          </TabsContent>

          <TabsContent value="published" className="mt-6">
            <DraggableCourseList
              courses={publishedCourses}
              isLoading={isLoading}
              onReorder={handleReorder}
              onDelete={handleDelete}
              onPublish={handlePublish}
              onArchive={handleArchive}
              deletingId={deletingId}
              publishingId={publishingId}
              archivingId={archivingId}
            />
          </TabsContent>

          <TabsContent value="scheduled" className="mt-6">
            <DraggableCourseList
              courses={scheduledCourses}
              isLoading={isLoading}
              onReorder={handleReorder}
              onDelete={handleDelete}
              onPublish={handlePublish}
              onArchive={handleArchive}
              deletingId={deletingId}
              publishingId={publishingId}
              archivingId={archivingId}
            />
          </TabsContent>

          <TabsContent value="draft" className="mt-6">
            <DraggableCourseList
              courses={draftCourses}
              isLoading={isLoading}
              onReorder={handleReorder}
              onDelete={handleDelete}
              onPublish={handlePublish}
              onArchive={handleArchive}
              deletingId={deletingId}
              publishingId={publishingId}
              archivingId={archivingId}
            />
          </TabsContent>

          <TabsContent value="archived" className="mt-6">
            <DraggableCourseList
              courses={archivedCourses}
              isLoading={isLoading}
              onReorder={handleReorder}
              onDelete={handleDelete}
              onPublish={handlePublish}
              onArchive={handleArchive}
              deletingId={deletingId}
              publishingId={publishingId}
              archivingId={archivingId}
            />
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
};

export default MyCourses;
