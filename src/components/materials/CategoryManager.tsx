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

          {isOpen && hasChildren ? (
            <FolderOpen className="h-4 w-4 text-amber-500" />
          ) : (
            <Folder className="h-4 w-4 text-amber-500" />
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

  const handleAddRoot = () => {
    setEditingCategory(null);
    setParentIdForNew(null);
    setFormName("");
    setFormDescription("");
    setIsFormOpen(true);
  };

  const handleAddChild = (parentId: string) => {
    setEditingCategory(null);
    setParentIdForNew(parentId);
    setFormName("");
    setFormDescription("");
    setIsFormOpen(true);
  };

  const handleEdit = (category: MaterialCategory) => {
    setEditingCategory(category);
    setParentIdForNew(null);
    setFormName(category.name);
    setFormDescription(category.description || "");
    setIsFormOpen(true);
  };

  const handleSubmitForm = async () => {
    if (!formName.trim()) return;

    if (editingCategory) {
      await updateMutation.mutateAsync({
        id: editingCategory.id,
        name: formName,
        description: formDescription || undefined,
      });
    } else {
      await createMutation.mutateAsync({
        name: formName,
        description: formDescription || undefined,
        parent_id: parentIdForNew || undefined,
      });
    }

    setIsFormOpen(false);
    setFormName("");
    setFormDescription("");
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
              Organiza el material formativo en categorías y subcategorías.
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
