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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { 
  ChevronRight, 
  ChevronDown, 
  Folder, 
  FolderOpen, 
  Plus, 
  Edit, 
  Trash2,
  Loader2,
  GripVertical,
  Layers,
  ArrowUp,
  ArrowDown,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  MaterialCategory,
  useMaterialCategories,
  useCreateMaterialCategory,
  useUpdateMaterialCategory,
  useDeleteMaterialCategory,
} from "@/hooks/useMaterialCategories";
import {
  CategorySection,
  useCategorySections,
  useCreateCategorySection,
  useUpdateCategorySection,
  useDeleteCategorySection,
  useReorderCategorySections,
  useReorderCategories,
} from "@/hooks/useCategorySections";

// Predefined colors for categories
const CATEGORY_COLORS = [
  "#6366f1", "#8b5cf6", "#a855f7", "#d946ef", "#ec4899", "#f43f5e",
  "#ef4444", "#f97316", "#f59e0b", "#eab308", "#84cc16", "#22c55e",
  "#10b981", "#14b8a6", "#06b6d4", "#0ea5e9", "#3b82f6", "#6b7280",
];

interface CategoryManagerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface CategoryItemProps {
  category: MaterialCategory;
  level: number;
  sections: CategorySection[];
  onEdit: (category: MaterialCategory) => void;
  onDelete: (category: MaterialCategory) => void;
  onAddChild: (parentId: string) => void;
  onMoveUp: (category: MaterialCategory) => void;
  onMoveDown: (category: MaterialCategory) => void;
  isFirst: boolean;
  isLast: boolean;
}

const CategoryItem: React.FC<CategoryItemProps> = ({
  category,
  level,
  sections,
  onEdit,
  onDelete,
  onAddChild,
  onMoveUp,
  onMoveDown,
  isFirst,
  isLast,
}) => {
  const [isOpen, setIsOpen] = useState(level < 2);
  const hasChildren = category.children && category.children.length > 0;
  const section = sections.find(s => s.id === category.section_id);

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
          <GripVertical className="h-4 w-4 text-muted-foreground cursor-grab" />
          
          <CollapsibleTrigger asChild disabled={!hasChildren}>
            <Button variant="ghost" size="icon" className="h-6 w-6 p-0">
              {hasChildren ? (
                isOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />
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
          
          {section && (
            <span 
              className="text-xs px-1.5 py-0.5 rounded text-white"
              style={{ backgroundColor: section.color }}
            >
              {section.name}
            </span>
          )}

          <div className="opacity-0 group-hover:opacity-100 flex items-center gap-1 transition-opacity">
            {!isFirst && (
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6"
                onClick={() => onMoveUp(category)}
                title="Mover arriba"
              >
                <ArrowUp className="h-3 w-3" />
              </Button>
            )}
            {!isLast && (
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6"
                onClick={() => onMoveDown(category)}
                title="Mover abajo"
              >
                <ArrowDown className="h-3 w-3" />
              </Button>
            )}
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
            {category.children!.map((child, idx) => (
              <CategoryItem
                key={child.id}
                category={child}
                level={level + 1}
                sections={sections}
                onEdit={onEdit}
                onDelete={onDelete}
                onAddChild={onAddChild}
                onMoveUp={onMoveUp}
                onMoveDown={onMoveDown}
                isFirst={idx === 0}
                isLast={idx === category.children!.length - 1}
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
  const { data: categories, isLoading: categoriesLoading } = useMaterialCategories();
  const { data: sections, isLoading: sectionsLoading } = useCategorySections();
  const createCategoryMutation = useCreateMaterialCategory();
  const updateCategoryMutation = useUpdateMaterialCategory();
  const deleteCategoryMutation = useDeleteMaterialCategory();
  const createSectionMutation = useCreateCategorySection();
  const updateSectionMutation = useUpdateCategorySection();
  const deleteSectionMutation = useDeleteCategorySection();
  const reorderSectionsMutation = useReorderCategorySections();
  const reorderCategoriesMutation = useReorderCategories();

  const [activeTab, setActiveTab] = useState("categories");
  const [editingCategory, setEditingCategory] = useState<MaterialCategory | null>(null);
  const [deletingCategory, setDeletingCategory] = useState<MaterialCategory | null>(null);
  const [editingSection, setEditingSection] = useState<CategorySection | null>(null);
  const [deletingSection, setDeletingSection] = useState<CategorySection | null>(null);
  const [parentIdForNew, setParentIdForNew] = useState<string | null>(null);
  const [isCategoryFormOpen, setIsCategoryFormOpen] = useState(false);
  const [isSectionFormOpen, setIsSectionFormOpen] = useState(false);
  
  // Category form
  const [formName, setFormName] = useState("");
  const [formDescription, setFormDescription] = useState("");
  const [formColor, setFormColor] = useState(CATEGORY_COLORS[0]);
  const [formSectionId, setFormSectionId] = useState<string>("");

  // Section form
  const [sectionName, setSectionName] = useState("");
  const [sectionDescription, setSectionDescription] = useState("");
  const [sectionColor, setSectionColor] = useState(CATEGORY_COLORS[0]);

  const isLoading = categoriesLoading || sectionsLoading;

  // Category handlers
  const handleAddRootCategory = () => {
    setEditingCategory(null);
    setParentIdForNew(null);
    setFormName("");
    setFormDescription("");
    setFormColor(CATEGORY_COLORS[Math.floor(Math.random() * CATEGORY_COLORS.length)]);
    setFormSectionId("");
    setIsCategoryFormOpen(true);
  };

  const handleAddChildCategory = (parentId: string) => {
    setEditingCategory(null);
    setParentIdForNew(parentId);
    setFormName("");
    setFormDescription("");
    const parentCat = categories?.flat.find(c => c.id === parentId);
    setFormColor(parentCat?.color || CATEGORY_COLORS[Math.floor(Math.random() * CATEGORY_COLORS.length)]);
    setFormSectionId(parentCat?.section_id || "");
    setIsCategoryFormOpen(true);
  };

  const handleEditCategory = (category: MaterialCategory) => {
    setEditingCategory(category);
    setParentIdForNew(null);
    setFormName(category.name);
    setFormDescription(category.description || "");
    setFormColor(category.color || CATEGORY_COLORS[0]);
    setFormSectionId(category.section_id || "");
    setIsCategoryFormOpen(true);
  };

  const handleSubmitCategory = async () => {
    if (!formName.trim()) return;

    if (editingCategory) {
      await updateCategoryMutation.mutateAsync({
        id: editingCategory.id,
        name: formName,
        description: formDescription || undefined,
        color: formColor,
        section_id: formSectionId || null,
      });
    } else {
      await createCategoryMutation.mutateAsync({
        name: formName,
        description: formDescription || undefined,
        parent_id: parentIdForNew || undefined,
        color: formColor,
        section_id: formSectionId || undefined,
      });
    }

    setIsCategoryFormOpen(false);
    resetCategoryForm();
  };

  const resetCategoryForm = () => {
    setFormName("");
    setFormDescription("");
    setFormColor(CATEGORY_COLORS[0]);
    setFormSectionId("");
    setEditingCategory(null);
    setParentIdForNew(null);
  };

  const handleConfirmDeleteCategory = async () => {
    if (deletingCategory) {
      await deleteCategoryMutation.mutateAsync(deletingCategory.id);
      setDeletingCategory(null);
    }
  };

  const handleMoveCategoryUp = (category: MaterialCategory) => {
    const siblings = categories?.tree.filter(c => c.parent_id === category.parent_id) || [];
    const idx = siblings.findIndex(c => c.id === category.id);
    if (idx <= 0) return;
    
    const updates = siblings.map((c, i) => ({
      id: c.id,
      order_index: i === idx ? siblings[idx - 1].order_index : i === idx - 1 ? category.order_index : c.order_index,
    }));
    reorderCategoriesMutation.mutate(updates);
  };

  const handleMoveCategoryDown = (category: MaterialCategory) => {
    const siblings = categories?.tree.filter(c => c.parent_id === category.parent_id) || [];
    const idx = siblings.findIndex(c => c.id === category.id);
    if (idx >= siblings.length - 1) return;
    
    const updates = siblings.map((c, i) => ({
      id: c.id,
      order_index: i === idx ? siblings[idx + 1].order_index : i === idx + 1 ? category.order_index : c.order_index,
    }));
    reorderCategoriesMutation.mutate(updates);
  };

  // Section handlers
  const handleAddSection = () => {
    setEditingSection(null);
    setSectionName("");
    setSectionDescription("");
    setSectionColor(CATEGORY_COLORS[Math.floor(Math.random() * CATEGORY_COLORS.length)]);
    setIsSectionFormOpen(true);
  };

  const handleEditSection = (section: CategorySection) => {
    setEditingSection(section);
    setSectionName(section.name);
    setSectionDescription(section.description || "");
    setSectionColor(section.color);
    setIsSectionFormOpen(true);
  };

  const handleSubmitSection = async () => {
    if (!sectionName.trim()) return;

    if (editingSection) {
      await updateSectionMutation.mutateAsync({
        id: editingSection.id,
        name: sectionName,
        description: sectionDescription || undefined,
        color: sectionColor,
      });
    } else {
      await createSectionMutation.mutateAsync({
        name: sectionName,
        description: sectionDescription || undefined,
        color: sectionColor,
      });
    }

    setIsSectionFormOpen(false);
    resetSectionForm();
  };

  const resetSectionForm = () => {
    setSectionName("");
    setSectionDescription("");
    setSectionColor(CATEGORY_COLORS[0]);
    setEditingSection(null);
  };

  const handleConfirmDeleteSection = async () => {
    if (deletingSection) {
      await deleteSectionMutation.mutateAsync(deletingSection.id);
      setDeletingSection(null);
    }
  };

  const handleMoveSectionUp = (section: CategorySection) => {
    const idx = sections?.findIndex(s => s.id === section.id) ?? -1;
    if (idx <= 0 || !sections) return;
    
    const updates = sections.map((s, i) => ({
      id: s.id,
      order_index: i === idx ? sections[idx - 1].order_index : i === idx - 1 ? section.order_index : s.order_index,
    }));
    reorderSectionsMutation.mutate(updates);
  };

  const handleMoveSectionDown = (section: CategorySection) => {
    const idx = sections?.findIndex(s => s.id === section.id) ?? -1;
    if (idx >= (sections?.length ?? 0) - 1 || !sections) return;
    
    const updates = sections.map((s, i) => ({
      id: s.id,
      order_index: i === idx ? sections[idx + 1].order_index : i === idx + 1 ? section.order_index : s.order_index,
    }));
    reorderSectionsMutation.mutate(updates);
  };

  const isPending = createCategoryMutation.isPending || updateCategoryMutation.isPending || 
                    createSectionMutation.isPending || updateSectionMutation.isPending;

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle>Gestionar Categorías</DialogTitle>
            <DialogDescription>
              Organiza el material formativo en secciones y categorías con colores distintivos.
            </DialogDescription>
          </DialogHeader>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 overflow-hidden flex flex-col">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="categories" className="gap-2">
                <Folder className="h-4 w-4" />
                Categorías
              </TabsTrigger>
              <TabsTrigger value="sections" className="gap-2">
                <Layers className="h-4 w-4" />
                Secciones
              </TabsTrigger>
            </TabsList>

            <TabsContent value="categories" className="flex-1 overflow-y-auto mt-4">
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
                  {categories?.tree.map((category, idx) => (
                    <CategoryItem
                      key={category.id}
                      category={category}
                      level={0}
                      sections={sections || []}
                      onEdit={handleEditCategory}
                      onDelete={setDeletingCategory}
                      onAddChild={handleAddChildCategory}
                      onMoveUp={handleMoveCategoryUp}
                      onMoveDown={handleMoveCategoryDown}
                      isFirst={idx === 0}
                      isLast={idx === categories.tree.length - 1}
                    />
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="sections" className="flex-1 overflow-y-auto mt-4">
              {sectionsLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                </div>
              ) : !sections?.length ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Layers className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>No hay secciones creadas</p>
                  <p className="text-sm">Las secciones te ayudan a agrupar categorías por tema.</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {sections.map((section, idx) => (
                    <div
                      key={section.id}
                      className="flex items-center gap-2 p-3 rounded-lg border bg-card hover:bg-accent/50 group"
                    >
                      <GripVertical className="h-4 w-4 text-muted-foreground cursor-grab" />
                      <div 
                        className="w-4 h-4 rounded-full shrink-0" 
                        style={{ backgroundColor: section.color }}
                      />
                      <div className="flex-1">
                        <p className="font-medium text-sm">{section.name}</p>
                        {section.description && (
                          <p className="text-xs text-muted-foreground">{section.description}</p>
                        )}
                      </div>
                      <div className="opacity-0 group-hover:opacity-100 flex items-center gap-1 transition-opacity">
                        {idx > 0 && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7"
                            onClick={() => handleMoveSectionUp(section)}
                          >
                            <ArrowUp className="h-3 w-3" />
                          </Button>
                        )}
                        {idx < sections.length - 1 && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7"
                            onClick={() => handleMoveSectionDown(section)}
                          >
                            <ArrowDown className="h-3 w-3" />
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7"
                          onClick={() => handleEditSection(section)}
                        >
                          <Edit className="h-3 w-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-destructive hover:text-destructive"
                          onClick={() => setDeletingSection(section)}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>

          <DialogFooter className="mt-4">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cerrar
            </Button>
            {activeTab === "categories" ? (
              <Button onClick={handleAddRootCategory}>
                <Plus className="h-4 w-4 mr-2" />
                Nueva Categoría
              </Button>
            ) : (
              <Button onClick={handleAddSection}>
                <Plus className="h-4 w-4 mr-2" />
                Nueva Sección
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Category Form Dialog */}
      <Dialog open={isCategoryFormOpen} onOpenChange={setIsCategoryFormOpen}>
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
              <Label>Sección</Label>
              <Select 
                value={formSectionId || "none"} 
                onValueChange={(val) => setFormSectionId(val === "none" ? "" : val)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sin sección" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Sin sección</SelectItem>
                  {sections?.map((section) => (
                    <SelectItem key={section.id} value={section.id}>
                      <div className="flex items-center gap-2">
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: section.color }}
                        />
                        {section.name}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
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
            <Button variant="outline" onClick={() => setIsCategoryFormOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSubmitCategory} disabled={isPending || !formName.trim()}>
              {isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {editingCategory ? "Guardar" : "Crear"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Section Form Dialog */}
      <Dialog open={isSectionFormOpen} onOpenChange={setIsSectionFormOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingSection ? "Editar Sección" : "Nueva Sección"}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="section-name">Nombre *</Label>
              <Input
                id="section-name"
                value={sectionName}
                onChange={(e) => setSectionName(e.target.value)}
                placeholder="Nombre de la sección"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="section-desc">Descripción</Label>
              <Input
                id="section-desc"
                value={sectionDescription}
                onChange={(e) => setSectionDescription(e.target.value)}
                placeholder="Descripción opcional"
              />
            </div>
            <div className="space-y-2">
              <Label>Color de la sección</Label>
              <div className="flex flex-wrap gap-2">
                {CATEGORY_COLORS.map((color) => (
                  <button
                    key={color}
                    type="button"
                    className={cn(
                      "w-8 h-8 rounded-full border-2 transition-all hover:scale-110",
                      sectionColor === color ? "border-foreground ring-2 ring-offset-2 ring-foreground" : "border-transparent"
                    )}
                    style={{ backgroundColor: color }}
                    onClick={() => setSectionColor(color)}
                    title={color}
                  />
                ))}
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsSectionFormOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSubmitSection} disabled={isPending || !sectionName.trim()}>
              {isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {editingSection ? "Guardar" : "Crear"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Category Confirmation */}
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
              onClick={handleConfirmDeleteCategory}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Section Confirmation */}
      <AlertDialog open={!!deletingSection} onOpenChange={(o) => !o && setDeletingSection(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar esta sección?</AlertDialogTitle>
            <AlertDialogDescription>
              Se eliminará la sección "{deletingSection?.name}". Las categorías asociadas quedarán sin sección asignada.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDeleteSection}
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
