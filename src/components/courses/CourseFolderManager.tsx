import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
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
import { FolderPlus, Edit, Trash2, Loader2 } from "lucide-react";
import {
  CourseFolder,
  useCreateFolder,
  useUpdateFolder,
  useDeleteFolder,
} from "@/hooks/useCourseFolders";

const FOLDER_COLORS = [
  "#3b82f6", "#ef4444", "#22c55e", "#f59e0b", "#8b5cf6",
  "#ec4899", "#14b8a6", "#f97316", "#6366f1", "#06b6d4",
];

interface FolderDialogFormProps {
  initial?: { name: string; description: string; color: string };
  onSubmit: (data: { name: string; description: string; color: string }) => void;
  isLoading: boolean;
  submitLabel: string;
}

const FolderDialogForm: React.FC<FolderDialogFormProps> = ({ initial, onSubmit, isLoading, submitLabel }) => {
  const [name, setName] = useState(initial?.name || "");
  const [description, setDescription] = useState(initial?.description || "");
  const [color, setColor] = useState(initial?.color || "#3b82f6");

  return (
    <div className="space-y-4">
      <div>
        <Label>Nombre</Label>
        <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Ej: Onboarding Q1" />
      </div>
      <div>
        <Label>Descripción (opcional)</Label>
        <Input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Descripción de la carpeta" />
      </div>
      <div>
        <Label>Color</Label>
        <div className="flex gap-2 mt-1 flex-wrap">
          {FOLDER_COLORS.map((c) => (
            <button
              key={c}
              type="button"
              className={`w-7 h-7 rounded-full border-2 transition-all ${color === c ? "border-foreground scale-110" : "border-transparent"}`}
              style={{ backgroundColor: c }}
              onClick={() => setColor(c)}
            />
          ))}
        </div>
      </div>
      <DialogFooter>
        <Button onClick={() => onSubmit({ name, description, color })} disabled={!name.trim() || isLoading}>
          {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
          {submitLabel}
        </Button>
      </DialogFooter>
    </div>
  );
};

interface CourseFolderManagerProps {
  folders: CourseFolder[];
}

export const CourseFolderManager: React.FC<CourseFolderManagerProps> = ({ folders }) => {
  const createFolder = useCreateFolder();
  const updateFolder = useUpdateFolder();
  const deleteFolder = useDeleteFolder();
  const [createOpen, setCreateOpen] = useState(false);
  const [editingFolder, setEditingFolder] = useState<CourseFolder | null>(null);

  return (
    <div className="flex items-center gap-2 flex-wrap">
      {/* Create folder dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogTrigger asChild>
          <Button variant="outline" size="sm" className="gap-1">
            <FolderPlus className="w-4 h-4" />
            Nueva Carpeta
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Crear Carpeta</DialogTitle>
          </DialogHeader>
          <FolderDialogForm
            isLoading={createFolder.isPending}
            submitLabel="Crear"
            onSubmit={(data) => {
              createFolder.mutate(data, { onSuccess: () => setCreateOpen(false) });
            }}
          />
        </DialogContent>
      </Dialog>

      {/* Folder chips with edit/delete */}
      {folders.map((folder) => (
        <div
          key={folder.id}
          className="flex items-center gap-1 px-2 py-1 rounded-md border border-border/50 text-sm"
        >
          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: folder.color }} />
          <span className="font-medium">{folder.name}</span>

          <Dialog open={editingFolder?.id === folder.id} onOpenChange={(open) => !open && setEditingFolder(null)}>
            <DialogTrigger asChild>
              <Button variant="ghost" size="icon" className="h-5 w-5" onClick={() => setEditingFolder(folder)}>
                <Edit className="w-3 h-3" />
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Editar Carpeta</DialogTitle>
              </DialogHeader>
              <FolderDialogForm
                initial={{ name: folder.name, description: folder.description || "", color: folder.color }}
                isLoading={updateFolder.isPending}
                submitLabel="Guardar"
                onSubmit={(data) => {
                  updateFolder.mutate({ id: folder.id, ...data }, { onSuccess: () => setEditingFolder(null) });
                }}
              />
            </DialogContent>
          </Dialog>

          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="ghost" size="icon" className="h-5 w-5 text-destructive">
                <Trash2 className="w-3 h-3" />
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>¿Eliminar carpeta "{folder.name}"?</AlertDialogTitle>
                <AlertDialogDescription>
                  Los cursos dentro de esta carpeta no se eliminarán, solo se desagruparán.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                <AlertDialogAction
                  onClick={() => deleteFolder.mutate(folder.id)}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  Eliminar
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      ))}
    </div>
  );
};
