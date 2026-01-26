import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Pencil, Trash2, Loader2, Tag } from "lucide-react";
import {
  useMaterialTags,
  useCreateMaterialTag,
  useUpdateMaterialTag,
  useDeleteMaterialTag,
  MaterialTag,
} from "@/hooks/useMaterialTags";

interface TagManagerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const TAG_COLORS = [
  { name: "Azul", value: "#3b82f6" },
  { name: "Verde", value: "#22c55e" },
  { name: "Rojo", value: "#ef4444" },
  { name: "Amarillo", value: "#eab308" },
  { name: "Morado", value: "#a855f7" },
  { name: "Rosa", value: "#ec4899" },
  { name: "Naranja", value: "#f97316" },
  { name: "Cian", value: "#06b6d4" },
  { name: "Gris", value: "#6b7280" },
];

const PRIORITY_OPTIONS = [
  { name: "Baja", value: 0 },
  { name: "Media", value: 1 },
  { name: "Alta", value: 2 },
  { name: "Crítica", value: 3 },
];

export const TagManager: React.FC<TagManagerProps> = ({ open, onOpenChange }) => {
  const { data: tags, isLoading } = useMaterialTags();
  const createMutation = useCreateMaterialTag();
  const updateMutation = useUpdateMaterialTag();
  const deleteMutation = useDeleteMaterialTag();

  const [editingTag, setEditingTag] = useState<MaterialTag | null>(null);
  const [newTagName, setNewTagName] = useState("");
  const [newTagColor, setNewTagColor] = useState("#3b82f6");
  const [newTagPriority, setNewTagPriority] = useState(0);
  const [isAddingNew, setIsAddingNew] = useState(false);

  const resetForm = () => {
    setNewTagName("");
    setNewTagColor("#3b82f6");
    setNewTagPriority(0);
    setIsAddingNew(false);
    setEditingTag(null);
  };

  const handleCreate = async () => {
    if (!newTagName.trim()) return;

    await createMutation.mutateAsync({
      name: newTagName.trim(),
      color: newTagColor,
      priority: newTagPriority,
    });
    resetForm();
  };

  const handleUpdate = async () => {
    if (!editingTag || !newTagName.trim()) return;

    await updateMutation.mutateAsync({
      id: editingTag.id,
      name: newTagName.trim(),
      color: newTagColor,
      priority: newTagPriority,
    });
    resetForm();
  };

  const handleDelete = async (id: string) => {
    await deleteMutation.mutateAsync(id);
  };

  const startEditing = (tag: MaterialTag) => {
    setEditingTag(tag);
    setNewTagName(tag.name);
    setNewTagColor(tag.color);
    setNewTagPriority(tag.priority);
    setIsAddingNew(false);
  };

  const getPriorityLabel = (priority: number) => {
    return PRIORITY_OPTIONS.find((p) => p.value === priority)?.name || "Baja";
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Tag className="h-5 w-5" />
            Gestionar Etiquetas
          </DialogTitle>
          <DialogDescription>
            Crea y administra etiquetas para clasificar los materiales formativos.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Tag List */}
          {isLoading ? (
            <div className="flex justify-center py-4">
              <Loader2 className="h-6 w-6 animate-spin" />
            </div>
          ) : (
            <div className="space-y-2">
              {tags?.map((tag) => (
                <div
                  key={tag.id}
                  className="flex items-center justify-between p-3 rounded-lg border bg-card"
                >
                  <div className="flex items-center gap-3">
                    <Badge
                      style={{ backgroundColor: tag.color }}
                      className="text-white"
                    >
                      {tag.name}
                    </Badge>
                    <span className="text-sm text-muted-foreground">
                      Prioridad: {getPriorityLabel(tag.priority)}
                    </span>
                  </div>
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => startEditing(tag)}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDelete(tag.id)}
                      disabled={deleteMutation.isPending}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              ))}

              {tags?.length === 0 && !isAddingNew && (
                <p className="text-center text-muted-foreground py-4">
                  No hay etiquetas. Crea la primera.
                </p>
              )}
            </div>
          )}

          {/* Add/Edit Form */}
          {(isAddingNew || editingTag) && (
            <div className="space-y-4 p-4 rounded-lg border bg-muted/50">
              <div className="space-y-2">
                <Label>Nombre de la etiqueta</Label>
                <Input
                  value={newTagName}
                  onChange={(e) => setNewTagName(e.target.value)}
                  placeholder="Ej: Importante, Nuevo, Actualizado..."
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Color</Label>
                  <Select value={newTagColor} onValueChange={setNewTagColor}>
                    <SelectTrigger>
                      <SelectValue>
                        <div className="flex items-center gap-2">
                          <div
                            className="w-4 h-4 rounded-full"
                            style={{ backgroundColor: newTagColor }}
                          />
                          {TAG_COLORS.find((c) => c.value === newTagColor)?.name}
                        </div>
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      {TAG_COLORS.map((color) => (
                        <SelectItem key={color.value} value={color.value}>
                          <div className="flex items-center gap-2">
                            <div
                              className="w-4 h-4 rounded-full"
                              style={{ backgroundColor: color.value }}
                            />
                            {color.name}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Prioridad</Label>
                  <Select
                    value={newTagPriority.toString()}
                    onValueChange={(v) => setNewTagPriority(parseInt(v))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {PRIORITY_OPTIONS.map((priority) => (
                        <SelectItem
                          key={priority.value}
                          value={priority.value.toString()}
                        >
                          {priority.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex gap-2 justify-end">
                <Button variant="outline" onClick={resetForm}>
                  Cancelar
                </Button>
                <Button
                  onClick={editingTag ? handleUpdate : handleCreate}
                  disabled={
                    !newTagName.trim() ||
                    createMutation.isPending ||
                    updateMutation.isPending
                  }
                >
                  {(createMutation.isPending || updateMutation.isPending) && (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  )}
                  {editingTag ? "Guardar" : "Crear"}
                </Button>
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          {!isAddingNew && !editingTag && (
            <Button onClick={() => setIsAddingNew(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Nueva Etiqueta
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
