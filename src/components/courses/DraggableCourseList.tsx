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
import { BookOpen } from "lucide-react";
import { CreatorCourse } from "@/hooks/useCreatorCourses";
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

  return (
    <Card className="border-border/50">
      <CardContent className="p-0">
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
              />
            ))}
          </SortableContext>
        </DndContext>
      </CardContent>
    </Card>
  );
};
