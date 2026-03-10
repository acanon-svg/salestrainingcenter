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
import { BookOpen } from "lucide-react";
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

  // Sort by order_index descending for display (highest first = top of list)
  const sortedCourses = [...courses].sort((a, b) => b.order_index - a.order_index);
  const allSelected = sortedCourses.length > 0 && sortedCourses.every((c) => selectedIds.includes(c.id));

  return (
    <Card className="border-border/50">
      <CardContent className="p-0">
        {/* Select all header */}
        {onToggleSelect && onSelectAll && (
          <div className="flex items-center gap-3 px-4 py-2 border-b border-border bg-muted/30">
            <Checkbox
              checked={allSelected}
              onCheckedChange={onSelectAll}
            />
            <span className="text-xs text-muted-foreground font-medium">
              {allSelected ? "Deseleccionar todos" : "Seleccionar todos"}
            </span>
          </div>
        )}
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={sortedCourses.map((c) => c.id)}
            strategy={verticalListSortingStrategy}
          >
            {sortedCourses.map((course) => (
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
            ))}
          </SortableContext>
        </DndContext>
      </CardContent>
    </Card>
  );
};
