import React from "react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Checkbox } from "@/components/ui/checkbox";
import { BookOpen, Layers } from "lucide-react";
import { CreatorCourse } from "@/hooks/useCreatorCourses";
import { CourseFolder } from "@/hooks/useCourseFolders";
import { SortableCourseItem } from "./SortableCourseItem";

interface DraggableCourseListProps {
  courses: CreatorCourse[];
  isLoading: boolean;
  onReorder: (reorderedCourses: CreatorCourse[]) => void;
  onDelete: (courseId: string) => Promise<void>;
  onPublish: (courseId: string) => Promise<void>;
  onArchive: (courseId: string) => Promise<void>;
  deletingId: string | null;
  publishingId: string | null;
  archivingId: string | null;
  folders?: CourseFolder[];
  selectedIds?: string[];
  onToggleSelect?: (id: string) => void;
  onSelectAll?: () => void;
  groupByProcess?: boolean;
}

export const DraggableCourseList: React.FC<DraggableCourseListProps> = ({
  courses,
  isLoading,
  onReorder,
  onDelete,
  onPublish,
  onArchive,
  deletingId,
  publishingId,
  archivingId,
  folders = [],
  selectedIds = [],
  onToggleSelect,
  onSelectAll,
  groupByProcess = false,
}) => {
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = courses.findIndex((c) => c.id === active.id);
      const newIndex = courses.findIndex((c) => c.id === over.id);
      const reordered = arrayMove(courses, oldIndex, newIndex);
      onReorder(reordered);
    }
  };

  if (isLoading) {
    return (
      <Card className="border-border/50">
        <CardContent className="p-0">
          <div className="divide-y divide-border">
            {[1, 2, 3].map((i) => (
              <div key={i} className="p-4">
                <Skeleton className="h-16 w-full" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (courses.length === 0) {
    return (
      <Card className="border-border/50">
        <CardContent className="p-0">
          <div className="text-center py-8 text-muted-foreground">
            <BookOpen className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>No hay cursos en esta categoría.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const sortedCourses = [...courses].sort((a, b) => b.order_index - a.order_index);
  const allSelected = sortedCourses.length > 0 && sortedCourses.every((c) => selectedIds.includes(c.id));

  const renderCourseItem = (course: CreatorCourse) => (
    <SortableCourseItem
      key={course.id}
      course={course}
      onDelete={onDelete}
      onPublish={onPublish}
      onArchive={onArchive}
      deletingId={deletingId}
      publishingId={publishingId}
      archivingId={archivingId}
      folders={folders}
      isSelected={selectedIds.includes(course.id)}
      onToggleSelect={onToggleSelect ? () => onToggleSelect(course.id) : undefined}
    />
  );

  const renderSelectAllHeader = () => {
    if (!onToggleSelect || !onSelectAll) return null;
    return (
      <div className="flex items-center gap-3 px-4 py-2 border-b border-border bg-muted/30">
        <Checkbox checked={allSelected} onCheckedChange={onSelectAll} />
        <span className="text-xs text-muted-foreground font-medium">
          {allSelected ? "Deseleccionar todos" : "Seleccionar todos"}
        </span>
      </div>
    );
  };

  // Grouped by process view
  if (groupByProcess) {
    const groups: Record<string, { name: string; courses: CreatorCourse[] }> = {};
    const ungrouped: CreatorCourse[] = [];

    sortedCourses.forEach((course) => {
      if (course.process_id && course.process) {
        if (!groups[course.process_id]) {
          groups[course.process_id] = { name: course.process.name, courses: [] };
        }
        groups[course.process_id].courses.push(course);
      } else {
        ungrouped.push(course);
      }
    });

    const sortedGroups = Object.entries(groups).sort(([, a], [, b]) => a.name.localeCompare(b.name));

    return (
      <div className="space-y-4">
        {renderSelectAllHeader() && (
          <Card className="border-border/50">
            <CardContent className="p-0">{renderSelectAllHeader()}</CardContent>
          </Card>
        )}
        {sortedGroups.map(([processId, group]) => (
          <Card key={processId} className="border-border/50 overflow-hidden">
            <div className="flex items-center gap-2 px-4 py-3 bg-primary/10 border-b border-border">
              <Layers className="w-4 h-4 text-primary" />
              <span className="font-semibold text-sm text-foreground">{group.name}</span>
              <span className="text-xs text-muted-foreground ml-1">({group.courses.length} cursos)</span>
            </div>
            <CardContent className="p-0">
              <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                <SortableContext items={group.courses.map((c) => c.id)} strategy={verticalListSortingStrategy}>
                  {group.courses.map(renderCourseItem)}
                </SortableContext>
              </DndContext>
            </CardContent>
          </Card>
        ))}

        {ungrouped.length > 0 && (
          <Card className="border-border/50 overflow-hidden">
            <div className="flex items-center gap-2 px-4 py-3 bg-muted/50 border-b border-border">
              <BookOpen className="w-4 h-4 text-muted-foreground" />
              <span className="font-semibold text-sm text-muted-foreground">Sin proceso asignado</span>
              <span className="text-xs text-muted-foreground ml-1">({ungrouped.length} cursos)</span>
            </div>
            <CardContent className="p-0">
              <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                <SortableContext items={ungrouped.map((c) => c.id)} strategy={verticalListSortingStrategy}>
                  {ungrouped.map(renderCourseItem)}
                </SortableContext>
              </DndContext>
            </CardContent>
          </Card>
        )}
      </div>
    );
  }

  return (
    <Card className="border-border/50">
      <CardContent className="p-0">
        {renderSelectAllHeader()}
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={sortedCourses.map((c) => c.id)}
            strategy={verticalListSortingStrategy}
          >
            {sortedCourses.map(renderCourseItem)}
          </SortableContext>
        </DndContext>
      </CardContent>
    </Card>
  );
};