import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Archive, RotateCcw, UserPlus, Tags, Trash2, X } from "lucide-react";
import {
  useBulkArchiveCourses,
  useBulkReactivateCourses,
  useBulkDeleteCourses,
} from "@/hooks/useBulkCourseActions";
import { BulkAssignDialog } from "./BulkAssignDialog";
import { BulkClassifyDialog } from "./BulkClassifyDialog";

interface BulkActionsBarProps {
  selectedIds: string[];
  onClearSelection: () => void;
}

export const BulkActionsBar: React.FC<BulkActionsBarProps> = ({
  selectedIds,
  onClearSelection,
}) => {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showArchiveConfirm, setShowArchiveConfirm] = useState(false);
  const [showAssignDialog, setShowAssignDialog] = useState(false);
  const [showClassifyDialog, setShowClassifyDialog] = useState(false);

  const bulkArchive = useBulkArchiveCourses();
  const bulkReactivate = useBulkReactivateCourses();
  const bulkDelete = useBulkDeleteCourses();

  if (selectedIds.length === 0) return null;

  const handleArchive = async () => {
    await bulkArchive.mutateAsync(selectedIds);
    onClearSelection();
    setShowArchiveConfirm(false);
  };

  const handleReactivate = async () => {
    await bulkReactivate.mutateAsync(selectedIds);
    onClearSelection();
  };

  const handleDelete = async () => {
    await bulkDelete.mutateAsync(selectedIds);
    onClearSelection();
    setShowDeleteConfirm(false);
  };

  return (
    <>
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-background border border-border rounded-xl shadow-lg px-4 py-3 flex items-center gap-3 animate-in slide-in-from-bottom-4">
        <span className="text-sm font-medium text-foreground whitespace-nowrap">
          {selectedIds.length} seleccionado(s)
        </span>

        <div className="h-6 w-px bg-border" />

        <Button
          variant="outline"
          size="sm"
          className="gap-1.5"
          onClick={() => setShowArchiveConfirm(true)}
        >
          <Archive className="w-3.5 h-3.5" />
          Archivar
        </Button>

        <Button
          variant="outline"
          size="sm"
          className="gap-1.5"
          onClick={handleReactivate}
        >
          <RotateCcw className="w-3.5 h-3.5" />
          Reactivar
        </Button>

        <Button
          variant="outline"
          size="sm"
          className="gap-1.5"
          onClick={() => setShowAssignDialog(true)}
        >
          <UserPlus className="w-3.5 h-3.5" />
          Asignar
        </Button>

        <Button
          variant="outline"
          size="sm"
          className="gap-1.5"
          onClick={() => setShowClassifyDialog(true)}
        >
          <Tags className="w-3.5 h-3.5" />
          Clasificar
        </Button>

        <Button
          variant="outline"
          size="sm"
          className="gap-1.5 text-destructive hover:text-destructive"
          onClick={() => setShowDeleteConfirm(true)}
        >
          <Trash2 className="w-3.5 h-3.5" />
          Eliminar
        </Button>

        <div className="h-6 w-px bg-border" />

        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onClearSelection}>
          <X className="w-4 h-4" />
        </Button>
      </div>

      {/* Archive confirmation */}
      <AlertDialog open={showArchiveConfirm} onOpenChange={setShowArchiveConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Archivar {selectedIds.length} curso(s)?</AlertDialogTitle>
            <AlertDialogDescription>
              Los usuarios con estos cursos asignados perderán el acceso. Puedes reactivarlos después.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleArchive}>Archivar</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete confirmation */}
      <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar {selectedIds.length} curso(s)?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. Se eliminarán todos los materiales, quizzes e inscripciones asociadas.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Assign dialog */}
      <BulkAssignDialog
        open={showAssignDialog}
        onOpenChange={setShowAssignDialog}
        courseIds={selectedIds}
        onComplete={onClearSelection}
      />

      {/* Classify dialog */}
      <BulkClassifyDialog
        open={showClassifyDialog}
        onOpenChange={setShowClassifyDialog}
        courseIds={selectedIds}
        onComplete={onClearSelection}
      />
    </>
  );
};
