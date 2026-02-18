import React from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  GripVertical,
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
  Send,
  Archive,
  Calendar,
  AlertTriangle,
  FolderInput,
  FolderX,
} from "lucide-react";
import { statusLabels, dimensionLabels } from "@/lib/types";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { CreatorCourse } from "@/hooks/useCreatorCourses";
import { CourseFolder, useMoveCourseToFolder } from "@/hooks/useCourseFolders";

interface SortableCourseItemProps {
  course: CreatorCourse;
  onDelete: (courseId: string) => Promise<void>;
  onPublish: (courseId: string) => Promise<void>;
  onArchive: (courseId: string) => Promise<void>;
  deletingId: string | null;
  publishingId: string | null;
  archivingId: string | null;
  folders?: CourseFolder[];
}

const getStatusBadge = (status: string, scheduled_at?: string | null) => {
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

export const SortableCourseItem: React.FC<SortableCourseItemProps> = ({
  course,
  onDelete,
  onPublish,
  onArchive,
  deletingId,
  publishingId,
  archivingId,
  folders = [],
}) => {
  const moveCourse = useMoveCourseToFolder();
  const currentFolder = folders.find((f) => f.id === course.folder_id);
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: course.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`flex items-center gap-4 p-4 hover:bg-muted/50 transition-colors border-b border-border last:border-b-0 ${
        isDragging ? "bg-muted/30 shadow-lg z-10" : ""
      }`}
    >
      {/* Drag handle */}
      <button
        {...attributes}
        {...listeners}
        className="cursor-grab active:cursor-grabbing p-1 rounded hover:bg-muted touch-none"
        title="Arrastrar para reordenar"
      >
        <GripVertical className="w-5 h-5 text-muted-foreground" />
      </button>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-3 mb-1 flex-wrap">
          <h3 className="font-medium truncate">{course.title}</h3>
           {getStatusBadge(course.status, course.scheduled_at)}
          <Badge variant="outline" className="text-xs">
            {dimensionLabels[course.dimension as keyof typeof dimensionLabels] || course.dimension}
          </Badge>
          {currentFolder && (
            <Badge variant="secondary" className="text-xs gap-1">
              <div className="w-2 h-2 rounded-full" style={{ backgroundColor: currentFolder.color }} />
              {currentFolder.name}
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-4 text-sm text-muted-foreground flex-wrap">
          <span>
            Creado: {format(new Date(course.created_at), "d MMM yyyy", { locale: es })}
          </span>
          {course.expires_at ? (() => {
            const expiresDate = new Date(course.expires_at);
            const now = new Date();
            const daysUntilExpiry = Math.ceil((expiresDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
            const isExpired = daysUntilExpiry < 0;
            const isNearExpiry = !isExpired && daysUntilExpiry <= 7;
            return (
              <span className={`flex items-center gap-1 ${isExpired ? "text-destructive font-medium" : isNearExpiry ? "text-warning font-medium" : ""}`}>
                {isExpired ? <AlertTriangle className="w-3 h-3" /> : <Calendar className="w-3 h-3" />}
                Vence: {format(expiresDate, "d MMM yyyy", { locale: es })}
                {isExpired && " (Vencido)"}
                {isNearExpiry && ` (${daysUntilExpiry}d)`}
              </span>
            );
          })() : (
            <span className="flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              Sin vencimiento
            </span>
          )}
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
        {/* Publish button for drafts */}
        {course.status === "draft" && (
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="text-success hover:text-success"
                disabled={publishingId === course.id}
                title="Publicar curso"
              >
                {publishingId === course.id ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>¿Publicar este curso?</AlertDialogTitle>
                <AlertDialogDescription>
                  El curso será visible para todos los estudiantes asignados. Asegúrate de que el contenido esté completo.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                <AlertDialogAction
                  onClick={() => onPublish(course.id)}
                  className="bg-success text-success-foreground hover:bg-success/90"
                >
                  Publicar
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        )}
        
        {/* Archive button for published courses */}
        {course.status === "published" && (
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="text-muted-foreground hover:text-muted-foreground"
                disabled={archivingId === course.id}
                title="Archivar curso"
              >
                {archivingId === course.id ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Archive className="w-4 h-4" />
                )}
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>¿Archivar este curso?</AlertDialogTitle>
                <AlertDialogDescription>
                  El curso dejará de estar visible para nuevos estudiantes. Los estudiantes ya inscritos podrán seguir accediendo.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                <AlertDialogAction onClick={() => onArchive(course.id)}>
                  Archivar
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        )}

        {/* Move to folder */}
        {folders.length > 0 && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" title="Mover a carpeta">
                <FolderInput className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {folders.map((folder) => (
                <DropdownMenuItem
                  key={folder.id}
                  onClick={() => moveCourse.mutate({ courseId: course.id, folderId: folder.id })}
                  className={course.folder_id === folder.id ? "bg-muted" : ""}
                >
                  <div className="w-3 h-3 rounded-full mr-2" style={{ backgroundColor: folder.color }} />
                  {folder.name}
                </DropdownMenuItem>
              ))}
              {course.folder_id && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => moveCourse.mutate({ courseId: course.id, folderId: null })}>
                    <FolderX className="w-3 h-3 mr-2" />
                    Quitar de carpeta
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        )}

        <Link to={`/courses/${course.id}`}>
          <Button variant="ghost" size="icon" title="Ver curso">
            <Eye className="w-4 h-4" />
          </Button>
        </Link>
        <Link to={`/courses/${course.id}/edit`}>
          <Button variant="ghost" size="icon" title="Editar curso">
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
              title="Eliminar curso"
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
                onClick={() => onDelete(course.id)}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                Eliminar
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
};
