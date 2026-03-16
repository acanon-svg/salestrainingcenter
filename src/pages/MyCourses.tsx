import React, { useState, useCallback } from "react";
import { Link } from "react-router-dom";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { BookOpen, Plus, Users, BarChart, CheckCircle, Timer, Folder, Search, Filter, Layers } from "lucide-react";
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
import { BulkActionsBar } from "@/components/courses/BulkActionsBar";
import { segmentLabels, categoryLabels, levelLabels } from "@/components/courses/BulkClassifyDialog";
import { difficultyLabels } from "@/lib/types";

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
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [search, setSearch] = useState("");
  const [segmentFilter, setSegmentFilter] = useState<string>("all");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [levelFilter, setLevelFilter] = useState<string>("all");
  const [groupByProcess, setGroupByProcess] = useState(false);

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

  const toggleSelect = useCallback((id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  }, []);

  const clearSelection = useCallback(() => setSelectedIds([]), []);

  // Apply filters
  const applyFilters = (courses: CreatorCourse[]) => {
    return courses.filter((c) => {
      const ext = c as CreatorCourse & { segment?: string; category?: string };
      if (search && !c.title.toLowerCase().includes(search.toLowerCase())) return false;
      if (segmentFilter !== "all" && (ext.segment || "todos") !== segmentFilter) return false;
      if (categoryFilter !== "all" && ext.category !== categoryFilter) return false;
      if (levelFilter !== "all" && (c as any).difficulty !== levelFilter) return false;
      return true;
    });
  };

  // Filter by folder first
  const filteredByFolder = selectedFolderId === "none"
    ? myCourses.filter((c) => !c.folder_id)
    : selectedFolderId
      ? myCourses.filter((c) => c.folder_id === selectedFolderId)
      : myCourses;

  const filtered = applyFilters(filteredByFolder);

  // Filter courses by status
  const publishedCourses = filtered.filter((c) => c.status === "published");
  const draftCourses = filtered.filter((c) => c.status === "draft" && !c.scheduled_at);
  const scheduledCourses = filtered.filter(
    (c) => c.status === "draft" && c.scheduled_at && new Date(c.scheduled_at) > new Date()
  );
  const archivedCourses = filtered.filter((c) => c.status === "archived");

  // Stats (all courses, not filtered)
  const totalEnrolled = myCourses.reduce((sum, c) => sum + c.enrolled_count, 0);
  const coursesWithScore = myCourses.filter((c) => c.avg_score !== null);
  const avgScore =
    coursesWithScore.length > 0
      ? coursesWithScore.reduce((sum, c) => sum + (c.avg_score || 0), 0) / coursesWithScore.length
      : 0;
  const publishedAll = myCourses.filter((c) => c.status === "published");

  const selectAllForTab = (tabCourses: CreatorCourse[]) => {
    return () => {
      const allIds = tabCourses.map((c) => c.id);
      const allSelected = allIds.every((id) => selectedIds.includes(id));
      if (allSelected) {
        setSelectedIds((prev) => prev.filter((id) => !allIds.includes(id)));
      } else {
        setSelectedIds((prev) => [...new Set([...prev, ...allIds])]);
      }
    };
  };

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
    selectedIds,
    onToggleSelect: toggleSelect,
  };

  return (
    <DashboardLayout>
      <div className="space-y-6 animate-fade-in pb-20">
        {/* Header */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
              <BookOpen className="w-8 h-8 text-primary" />
              Mis Creaciones
            </h1>
            <p className="text-muted-foreground">
              Gestiona los cursos que has creado • Arrastra para reordenar - by Alexandra Cañon
            </p>
          </div>
          <div className="flex gap-2">
            <AICourseGeneratorDialog />
            <Link to="/courses/create">
              <Button className="gap-2">
                <Plus className="w-4 h-4" />
                Crear Nuevo Curso
              </Button>
            </Link>
          </div>
        </div>

        {/* Stats */}
        <MyCoursesStats
          totalCourses={myCourses.length}
          publishedCount={publishedAll.length}
          totalEnrolled={totalEnrolled}
          avgScore={avgScore}
          isLoading={isLoading}
        />

        {/* Filters */}
        <Card className="border-border/50">
          <CardContent className="pt-4 pb-4">
            <div className="flex flex-col gap-3 md:flex-row md:items-center">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar cursos..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9"
                />
              </div>
              <Select value={segmentFilter} onValueChange={setSegmentFilter}>
                <SelectTrigger className="w-full md:w-40">
                  <SelectValue placeholder="Segmento" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los segmentos</SelectItem>
                  {Object.entries(segmentLabels).map(([v, l]) => (
                    <SelectItem key={v} value={v}>{l}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="w-full md:w-40">
                  <SelectValue placeholder="Categoría" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas las categorías</SelectItem>
                  {Object.entries(categoryLabels).map(([v, l]) => (
                    <SelectItem key={v} value={v}>{l}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={levelFilter} onValueChange={setLevelFilter}>
                <SelectTrigger className="w-full md:w-36">
                  <SelectValue placeholder="Nivel" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los niveles</SelectItem>
                  {Object.entries(levelLabels).map(([v, l]) => (
                    <SelectItem key={v} value={v}>{l}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

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
            <TabsTrigger value="all">Todos ({filtered.length})</TabsTrigger>
            <TabsTrigger value="published">
              <CheckCircle className="w-3 h-3 mr-1" />
              Activos ({publishedCourses.length})
            </TabsTrigger>
            <TabsTrigger value="scheduled">
              <Timer className="w-3 h-3 mr-1" />
              Programados ({scheduledCourses.length})
            </TabsTrigger>
            <TabsTrigger value="draft">Borradores ({draftCourses.length})</TabsTrigger>
            <TabsTrigger value="archived">Archivados ({archivedCourses.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="mt-6">
            <DraggableCourseList courses={filtered} {...listProps} onSelectAll={selectAllForTab(filtered)} />
          </TabsContent>
          <TabsContent value="published" className="mt-6">
            <DraggableCourseList courses={publishedCourses} {...listProps} onSelectAll={selectAllForTab(publishedCourses)} />
          </TabsContent>
          <TabsContent value="scheduled" className="mt-6">
            <DraggableCourseList courses={scheduledCourses} {...listProps} onSelectAll={selectAllForTab(scheduledCourses)} />
          </TabsContent>
          <TabsContent value="draft" className="mt-6">
            <DraggableCourseList courses={draftCourses} {...listProps} onSelectAll={selectAllForTab(draftCourses)} />
          </TabsContent>
          <TabsContent value="archived" className="mt-6">
            <DraggableCourseList courses={archivedCourses} {...listProps} onSelectAll={selectAllForTab(archivedCourses)} />
          </TabsContent>
        </Tabs>

        {/* Bulk Actions Bar */}
        <BulkActionsBar selectedIds={selectedIds} onClearSelection={clearSelection} />
      </div>
    </DashboardLayout>
  );
};

export default MyCourses;
