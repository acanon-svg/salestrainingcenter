import React, { useState } from "react";
import { Link } from "react-router-dom";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { BookOpen, Plus, Users, BarChart, CheckCircle, Timer, Folder } from "lucide-react";
import { AICourseGeneratorDialog } from "@/components/courses/AICoursGeneratorDialog";
import {
  useCreatorCourses,
  useDeleteCourse,
  useBulkUpdateCourseOrder,
  usePublishCourse,
  useArchiveCourse,
  CreatorCourse,
} from "@/hooks/useCreatorCourses";
import { useCourseFolders } from "@/hooks/useCourseFolders";
import { DraggableCourseList } from "@/components/courses/DraggableCourseList";
import { CourseFolderManager } from "@/components/courses/CourseFolderManager";
import { MyCoursesStats } from "@/components/courses/MyCoursesStats";

const MyCourses: React.FC = () => {
  const { profile } = useAuth();
  const { data: myCourses = [], isLoading } = useCreatorCourses();
  const { data: folders = [] } = useCourseFolders();
  const deleteCourse = useDeleteCourse();
  const bulkUpdateOrder = useBulkUpdateCourseOrder();
  const publishCourse = usePublishCourse();
  const archiveCourse = useArchiveCourse();
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [publishingId, setPublishingId] = useState<string | null>(null);
  const [archivingId, setArchivingId] = useState<string | null>(null);
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);

  const handleDelete = async (courseId: string) => {
    setDeletingId(courseId);
    try { await deleteCourse.mutateAsync(courseId); } finally { setDeletingId(null); }
  };

  const handlePublish = async (courseId: string) => {
    setPublishingId(courseId);
    try { await publishCourse.mutateAsync(courseId); } finally { setPublishingId(null); }
  };

  const handleArchive = async (courseId: string) => {
    setArchivingId(courseId);
    try { await archiveCourse.mutateAsync(courseId); } finally { setArchivingId(null); }
  };

  const handleReorder = async (reorderedCourses: CreatorCourse[]) => {
    const updates = reorderedCourses.map((course, index) => ({
      id: course.id,
      order_index: reorderedCourses.length - index,
    }));
    await bulkUpdateOrder.mutateAsync(updates);
  };

  // Filter by folder
  const filteredByFolder = selectedFolderId === "none"
    ? myCourses.filter((c) => !c.folder_id)
    : selectedFolderId
      ? myCourses.filter((c) => c.folder_id === selectedFolderId)
      : myCourses;

  // Filter courses by status
  const publishedCourses = filteredByFolder.filter((c) => c.status === "published");
  const draftCourses = filteredByFolder.filter((c) => c.status === "draft" && !c.scheduled_at);
  const scheduledCourses = filteredByFolder.filter(
    (c) => c.status === "draft" && c.scheduled_at && new Date(c.scheduled_at) > new Date()
  );
  const archivedCourses = filteredByFolder.filter((c) => c.status === "archived");

  // Stats (all courses, not filtered)
  const totalEnrolled = myCourses.reduce((sum, c) => sum + c.enrolled_count, 0);
  const coursesWithScore = myCourses.filter((c) => c.avg_score !== null);
  const avgScore =
    coursesWithScore.length > 0
      ? coursesWithScore.reduce((sum, c) => sum + (c.avg_score || 0), 0) / coursesWithScore.length
      : 0;
  const publishedAll = myCourses.filter((c) => c.status === "published");

  const listProps = {
    isLoading,
    onReorder: handleReorder,
    onDelete: handleDelete,
    onPublish: handlePublish,
    onArchive: handleArchive,
    deletingId,
    publishingId,
    archivingId,
    folders,
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
        <MyCoursesStats
          totalCourses={myCourses.length}
          publishedCount={publishedAll.length}
          totalEnrolled={totalEnrolled}
          avgScore={avgScore}
          isLoading={isLoading}
        />

        {/* Folder Management */}
        <div className="space-y-3">
          <CourseFolderManager folders={folders} />

          {/* Folder filter pills */}
          {folders.length > 0 && (
            <div className="flex items-center gap-2 flex-wrap">
              <Button
                variant={selectedFolderId === null ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedFolderId(null)}
              >
                Todos ({myCourses.length})
              </Button>
              {folders.map((folder) => {
                const count = myCourses.filter((c) => c.folder_id === folder.id).length;
                return (
                  <Button
                    key={folder.id}
                    variant={selectedFolderId === folder.id ? "default" : "outline"}
                    size="sm"
                    className="gap-1"
                    onClick={() => setSelectedFolderId(folder.id)}
                  >
                    <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: folder.color }} />
                    {folder.name} ({count})
                  </Button>
                );
              })}
              <Button
                variant={selectedFolderId === "none" ? "default" : "outline"}
                size="sm"
                className="gap-1"
                onClick={() => setSelectedFolderId(selectedFolderId === "none" ? null : "none")}
              >
                <Folder className="w-3 h-3" />
                Sin carpeta ({myCourses.filter((c) => !c.folder_id).length})
              </Button>
            </div>
          )}
        </div>

        {/* Tabs */}
        <Tabs defaultValue="all" className="w-full">
          <TabsList>
            <TabsTrigger value="all">Todos ({filteredByFolder.length})</TabsTrigger>
            <TabsTrigger value="published">Publicados ({publishedCourses.length})</TabsTrigger>
            <TabsTrigger value="scheduled">
              <Timer className="w-3 h-3 mr-1" />
              Programados ({scheduledCourses.length})
            </TabsTrigger>
            <TabsTrigger value="draft">Borradores ({draftCourses.length})</TabsTrigger>
            <TabsTrigger value="archived">Archivados ({archivedCourses.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="mt-6">
            <DraggableCourseList courses={filteredByFolder} {...listProps} />
          </TabsContent>
          <TabsContent value="published" className="mt-6">
            <DraggableCourseList courses={publishedCourses} {...listProps} />
          </TabsContent>
          <TabsContent value="scheduled" className="mt-6">
            <DraggableCourseList courses={scheduledCourses} {...listProps} />
          </TabsContent>
          <TabsContent value="draft" className="mt-6">
            <DraggableCourseList courses={draftCourses} {...listProps} />
          </TabsContent>
          <TabsContent value="archived" className="mt-6">
            <DraggableCourseList courses={archivedCourses} {...listProps} />
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
};

export default MyCourses;
