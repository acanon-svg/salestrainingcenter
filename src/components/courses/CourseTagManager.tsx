import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Trash2, Plus, Loader2, Edit2, Check, X } from "lucide-react";
import {
  useCourseTags,
  useCreateCourseTag,
  useUpdateCourseTag,
  useDeleteCourseTag,
  CourseTag,
} from "@/hooks/useCourseTags";

interface CourseTagManagerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const PRESET_COLORS = [
  "#22c55e", // green
  "#f59e0b", // amber
  "#ef4444", // red
  "#3b82f6", // blue
  "#8b5cf6", // purple
  "#ec4899", // pink
  "#14b8a6", // teal
  "#f97316", // orange
];

export const CourseTagManager: React.FC<CourseTagManagerProps> = ({
  open,
  onOpenChange,
}) => {
  const { data: tags, isLoading } = useCourseTags();
  const createTag = useCreateCourseTag();
  const updateTag = useUpdateCourseTag();
  const deleteTag = useDeleteCourseTag();

  const [newTagName, setNewTagName] = useState("");
  const [newTagColor, setNewTagColor] = useState(PRESET_COLORS[0]);
  const [newTagPriority, setNewTagPriority] = useState(0);
  const [editingTag, setEditingTag] = useState<CourseTag | null>(null);
  const [editName, setEditName] = useState("");
  const [editColor, setEditColor] = useState("");
  const [editPriority, setEditPriority] = useState(0);

  const handleCreate = async () => {
    if (!newTagName.trim()) return;
    await createTag.mutateAsync({
      name: newTagName.trim(),
      color: newTagColor,
      priority: newTagPriority,
    });
    setNewTagName("");
    setNewTagPriority(0);
  };

  const handleStartEdit = (tag: CourseTag) => {
    setEditingTag(tag);
    setEditName(tag.name);
    setEditColor(tag.color);
    setEditPriority(tag.priority);
  };

  const handleSaveEdit = async () => {
    if (!editingTag || !editName.trim()) return;
    await updateTag.mutateAsync({
      id: editingTag.id,
      name: editName.trim(),
      color: editColor,
      priority: editPriority,
    });
    setEditingTag(null);
  };

  const handleCancelEdit = () => {
    setEditingTag(null);
  };

  const handleDelete = async (id: string) => {
    if (confirm("¿Estás seguro de eliminar esta etiqueta?")) {
      await deleteTag.mutateAsync(id);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Gestionar Etiquetas de Curso</DialogTitle>
          <DialogDescription>
            Crea y administra etiquetas para categorizar los tipos de material de los cursos.
            Las etiquetas con mayor prioridad aparecen primero.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Create new tag */}
          <div className="space-y-3">
            <Label>Nueva Etiqueta</Label>
            <div className="flex gap-2">
              <Input
                placeholder="Nombre de la etiqueta..."
                value={newTagName}
                onChange={(e) => setNewTagName(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && handleCreate()}
              />
              <Input
                type="number"
                placeholder="Prioridad"
                className="w-24"
                value={newTagPriority}
                onChange={(e) => setNewTagPriority(parseInt(e.target.value) || 0)}
              />
            </div>
            <div className="flex items-center gap-2">
              <Label className="text-xs text-muted-foreground">Color:</Label>
              <div className="flex gap-1 flex-wrap">
                {PRESET_COLORS.map((color) => (
                  <button
                    key={color}
                    type="button"
                    className={`w-6 h-6 rounded-full border-2 transition-all ${
                      newTagColor === color ? "border-foreground scale-110" : "border-transparent"
                    }`}
                    style={{ backgroundColor: color }}
                    onClick={() => setNewTagColor(color)}
                  />
                ))}
              </div>
            </div>
            <Button
              onClick={handleCreate}
              disabled={!newTagName.trim() || createTag.isPending}
              className="w-full"
            >
              {createTag.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Plus className="h-4 w-4 mr-2" />
              )}
              Crear Etiqueta
            </Button>
          </div>

          {/* Existing tags */}
          <div className="space-y-2">
            <Label>Etiquetas Existentes</Label>
            {isLoading ? (
              <div className="flex justify-center py-4">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : tags && tags.length > 0 ? (
              <div className="space-y-2 max-h-64 overflow-auto">
                {tags.map((tag) => (
                  <div
                    key={tag.id}
                    className="flex items-center justify-between p-2 rounded-lg border bg-card"
                  >
                    {editingTag?.id === tag.id ? (
                      <div className="flex-1 space-y-2">
                        <div className="flex gap-2">
                          <Input
                            value={editName}
                            onChange={(e) => setEditName(e.target.value)}
                            className="h-8"
                          />
                          <Input
                            type="number"
                            value={editPriority}
                            onChange={(e) => setEditPriority(parseInt(e.target.value) || 0)}
                            className="w-20 h-8"
                          />
                        </div>
                        <div className="flex gap-1 flex-wrap">
                          {PRESET_COLORS.map((color) => (
                            <button
                              key={color}
                              type="button"
                              className={`w-5 h-5 rounded-full border-2 transition-all ${
                                editColor === color ? "border-foreground scale-110" : "border-transparent"
                              }`}
                              style={{ backgroundColor: color }}
                              onClick={() => setEditColor(color)}
                            />
                          ))}
                        </div>
                        <div className="flex gap-1">
                          <Button
                            size="sm"
                            onClick={handleSaveEdit}
                            disabled={updateTag.isPending}
                          >
                            <Check className="h-3 w-3" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={handleCancelEdit}
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <div className="flex items-center gap-2">
                          <Badge
                            style={{ backgroundColor: tag.color }}
                            className="text-white"
                          >
                            {tag.name}
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            Prioridad: {tag.priority}
                          </span>
                        </div>
                        <div className="flex gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => handleStartEdit(tag)}
                          >
                            <Edit2 className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-destructive hover:text-destructive"
                            onClick={() => handleDelete(tag.id)}
                            disabled={deleteTag.isPending}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center text-muted-foreground py-4">
                No hay etiquetas creadas
              </p>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
