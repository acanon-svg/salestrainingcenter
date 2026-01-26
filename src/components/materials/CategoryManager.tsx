import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
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
} from "@/components/ui/alert-dialog";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { 
  ChevronRight, 
  ChevronDown, 
  Folder, 
  FolderOpen, 
  Plus, 
  Edit, 
  Trash2,
  Loader2 
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  MaterialCategory,
  useMaterialCategories,
  useCreateMaterialCategory,
  useUpdateMaterialCategory,
  useDeleteMaterialCategory,
} from "@/hooks/useMaterialCategories";

// Predefined colors for categories
const CATEGORY_COLORS = [
  "#6366f1", // Indigo
  "#8b5cf6", // Violet
  "#a855f7", // Purple
  "#d946ef", // Fuchsia
  "#ec4899", // Pink
  "#f43f5e", // Rose
  "#ef4444", // Red
  "#f97316", // Orange
  "#f59e0b", // Amber
  "#eab308", // Yellow
  "#84cc16", // Lime
  "#22c55e", // Green
  "#10b981", // Emerald
  "#14b8a6", // Teal
  "#06b6d4", // Cyan
  "#0ea5e9", // Sky
  "#3b82f6", // Blue
  "#6b7280", // Gray
];

interface CategoryManagerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface CategoryItemProps {
  category: MaterialCategory;
  level: number;
  onEdit: (category: MaterialCategory) => void;
  onDelete: (category: MaterialCategory) => void;
  onAddChild: (parentId: string) => void;
}

const CategoryItem: React.FC<CategoryItemProps> = ({
  category,
  level,
  onEdit,
  onDelete,
  onAddChild,
}) => {
  const [isOpen, setIsOpen] = useState(level < 2);
  const hasChildren = category.children && category.children.length > 0;

  return (
    <div className="select-none">
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <div
          className={cn(
            "flex items-center gap-2 py-2 px-2 rounded-md hover:bg-accent group",
            level > 0 && "ml-4"
          )}
          style={{ borderLeft: level > 0 ? `3px solid ${category.color}` : undefined }}
        >
          <CollapsibleTrigger asChild disabled={!hasChildren}>
            <Button variant="ghost" size="icon" className="h-6 w-6 p-0">
              {hasChildren ? (
                isOpen ? (
                  <ChevronDown className="h-4 w-4" />
                ) : (
                  <ChevronRight className="h-4 w-4" />
                )
              ) : (
                <span className="w-4" />
              )}
            </Button>
          </CollapsibleTrigger>

          <div 
            className="w-4 h-4 rounded-full shrink-0" 
            style={{ backgroundColor: category.color }}
          />

          {isOpen && hasChildren ? (
            <FolderOpen className="h-4 w-4" style={{ color: category.color }} />
          ) : (
            <Folder className="h-4 w-4" style={{ color: category.color }} />
          )}

          <span className="flex-1 text-sm font-medium truncate">{category.name}</span>

          <div className="opacity-0 group-hover:opacity-100 flex items-center gap-1 transition-opacity">
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              onClick={() => onAddChild(category.id)}
              title="Añadir subcategoría"
            >
              <Plus className="h-3 w-3" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              onClick={() => onEdit(category)}
              title="Editar"
            >
              <Edit className="h-3 w-3" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 text-destructive hover:text-destructive"
              onClick={() => onDelete(category)}
              title="Eliminar"
            >
              <Trash2 className="h-3 w-3" />
            </Button>
          </div>
        </div>

        {hasChildren && (
          <CollapsibleContent>
            {category.children!.map((child) => (
              <CategoryItem
                key={child.id}
                category={child}
                level={level + 1}
                onEdit={onEdit}
                onDelete={onDelete}
                onAddChild={onAddChild}
              />
            ))}
          </CollapsibleContent>
        )}
      </Collapsible>
    </div>
  );
};

export const CategoryManager: React.FC<CategoryManagerProps> = ({
  open,
  onOpenChange,
}) => {
  const { data: categories, isLoading } = useMaterialCategories();
  const createMutation = useCreateMaterialCategory();
  const updateMutation = useUpdateMaterialCategory();
  const deleteMutation = useDeleteMaterialCategory();

  const [editingCategory, setEditingCategory] = useState<MaterialCategory | null>(null);
  const [deletingCategory, setDeletingCategory] = useState<MaterialCategory | null>(null);
  const [parentIdForNew, setParentIdForNew] = useState<string | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [formName, setFormName] = useState("");
  const [formDescription, setFormDescription] = useState("");
  const [formColor, setFormColor] = useState(CATEGORY_COLORS[0]);

  const handleAddRoot = () => {
    setEditingCategory(null);
    setParentIdForNew(null);
    setFormName("");
    setFormDescription("");
    setFormColor(CATEGORY_COLORS[Math.floor(Math.random() * CATEGORY_COLORS.length)]);
    setIsFormOpen(true);
  };

  const handleAddChild = (parentId: string) => {
    setEditingCategory(null);
    setParentIdForNew(parentId);
    setFormName("");
    setFormDescription("");
    // Inherit parent color or random
    const parentCat = categories?.flat.find(c => c.id === parentId);
    setFormColor(parentCat?.color || CATEGORY_COLORS[Math.floor(Math.random() * CATEGORY_COLORS.length)]);
    setIsFormOpen(true);
  };

  const handleEdit = (category: MaterialCategory) => {
    setEditingCategory(category);
    setParentIdForNew(null);
    setFormName(category.name);
    setFormDescription(category.description || "");
    setFormColor(category.color || CATEGORY_COLORS[0]);
    setIsFormOpen(true);
  };

  const handleSubmitForm = async () => {
    if (!formName.trim()) return;

    if (editingCategory) {
      await updateMutation.mutateAsync({
        id: editingCategory.id,
        name: formName,
        description: formDescription || undefined,
        color: formColor,
      });
    } else {
      await createMutation.mutateAsync({
        name: formName,
        description: formDescription || undefined,
        parent_id: parentIdForNew || undefined,
        color: formColor,
      });
    }

    setIsFormOpen(false);
    setFormName("");
    setFormDescription("");
    setFormColor(CATEGORY_COLORS[0]);
    setEditingCategory(null);
    setParentIdForNew(null);
  };

  const handleConfirmDelete = async () => {
    if (deletingCategory) {
      await deleteMutation.mutateAsync(deletingCategory.id);
      setDeletingCategory(null);
    }
  };

  const isPending = createMutation.isPending || updateMutation.isPending;

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-lg max-h-[80vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle>Gestionar Categorías</DialogTitle>
            <DialogDescription>
              Organiza el material formativo en categorías y subcategorías con colores distintivos.
            </DialogDescription>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto py-4">
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
              </div>
            ) : categories?.tree.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Folder className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>No hay categorías creadas</p>
                <p className="text-sm">Crea la primera categoría para organizar tu material.</p>
              </div>
            ) : (
              <div className="space-y-1">
                {categories?.tree.map((category) => (
                  <CategoryItem
                    key={category.id}
                    category={category}
                    level={0}
                    onEdit={handleEdit}
                    onDelete={setDeletingCategory}
                    onAddChild={handleAddChild}
                  />
                ))}
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cerrar
            </Button>
            <Button onClick={handleAddRoot}>
              <Plus className="h-4 w-4 mr-2" />
              Nueva Categoría
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Form Dialog for Create/Edit */}
      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingCategory
                ? "Editar Categoría"
                : parentIdForNew
                ? "Nueva Subcategoría"
                : "Nueva Categoría"}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="cat-name">Nombre *</Label>
              <Input
                id="cat-name"
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                placeholder="Nombre de la categoría"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="cat-desc">Descripción</Label>
              <Input
                id="cat-desc"
                value={formDescription}
                onChange={(e) => setFormDescription(e.target.value)}
                placeholder="Descripción opcional"
              />
            </div>
            <div className="space-y-2">
              <Label>Color de la categoría</Label>
              <div className="flex flex-wrap gap-2">
                {CATEGORY_COLORS.map((color) => (
                  <button
                    key={color}
                    type="button"
                    className={cn(
                      "w-8 h-8 rounded-full border-2 transition-all hover:scale-110",
                      formColor === color ? "border-foreground ring-2 ring-offset-2 ring-foreground" : "border-transparent"
                    )}
                    style={{ backgroundColor: color }}
                    onClick={() => setFormColor(color)}
                    title={color}
                  />
                ))}
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsFormOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSubmitForm} disabled={isPending || !formName.trim()}>
              {isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {editingCategory ? "Guardar" : "Crear"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deletingCategory} onOpenChange={(o) => !o && setDeletingCategory(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar esta categoría?</AlertDialogTitle>
            <AlertDialogDescription>
              Se eliminará la categoría "{deletingCategory?.name}" y todas sus subcategorías. Los materiales asociados quedarán sin categoría.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};
