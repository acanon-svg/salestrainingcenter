import React, { useState, useEffect } from "react";
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
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { X, Upload, Loader2, Folder } from "lucide-react";
import { TrainingMaterial, useCreateTrainingMaterial, useUpdateTrainingMaterial } from "@/hooks/useTrainingMaterials";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAvailableTeams } from "@/hooks/useCourseTargeting";
import { useMaterialCategories } from "@/hooks/useMaterialCategories";

interface MaterialFormProps {
  material?: TrainingMaterial | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const MaterialForm: React.FC<MaterialFormProps> = ({
  material,
  open,
  onOpenChange,
}) => {
  const isEditing = !!material;
  const createMutation = useCreateTrainingMaterial();
  const updateMutation = useUpdateTrainingMaterial();
  const { toast } = useToast();
  const { data: availableTeams, isLoading: teamsLoading } = useAvailableTeams();
  const { data: categories } = useMaterialCategories();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [type, setType] = useState<"video" | "documento" | "link">("video");
  const [contentUrl, setContentUrl] = useState("");
  const [contentText, setContentText] = useState("");
  const [targetTeams, setTargetTeams] = useState<string[]>([]);
  const [categoryId, setCategoryId] = useState<string>("");
  const [isPublished, setIsPublished] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    if (material) {
      setTitle(material.title);
      setDescription(material.description || "");
      setType(material.type);
      setContentUrl(material.content_url || "");
      setContentText(material.content_text || "");
      setTargetTeams(material.target_teams || []);
      setCategoryId(material.category_id || "");
      setIsPublished(material.is_published);
    } else {
      resetForm();
    }
  }, [material, open]);

  const resetForm = () => {
    setTitle("");
    setDescription("");
    setType("video");
    setContentUrl("");
    setContentText("");
    setTargetTeams([]);
    setCategoryId("");
    setIsPublished(false);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file size (max 50MB)
    if (file.size > 50 * 1024 * 1024) {
      toast({
        title: "Archivo muy grande",
        description: "El archivo debe ser menor a 50MB.",
        variant: "destructive",
      });
      return;
    }

    setIsUploading(true);
    try {
      const fileExt = file.name.split(".").pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
      const filePath = `${type}s/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from("training-materials")
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from("training-materials")
        .getPublicUrl(filePath);

      setContentUrl(urlData.publicUrl);
      toast({
        title: "Archivo subido",
        description: "El archivo se ha subido correctamente.",
      });
    } catch (error) {
      console.error("Error uploading file:", error);
      toast({
        title: "Error",
        description: "No se pudo subir el archivo.",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  const addTeam = (team: string) => {
    if (!targetTeams.includes(team)) {
      setTargetTeams([...targetTeams, team]);
    }
  };

  const removeTeam = (team: string) => {
    setTargetTeams(targetTeams.filter((t) => t !== team));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const materialData = {
      title,
      description: description || null,
      type,
      content_url: contentUrl || null,
      content_text: contentText || null,
      target_teams: targetTeams,
      category_id: categoryId || null,
      is_published: isPublished,
      order_index: 0,
    };

    try {
      if (isEditing && material) {
        await updateMutation.mutateAsync({ id: material.id, ...materialData });
      } else {
        await createMutation.mutateAsync(materialData);
      }
      onOpenChange(false);
      resetForm();
    } catch (error) {
      // Error handled in mutation
    }
  };

  const isPending = createMutation.isPending || updateMutation.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? "Editar Material" : "Nuevo Material Formativo"}
          </DialogTitle>
          <DialogDescription>
            {isEditing
              ? "Modifica los detalles del material formativo."
              : "Crea un nuevo material para el centro de recursos."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="title">Título *</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ej: Guía de procesos comerciales"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Descripción</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe brevemente el contenido del material..."
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="type">Tipo de contenido *</Label>
            <Select value={type} onValueChange={(v) => setType(v as typeof type)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="video">Video</SelectItem>
                <SelectItem value="documento">Documento</SelectItem>
                <SelectItem value="link">Enlace</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {type === "video" && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>URL del video o subir archivo</Label>
                <Input
                  value={contentUrl}
                  onChange={(e) => setContentUrl(e.target.value)}
                  placeholder="https://youtube.com/watch?v=... o URL del video"
                />
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">o</span>
                <Label
                  htmlFor="video-upload"
                  className="cursor-pointer flex items-center gap-2 px-4 py-2 border rounded-md hover:bg-accent"
                >
                  {isUploading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Upload className="h-4 w-4" />
                  )}
                  Subir video
                </Label>
                <input
                  id="video-upload"
                  type="file"
                  accept="video/*"
                  className="hidden"
                  onChange={handleFileUpload}
                  disabled={isUploading}
                />
              </div>
            </div>
          )}

          {type === "documento" && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>URL del documento o subir archivo</Label>
                <Input
                  value={contentUrl}
                  onChange={(e) => setContentUrl(e.target.value)}
                  placeholder="URL del documento (PDF, Word, etc.)"
                />
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">o</span>
                <Label
                  htmlFor="doc-upload"
                  className="cursor-pointer flex items-center gap-2 px-4 py-2 border rounded-md hover:bg-accent"
                >
                  {isUploading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Upload className="h-4 w-4" />
                  )}
                  Subir documento
                </Label>
                <input
                  id="doc-upload"
                  type="file"
                  accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx"
                  className="hidden"
                  onChange={handleFileUpload}
                  disabled={isUploading}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="content-text">O escribe el contenido</Label>
                <Textarea
                  id="content-text"
                  value={contentText}
                  onChange={(e) => setContentText(e.target.value)}
                  placeholder="Escribe el contenido del documento aquí..."
                  rows={6}
                />
              </div>
            </div>
          )}

          {type === "link" && (
            <div className="space-y-2">
              <Label htmlFor="link">URL del enlace *</Label>
              <Input
                id="link"
                value={contentUrl}
                onChange={(e) => setContentUrl(e.target.value)}
                placeholder="https://ejemplo.com/recurso"
                required={type === "link"}
              />
            </div>
          )}

          {/* Category Selection */}
          <div className="space-y-2">
            <Label>Categoría</Label>
            <Select value={categoryId} onValueChange={setCategoryId}>
              <SelectTrigger>
                <SelectValue placeholder="Seleccionar categoría...">
                  {categoryId && categories?.flat.find((c) => c.id === categoryId)?.name}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Sin categoría</SelectItem>
                {categories?.flat.map((cat) => (
                  <SelectItem key={cat.id} value={cat.id}>
                    <div className="flex items-center gap-2">
                      <Folder className="h-3 w-3 text-amber-500" />
                      {cat.parent_id && <span className="text-muted-foreground">└</span>}
                      {cat.name}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Team Selection - Dynamic from profiles */}
          <div className="space-y-2">
            <Label>Equipos objetivo (dejar vacío para todos)</Label>
            <Select onValueChange={addTeam} disabled={teamsLoading}>
              <SelectTrigger>
                <SelectValue placeholder={teamsLoading ? "Cargando equipos..." : "Seleccionar equipo..."} />
              </SelectTrigger>
              <SelectContent>
                {availableTeams?.filter((t) => !targetTeams.includes(t)).map((team) => (
                  <SelectItem key={team} value={team}>
                    {team}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {targetTeams.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {targetTeams.map((team) => (
                  <Badge key={team} variant="secondary" className="gap-1">
                    {team}
                    <button type="button" onClick={() => removeTeam(team)}>
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}
          </div>

          <div className="flex items-center justify-between rounded-lg border p-4">
            <div className="space-y-0.5">
              <Label>Publicar material</Label>
              <p className="text-sm text-muted-foreground">
                Los materiales publicados serán visibles para los usuarios.
              </p>
            </div>
            <Switch checked={isPublished} onCheckedChange={setIsPublished} />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isPending || !title}>
              {isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {isEditing ? "Guardar cambios" : "Crear material"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
