import React, { useState, useMemo, useEffect } from "react";
import { useParams } from "react-router-dom";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { useAuth } from "@/contexts/AuthContext";
import { useTrainingMaterials, useDeleteTrainingMaterial, TrainingMaterial } from "@/hooks/useTrainingMaterials";
import { useMaterialCategories, MaterialCategory } from "@/hooks/useMaterialCategories";
import { useCategorySections, CategorySection } from "@/hooks/useCategorySections";
import { useMaterialTags } from "@/hooks/useMaterialTags";
import { MaterialListItem } from "@/components/materials/MaterialListItem";
import { MaterialViewer } from "@/components/materials/MaterialViewer";
import { MaterialForm } from "@/components/materials/MaterialForm";
import { CategoryManager } from "@/components/materials/CategoryManager";
import { TagManager } from "@/components/materials/TagManager";
import { GlossaryManager } from "@/components/glossary/GlossaryManager";
import { EnhancedSearch } from "@/components/materials/EnhancedSearch";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Video, FileText, Link as LinkIcon, FolderOpen, Loader2, Folder, ChevronRight, ChevronDown, Settings, Tag, X, List, BookOpen, Layers } from "lucide-react";

const TrainingMaterials: React.FC = () => {
  const { id: materialIdParam } = useParams<{ id?: string }>();
  const { hasRole } = useAuth();
  const isCreator = hasRole("creator") || hasRole("admin");

  // For students, only show published materials
  const { data: materials, isLoading } = useTrainingMaterials({ onlyPublished: !isCreator });
  const { data: categories } = useMaterialCategories();
  const { data: sections } = useCategorySections();
  const { data: tags } = useMaterialTags();
  const deleteMutation = useDeleteTrainingMaterial();

  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [tagFilter, setTagFilter] = useState<string>("all");
  const [viewingMaterial, setViewingMaterial] = useState<TrainingMaterial | null>(null);
  const [editingMaterial, setEditingMaterial] = useState<TrainingMaterial | null>(null);
  const [deletingMaterial, setDeletingMaterial] = useState<TrainingMaterial | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isCategoryManagerOpen, setIsCategoryManagerOpen] = useState(false);
  const [isTagManagerOpen, setIsTagManagerOpen] = useState(false);
  const [isGlossaryOpen, setIsGlossaryOpen] = useState(false);
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set());

  // Auto-open material viewer when navigating to /materials/:id
  useEffect(() => {
    if (materialIdParam && materials && !isLoading) {
      const mat = materials.find((m) => m.id === materialIdParam);
      if (mat) {
        setViewingMaterial(mat);
      }
    }
  }, [materialIdParam, materials, isLoading]);
  // Search by keywords in title, description, content, and keywords array
  const filteredMaterials = useMemo(() => {
    return materials?.filter((material) => {
      const searchLower = searchQuery.toLowerCase();
      const keywordsMatch = material.keywords?.some((k) => k.toLowerCase().includes(searchLower));
      const matchesSearch =
        !searchQuery ||
        material.title.toLowerCase().includes(searchLower) ||
        material.description?.toLowerCase().includes(searchLower) ||
        material.content_text?.toLowerCase().includes(searchLower) ||
        keywordsMatch;
      const matchesType = typeFilter === "all" || material.type === typeFilter;
      const matchesCategory = 
        categoryFilter === "all" || 
        (categoryFilter === "uncategorized" && !material.category_id) ||
        material.category_id === categoryFilter;
      const matchesTag =
        tagFilter === "all" ||
        (material.tag_ids && material.tag_ids.includes(tagFilter));
      return matchesSearch && matchesType && matchesCategory && matchesTag;
    });
  }, [materials, searchQuery, typeFilter, categoryFilter, tagFilter]);

  // Group materials by category for tree view
  const materialsByCategory = useMemo(() => {
    const grouped: Record<string, TrainingMaterial[]> = { uncategorized: [] };
    
    categories?.flat.forEach((cat) => {
      grouped[cat.id] = [];
    });

    filteredMaterials?.forEach((mat) => {
      if (mat.category_id && grouped[mat.category_id]) {
        grouped[mat.category_id].push(mat);
      } else {
        grouped.uncategorized.push(mat);
      }
    });

    return grouped;
  }, [filteredMaterials, categories]);

  const toggleCategory = (categoryId: string) => {
    setExpandedCategories((prev) => {
      const next = new Set(prev);
      if (next.has(categoryId)) {
        next.delete(categoryId);
      } else {
        next.add(categoryId);
      }
      return next;
    });
  };

  const toggleSection = (sectionId: string) => {
    setExpandedSections((prev) => {
      const next = new Set(prev);
      if (next.has(sectionId)) {
        next.delete(sectionId);
      } else {
        next.add(sectionId);
      }
      return next;
    });
  };

  // Group categories by section
  const categoriesBySection = useMemo(() => {
    const grouped: Record<string, MaterialCategory[]> = { uncategorized: [] };
    
    sections?.forEach((section) => {
      grouped[section.id] = [];
    });

    categories?.flat.filter(cat => !cat.parent_id).forEach((cat) => {
      if (cat.section_id && grouped[cat.section_id]) {
        grouped[cat.section_id].push(cat);
      } else {
        grouped.uncategorized.push(cat);
      }
    });

    return grouped;
  }, [categories, sections]);

  // Count materials in a section (across all its categories)
  const getMaterialsCountForSection = (sectionId: string): number => {
    const sectionCategories = categoriesBySection[sectionId] || [];
    let count = 0;
    sectionCategories.forEach(cat => {
      count += (materialsByCategory[cat.id]?.length || 0);
      cat.children?.forEach(child => {
        count += (materialsByCategory[child.id]?.length || 0);
      });
    });
    return count;
  };

  const handleView = (material: TrainingMaterial) => {
    setViewingMaterial(material);
  };

  const handleEdit = (material: TrainingMaterial) => {
    setEditingMaterial(material);
    setIsFormOpen(true);
  };

  const handleDelete = (material: TrainingMaterial) => {
    setDeletingMaterial(material);
  };

  const confirmDelete = async () => {
    if (deletingMaterial) {
      await deleteMutation.mutateAsync(deletingMaterial.id);
      setDeletingMaterial(null);
    }
  };

  const handleFormClose = (open: boolean) => {
    setIsFormOpen(open);
    if (!open) {
      setEditingMaterial(null);
    }
  };

  const videoMaterials = filteredMaterials?.filter((m) => m.type === "video") || [];
  const documentMaterials = filteredMaterials?.filter((m) => m.type === "documento") || [];
  const linkMaterials = filteredMaterials?.filter((m) => m.type === "link") || [];

  // Helper to get category by ID
  const getCategoryById = (id: string | null): MaterialCategory | undefined => {
    if (!id) return undefined;
    return categories?.flat.find((c) => c.id === id);
  };

  // Render category with its materials
  const renderCategorySection = (category: MaterialCategory, level: number = 0) => {
    const categoryMaterials = materialsByCategory[category.id] || [];
    const hasChildren = category.children && category.children.length > 0;
    const hasMaterials = categoryMaterials.length > 0;
    const isExpanded = expandedCategories.has(category.id);
    const totalMaterials = categoryMaterials.length + 
      (category.children?.reduce((acc, child) => acc + (materialsByCategory[child.id]?.length || 0), 0) || 0);

    if (totalMaterials === 0 && !hasChildren) return null;

    return (
      <div key={category.id} className={level > 0 ? "ml-4" : ""}>
        <Collapsible open={isExpanded} onOpenChange={() => toggleCategory(category.id)}>
          <CollapsibleTrigger asChild>
            <Button
              variant="ghost"
              className="w-full justify-start gap-2 mb-2 hover:bg-accent"
              style={{ borderLeft: `4px solid ${category.color}` }}
            >
              {isExpanded ? (
                <ChevronDown className="h-4 w-4" />
              ) : (
                <ChevronRight className="h-4 w-4" />
              )}
              <div 
                className="w-4 h-4 rounded-full shrink-0" 
                style={{ backgroundColor: category.color }}
              />
              <Folder className="h-4 w-4" style={{ color: category.color }} />
              <span className="font-medium">{category.name}</span>
              <span className="text-muted-foreground text-sm">({totalMaterials})</span>
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent>
            {hasMaterials && (
              <div className="space-y-2 mb-4">
                {categoryMaterials.map((material) => (
                  <MaterialListItem
                    key={material.id}
                    material={material}
                    isCreator={isCreator}
                    category={category}
                    tags={tags || []}
                    onView={handleView}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                  />
                ))}
              </div>
            )}
            {hasChildren && category.children!.map((child) => renderCategorySection(child, level + 1))}
          </CollapsibleContent>
        </Collapsible>
      </div>
    );
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold">Material Formativo</h1>
            <p className="text-muted-foreground mt-1">
              Centro de recursos y documentación para tu formación - by Alexandra Cañon
            </p>
          </div>
          <div className="flex gap-2">
            {isCreator && (
              <>
                <Button variant="outline" onClick={() => setIsGlossaryOpen(true)}>
                  <BookOpen className="h-4 w-4 mr-2" />
                  Glosario
                </Button>
                <Button variant="outline" onClick={() => setIsTagManagerOpen(true)}>
                  <Tag className="h-4 w-4 mr-2" />
                  Etiquetas
                </Button>
                <Button variant="outline" onClick={() => setIsCategoryManagerOpen(true)}>
                  <Settings className="h-4 w-4 mr-2" />
                  Categorías
                </Button>
                <Button onClick={() => setIsFormOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Nuevo Material
                </Button>
              </>
            )}
          </div>
        </div>

        {/* Enhanced Search and Filters */}
        <div className="flex flex-col gap-4">
          <div className="flex flex-col md:flex-row gap-4">
            <EnhancedSearch
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              materials={materials}
              onViewMaterial={handleView}
              placeholder="Buscar materiales, glosario y preguntas frecuentes..."
            />
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-full md:w-40">
                <SelectValue placeholder="Tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los tipos</SelectItem>
                <SelectItem value="video">Videos</SelectItem>
                <SelectItem value="documento">Documentos</SelectItem>
                <SelectItem value="link">Enlaces</SelectItem>
              </SelectContent>
            </Select>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="Categoría" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas las categorías</SelectItem>
                <SelectItem value="uncategorized">Sin categoría</SelectItem>
                {categories?.flat.map((cat) => (
                  <SelectItem key={cat.id} value={cat.id}>
                    <div className="flex items-center gap-2">
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: cat.color }}
                      />
                      {cat.parent_id && "└ "}{cat.name}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={tagFilter} onValueChange={setTagFilter}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="Etiqueta" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas las etiquetas</SelectItem>
                {tags?.map((tag) => (
                  <SelectItem key={tag.id} value={tag.id}>
                    <div className="flex items-center gap-2">
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: tag.color }}
                      />
                      {tag.name}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Active Filters Display */}
          {(typeFilter !== "all" || categoryFilter !== "all" || tagFilter !== "all" || searchQuery) && (
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-sm text-muted-foreground">Filtros activos:</span>
              {searchQuery && (
                <Badge variant="secondary" className="gap-1">
                  Búsqueda: "{searchQuery}"
                  <button onClick={() => setSearchQuery("")}>
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              )}
              {typeFilter !== "all" && (
                <Badge variant="secondary" className="gap-1">
                  Tipo: {typeFilter}
                  <button onClick={() => setTypeFilter("all")}>
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              )}
              {categoryFilter !== "all" && (
                <Badge 
                  className="gap-1 text-white"
                  style={{ backgroundColor: categoryFilter === "uncategorized" ? "#6b7280" : categories?.flat.find((c) => c.id === categoryFilter)?.color }}
                >
                  {categoryFilter === "uncategorized" ? "Sin categoría" : categories?.flat.find((c) => c.id === categoryFilter)?.name}
                  <button onClick={() => setCategoryFilter("all")}>
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              )}
              {tagFilter !== "all" && (
                <Badge 
                  className="gap-1 text-white"
                  style={{ backgroundColor: tags?.find((t) => t.id === tagFilter)?.color }}
                >
                  {tags?.find((t) => t.id === tagFilter)?.name}
                  <button onClick={() => setTagFilter("all")}>
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setSearchQuery("");
                  setTypeFilter("all");
                  setCategoryFilter("all");
                  setTagFilter("all");
                }}
              >
                Limpiar filtros
              </Button>
            </div>
          )}
        </div>

        {/* Content */}
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : !materials?.length ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <FolderOpen className="h-16 w-16 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium">No hay materiales disponibles</h3>
            <p className="text-muted-foreground mt-1">
              {isCreator
                ? "Comienza creando tu primer material formativo."
                : "No hay materiales publicados para tu equipo aún."}
            </p>
            {isCreator && (
              <Button className="mt-4" onClick={() => setIsFormOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Crear Material
              </Button>
            )}
          </div>
        ) : (
          <Tabs defaultValue="by-category" className="space-y-6">
            <TabsList className="flex-wrap h-auto">
              <TabsTrigger value="by-category" className="gap-2">
                <Folder className="h-4 w-4" />
                Categorías
              </TabsTrigger>
              <TabsTrigger value="videos" className="gap-2">
                <Video className="h-4 w-4" />
                Videos ({videoMaterials.length})
              </TabsTrigger>
              <TabsTrigger value="documents" className="gap-2">
                <FileText className="h-4 w-4" />
                Documentos ({documentMaterials.length})
              </TabsTrigger>
              <TabsTrigger value="links" className="gap-2">
                <LinkIcon className="h-4 w-4" />
                Enlaces ({linkMaterials.length})
              </TabsTrigger>
              <TabsTrigger value="all" className="gap-2">
                <List className="h-4 w-4" />
                Todos ({filteredMaterials?.length || 0})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="all">
              <div className="space-y-2">
                {filteredMaterials?.map((material) => (
                  <MaterialListItem
                    key={material.id}
                    material={material}
                    isCreator={isCreator}
                    category={getCategoryById(material.category_id)}
                    tags={tags || []}
                    onView={handleView}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                  />
                ))}
              </div>
            </TabsContent>

            <TabsContent value="by-category">
              <div className="space-y-4">
                {/* Render sections with their categories */}
                {sections?.map((section) => {
                  const sectionMaterialsCount = getMaterialsCountForSection(section.id);
                  const sectionCategories = categoriesBySection[section.id] || [];
                  const isSectionExpanded = expandedSections.has(section.id);
                  
                  // Skip empty sections for students
                  if (sectionMaterialsCount === 0 && sectionCategories.length === 0) return null;

                  return (
                    <div key={section.id} className="border rounded-lg overflow-hidden">
                      <Collapsible open={isSectionExpanded} onOpenChange={() => toggleSection(section.id)}>
                        <CollapsibleTrigger asChild>
                          <Button
                            variant="ghost"
                            className="w-full justify-start gap-3 p-4 h-auto hover:bg-accent rounded-none"
                            style={{ 
                              backgroundColor: `${section.color}10`,
                              borderLeft: `4px solid ${section.color}`
                            }}
                          >
                            {isSectionExpanded ? (
                              <ChevronDown className="h-5 w-5" style={{ color: section.color }} />
                            ) : (
                              <ChevronRight className="h-5 w-5" style={{ color: section.color }} />
                            )}
                            <Layers className="h-5 w-5" style={{ color: section.color }} />
                            <div className="flex flex-col items-start">
                              <span className="font-semibold text-lg" style={{ color: section.color }}>
                                {section.name}
                              </span>
                              {section.description && (
                                <span className="text-sm text-muted-foreground font-normal">
                                  {section.description}
                                </span>
                              )}
                            </div>
                            <span className="ml-auto text-muted-foreground text-sm">
                              {sectionCategories.length} {sectionCategories.length === 1 ? 'categoría' : 'categorías'} · {sectionMaterialsCount} {sectionMaterialsCount === 1 ? 'material' : 'materiales'}
                            </span>
                          </Button>
                        </CollapsibleTrigger>
                        <CollapsibleContent className="p-4 pt-2 space-y-2 bg-background">
                          {sectionCategories.length > 0 ? (
                            sectionCategories.map((category) => renderCategorySection(category))
                          ) : (
                            <p className="text-sm text-muted-foreground py-2">
                              No hay categorías en esta sección
                            </p>
                          )}
                        </CollapsibleContent>
                      </Collapsible>
                    </div>
                  );
                })}
                
                {/* Categories without section */}
                {categoriesBySection.uncategorized.length > 0 && (
                  <div className="border rounded-lg overflow-hidden">
                    <Collapsible 
                      open={expandedSections.has("no-section")} 
                      onOpenChange={() => toggleSection("no-section")}
                    >
                      <CollapsibleTrigger asChild>
                        <Button
                          variant="ghost"
                          className="w-full justify-start gap-3 p-4 h-auto hover:bg-accent rounded-none"
                          style={{ 
                            backgroundColor: "#6b728010",
                            borderLeft: "4px solid #6b7280"
                          }}
                        >
                          {expandedSections.has("no-section") ? (
                            <ChevronDown className="h-5 w-5 text-muted-foreground" />
                          ) : (
                            <ChevronRight className="h-5 w-5 text-muted-foreground" />
                          )}
                          <Layers className="h-5 w-5 text-muted-foreground" />
                          <div className="flex flex-col items-start">
                            <span className="font-semibold text-lg text-muted-foreground">
                              Sin Sección
                            </span>
                            <span className="text-sm text-muted-foreground font-normal">
                              Categorías sin sección asignada
                            </span>
                          </div>
                          <span className="ml-auto text-muted-foreground text-sm">
                            {categoriesBySection.uncategorized.length} {categoriesBySection.uncategorized.length === 1 ? 'categoría' : 'categorías'}
                          </span>
                        </Button>
                      </CollapsibleTrigger>
                      <CollapsibleContent className="p-4 pt-2 space-y-2 bg-background">
                        {categoriesBySection.uncategorized.map((category) => renderCategorySection(category))}
                      </CollapsibleContent>
                    </Collapsible>
                  </div>
                )}
                
                {/* Uncategorized materials */}
                {materialsByCategory.uncategorized.length > 0 && (
                  <div className="border rounded-lg overflow-hidden">
                    <Collapsible 
                      open={expandedCategories.has("uncategorized")} 
                      onOpenChange={() => toggleCategory("uncategorized")}
                    >
                      <CollapsibleTrigger asChild>
                        <Button
                          variant="ghost"
                          className="w-full justify-start gap-3 p-4 h-auto hover:bg-accent rounded-none"
                          style={{ borderLeft: "4px solid #6b7280" }}
                        >
                          {expandedCategories.has("uncategorized") ? (
                            <ChevronDown className="h-5 w-5 text-muted-foreground" />
                          ) : (
                            <ChevronRight className="h-5 w-5 text-muted-foreground" />
                          )}
                          <FolderOpen className="h-5 w-5 text-muted-foreground" />
                          <span className="font-semibold text-lg text-muted-foreground">Sin categoría</span>
                          <span className="ml-auto text-muted-foreground text-sm">
                            ({materialsByCategory.uncategorized.length})
                          </span>
                        </Button>
                      </CollapsibleTrigger>
                      <CollapsibleContent className="p-4 pt-2 space-y-2 bg-background">
                        {materialsByCategory.uncategorized.map((material) => (
                          <MaterialListItem
                            key={material.id}
                            material={material}
                            isCreator={isCreator}
                            tags={tags || []}
                            onView={handleView}
                            onEdit={handleEdit}
                            onDelete={handleDelete}
                          />
                        ))}
                      </CollapsibleContent>
                    </Collapsible>
                  </div>
                )}
              </div>
            </TabsContent>

            <TabsContent value="videos">
              <div className="space-y-2">
                {videoMaterials.map((material) => (
                  <MaterialListItem
                    key={material.id}
                    material={material}
                    isCreator={isCreator}
                    category={getCategoryById(material.category_id)}
                    tags={tags || []}
                    onView={handleView}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                  />
                ))}
              </div>
              {videoMaterials.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  No hay videos disponibles
                </div>
              )}
            </TabsContent>

            <TabsContent value="documents">
              <div className="space-y-2">
                {documentMaterials.map((material) => (
                  <MaterialListItem
                    key={material.id}
                    material={material}
                    isCreator={isCreator}
                    category={getCategoryById(material.category_id)}
                    tags={tags || []}
                    onView={handleView}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                  />
                ))}
              </div>
              {documentMaterials.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  No hay documentos disponibles
                </div>
              )}
            </TabsContent>

            <TabsContent value="links">
              <div className="space-y-2">
                {linkMaterials.map((material) => (
                  <MaterialListItem
                    key={material.id}
                    material={material}
                    isCreator={isCreator}
                    category={getCategoryById(material.category_id)}
                    tags={tags || []}
                    onView={handleView}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                  />
                ))}
              </div>
              {linkMaterials.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  No hay enlaces disponibles
                </div>
              )}
            </TabsContent>
          </Tabs>
        )}
      </div>

      {/* Material Viewer Modal */}
      <MaterialViewer
        material={viewingMaterial}
        open={!!viewingMaterial}
        onOpenChange={(open) => !open && setViewingMaterial(null)}
        showFeedback={!isCreator}
      />

      {/* Material Form Modal */}
      <MaterialForm
        material={editingMaterial}
        open={isFormOpen}
        onOpenChange={handleFormClose}
      />

      {/* Category Manager Modal */}
      <CategoryManager
        open={isCategoryManagerOpen}
        onOpenChange={setIsCategoryManagerOpen}
      />

      {/* Tag Manager Modal */}
      <TagManager
        open={isTagManagerOpen}
        onOpenChange={setIsTagManagerOpen}
      />

      {/* Glossary Manager Modal */}
      <GlossaryManager
        open={isGlossaryOpen}
        onOpenChange={setIsGlossaryOpen}
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deletingMaterial} onOpenChange={(open) => !open && setDeletingMaterial(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar este material?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. El material "{deletingMaterial?.title}" será eliminado permanentemente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DashboardLayout>
  );
};

export default TrainingMaterials;
