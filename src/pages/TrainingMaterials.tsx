import React, { useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { useAuth } from "@/contexts/AuthContext";
import { useTrainingMaterials, useDeleteTrainingMaterial, TrainingMaterial } from "@/hooks/useTrainingMaterials";
import { MaterialCard } from "@/components/materials/MaterialCard";
import { MaterialViewer } from "@/components/materials/MaterialViewer";
import { MaterialForm } from "@/components/materials/MaterialForm";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Search, Video, FileText, Link as LinkIcon, FolderOpen, Loader2 } from "lucide-react";

const TrainingMaterials: React.FC = () => {
  const { hasRole } = useAuth();
  const isCreator = hasRole("creator") || hasRole("admin");

  // For students, only show published materials
  const { data: materials, isLoading } = useTrainingMaterials({ onlyPublished: !isCreator });
  const deleteMutation = useDeleteTrainingMaterial();

  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [viewingMaterial, setViewingMaterial] = useState<TrainingMaterial | null>(null);
  const [editingMaterial, setEditingMaterial] = useState<TrainingMaterial | null>(null);
  const [deletingMaterial, setDeletingMaterial] = useState<TrainingMaterial | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);

  const filteredMaterials = materials?.filter((material) => {
    const matchesSearch =
      material.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      material.description?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = typeFilter === "all" || material.type === typeFilter;
    return matchesSearch && matchesType;
  });

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

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold">Material Formativo</h1>
            <p className="text-muted-foreground mt-1">
              Centro de recursos y documentación para tu formación
            </p>
          </div>
          {isCreator && (
            <Button onClick={() => setIsFormOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Nuevo Material
            </Button>
          )}
        </div>

        {/* Filters */}
        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar materiales..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-full md:w-48">
              <SelectValue placeholder="Tipo de contenido" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos los tipos</SelectItem>
              <SelectItem value="video">Videos</SelectItem>
              <SelectItem value="documento">Documentos</SelectItem>
              <SelectItem value="link">Enlaces</SelectItem>
            </SelectContent>
          </Select>
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
          <Tabs defaultValue="all" className="space-y-6">
            <TabsList>
              <TabsTrigger value="all" className="gap-2">
                <FolderOpen className="h-4 w-4" />
                Todos ({filteredMaterials?.length || 0})
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
            </TabsList>

            <TabsContent value="all">
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {filteredMaterials?.map((material) => (
                  <MaterialCard
                    key={material.id}
                    material={material}
                    isCreator={isCreator}
                    onView={handleView}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                  />
                ))}
              </div>
            </TabsContent>

            <TabsContent value="videos">
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {videoMaterials.map((material) => (
                  <MaterialCard
                    key={material.id}
                    material={material}
                    isCreator={isCreator}
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
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {documentMaterials.map((material) => (
                  <MaterialCard
                    key={material.id}
                    material={material}
                    isCreator={isCreator}
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
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {linkMaterials.map((material) => (
                  <MaterialCard
                    key={material.id}
                    material={material}
                    isCreator={isCreator}
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
