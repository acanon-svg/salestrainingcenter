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
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { X, Upload, Loader2, Folder, Plus, Eye, FileText, Video, Link as LinkIcon, HelpCircle, TableIcon } from "lucide-react";
import { TrainingMaterial, useCreateTrainingMaterial, useUpdateTrainingMaterial } from "@/hooks/useTrainingMaterials";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAvailableTeams } from "@/hooks/useCourseTargeting";
import { useMaterialCategories } from "@/hooks/useMaterialCategories";
import { useAssignTagsToMaterial, useMaterialTagAssignments } from "@/hooks/useMaterialTags";
import { RichTextEditor, parseRichText } from "./RichTextEditor";
import { KeywordsInput } from "./KeywordsInput";
import { TagSelector } from "./TagSelector";
import { CategoryManager } from "./CategoryManager";
import { isGoogleUrl, GoogleDocEmbed } from "./GoogleDocEmbed";
import { FaqManager } from "./FaqManager";
import { TableEditor, TableData, parseTableData, stringifyTableData } from "./TableEditor";
import { TableViewer } from "./TableViewer";

interface MaterialFormProps {
  material?: TrainingMaterial | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

// Preview component for the material
const MaterialPreview: React.FC<{
  title: string;
  description: string;
  type: string;
  contentUrl: string;
  contentText: string;
  tableData: TableData;
  tags: string[];
  keywords: string[];
}> = ({ title, description, type, contentUrl, contentText, tableData, tags, keywords }) => {
  const renderContent = () => {
    if (type === "tabla" && (tableData.headers.length > 0 || tableData.rows.length > 0)) {
      return <TableViewer data={stringifyTableData(tableData)} className="max-h-64 overflow-y-auto" />;
    }

    if (type === "documento" && contentText) {
      return (
        <div 
          className="prose prose-sm max-w-none dark:prose-invert bg-muted/30 p-4 rounded-lg max-h-64 overflow-y-auto"
          dangerouslySetInnerHTML={{ __html: parseRichText(contentText) }}
        />
      );
    }

    if (type === "video" && contentUrl) {
      const youtubeMatch = contentUrl.match(
        /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/
      );
      
      if (youtubeMatch) {
        return (
          <div className="aspect-video rounded-lg overflow-hidden bg-muted">
            <iframe
              src={`https://www.youtube.com/embed/${youtubeMatch[1]}`}
              title="Video preview"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              className="w-full h-full"
            />
          </div>
        );
      }

      return (
        <div className="aspect-video rounded-lg overflow-hidden bg-black">
          <video src={contentUrl} controls className="w-full h-full">
            Tu navegador no soporta videos.
          </video>
        </div>
      );
    }

    if (type === "documento" && contentUrl) {
      if (isGoogleUrl(contentUrl)) {
        return <GoogleDocEmbed url={contentUrl} className="h-64" />;
      }
      
      if (contentUrl.toLowerCase().endsWith('.pdf')) {
        return (
          <div className="aspect-[4/3] rounded-lg overflow-hidden">
            <iframe src={contentUrl} title="PDF preview" className="w-full h-full" />
          </div>
        );
      }
    }

    if (type === "link" && contentUrl) {
      if (isGoogleUrl(contentUrl)) {
        return <GoogleDocEmbed url={contentUrl} className="h-64" />;
      }
      
      return (
        <div className="flex flex-col items-center justify-center py-6 gap-3 bg-muted/30 rounded-lg">
          <LinkIcon className="h-12 w-12 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">Enlace externo</p>
          <Button size="sm" variant="outline" asChild>
            <a href={contentUrl} target="_blank" rel="noopener noreferrer">
              Abrir enlace
            </a>
          </Button>
        </div>
      );
    }

    // Placeholder when no content
    const icons = {
      video: Video,
      documento: FileText,
      link: LinkIcon,
      tabla: TableIcon,
    };
    const Icon = icons[type as keyof typeof icons] || FileText;

    return (
      <div className="flex flex-col items-center justify-center py-8 gap-3 bg-muted/30 rounded-lg">
        <Icon className="h-12 w-12 text-muted-foreground" />
        <p className="text-sm text-muted-foreground">
          Añade contenido para ver la vista previa
        </p>
      </div>
    );
  };

  return (
    <div className="border rounded-lg p-4 bg-card">
      <div className="flex items-center gap-2 mb-3">
        <Badge variant="outline" className="capitalize">{type}</Badge>
        {tags.map((tag, i) => (
          <Badge key={i} variant="secondary" className="text-xs">{tag}</Badge>
        ))}
      </div>
      
      <h3 className="text-lg font-semibold mb-2">
        {title || <span className="text-muted-foreground italic">Sin título</span>}
      </h3>
      
      {description && (
        <div 
          className="text-sm text-muted-foreground mb-4"
          dangerouslySetInnerHTML={{ __html: parseRichText(description) }}
        />
      )}
      
      {keywords.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-4">
          {keywords.map((kw, i) => (
            <Badge key={i} variant="outline" className="text-xs">{kw}</Badge>
          ))}
        </div>
      )}
      
      <div className="mt-4">
        {renderContent()}
      </div>
    </div>
  );
};

export const MaterialForm: React.FC<MaterialFormProps> = ({
  material,
  open,
  onOpenChange,
}) => {
  const isEditing = !!material;
  const createMutation = useCreateTrainingMaterial();
  const updateMutation = useUpdateTrainingMaterial();
  const assignTagsMutation = useAssignTagsToMaterial();
  const { toast } = useToast();
  const { data: availableTeams, isLoading: teamsLoading } = useAvailableTeams();
  const { data: categories, refetch: refetchCategories } = useMaterialCategories();
  const { data: existingTagAssignments } = useMaterialTagAssignments(material?.id);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [type, setType] = useState<"video" | "documento" | "link" | "tabla">("video");
  const [contentUrl, setContentUrl] = useState("");
  const [contentText, setContentText] = useState("");
  const [tableData, setTableData] = useState<TableData>({ headers: [], rows: [] });
  const [targetTeams, setTargetTeams] = useState<string[]>([]);
  const [categoryId, setCategoryId] = useState<string>("");
  const [isPublished, setIsPublished] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [keywords, setKeywords] = useState<string[]>([]);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [isCategoryManagerOpen, setIsCategoryManagerOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("edit");

  useEffect(() => {
    if (material) {
      setTitle(material.title);
      setDescription(material.description || "");
      setType(material.type as "video" | "documento" | "link" | "tabla");
      setContentUrl(material.content_url || "");
      setContentText(material.content_text || "");
      setTableData(material.type === "tabla" ? parseTableData(material.content_text) : { headers: [], rows: [] });
      setTargetTeams(material.target_teams || []);
      setCategoryId(material.category_id || "");
      setIsPublished(material.is_published);
      setKeywords((material as any).keywords || []);
    } else {
      resetForm();
    }
  }, [material, open]);

  // Load existing tag assignments when editing
  useEffect(() => {
    if (existingTagAssignments) {
      setSelectedTags(existingTagAssignments.map((a) => a.tag_id));
    }
  }, [existingTagAssignments]);

  const resetForm = () => {
    setTitle("");
    setDescription("");
    setType("video");
    setContentUrl("");
    setContentText("");
    setTableData({ headers: [], rows: [] });
    setTargetTeams([]);
    setCategoryId("");
    setIsPublished(false);
    setKeywords([]);
    setSelectedTags([]);
    setActiveTab("edit");
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
      content_text: type === "tabla" ? stringifyTableData(tableData) : (contentText || null),
      target_teams: targetTeams,
      category_id: categoryId || null,
      is_published: isPublished,
      order_index: 0,
      keywords,
    };

    try {
      let resultId: string;
      
      if (isEditing && material) {
        await updateMutation.mutateAsync({ id: material.id, ...materialData });
        resultId = material.id;
      } else {
        const result = await createMutation.mutateAsync(materialData);
        resultId = result.id;
      }

      // Assign tags
      if (selectedTags.length > 0 || (isEditing && existingTagAssignments?.length)) {
        await assignTagsMutation.mutateAsync({
          materialId: resultId,
          tagIds: selectedTags,
        });
      }

      onOpenChange(false);
      resetForm();
    } catch (error) {
      // Error handled in mutation
    }
  };

  const isPending = createMutation.isPending || updateMutation.isPending;
  const isGoogleLink = contentUrl && isGoogleUrl(contentUrl);

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-5xl max-h-[90vh] overflow-hidden flex flex-col">
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

          <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 overflow-hidden flex flex-col">
            <TabsList className={`grid w-full ${isEditing ? "grid-cols-3" : "grid-cols-2"}`}>
              <TabsTrigger value="edit">
                <FileText className="h-4 w-4 mr-2" />
                Editar
              </TabsTrigger>
              <TabsTrigger value="preview">
                <Eye className="h-4 w-4 mr-2" />
                Vista Previa
              </TabsTrigger>
              {isEditing && (
                <TabsTrigger value="faqs">
                  <HelpCircle className="h-4 w-4 mr-2" />
                  FAQs
                </TabsTrigger>
              )}
            </TabsList>

            <TabsContent value="edit" className="flex-1 overflow-y-auto mt-4">
              <form id="material-form" onSubmit={handleSubmit} className="space-y-6">
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
                  <Label>Descripción</Label>
                  <RichTextEditor
                    value={description}
                    onChange={setDescription}
                    placeholder="Describe brevemente el contenido del material..."
                    rows={4}
                    showPreview={false}
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
                      <SelectItem value="tabla">Tabla</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {type === "tabla" && (
                  <div className="space-y-2">
                    <Label>Editor de Tabla</Label>
                    <TableEditor value={tableData} onChange={setTableData} />
                  </div>
                )}

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
                        placeholder="URL del documento (Google Docs, Drive, PDF, etc.)"
                      />
                      {isGoogleLink && (
                        <p className="text-xs text-green-600 flex items-center gap-1">
                          ✓ Enlace de Google detectado - se mostrará preview embebido
                        </p>
                      )}
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
                      <RichTextEditor
                        value={contentText}
                        onChange={setContentText}
                        placeholder="Escribe el contenido del documento aquí..."
                        rows={8}
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
                      placeholder="https://ejemplo.com/recurso o Google Docs/Drive"
                      required={type === "link"}
                    />
                    {isGoogleLink && (
                      <p className="text-xs text-green-600 flex items-center gap-1">
                        ✓ Enlace de Google detectado - se mostrará preview embebido
                      </p>
                    )}
                  </div>
                )}

                {/* Keywords */}
                <KeywordsInput keywords={keywords} onChange={setKeywords} />

                {/* Tags */}
                <TagSelector selectedTags={selectedTags} onChange={setSelectedTags} />

                {/* Category Selection */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label>Categoría</Label>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setIsCategoryManagerOpen(true)}
                    >
                      <Plus className="h-4 w-4 mr-1" />
                      Nueva
                    </Button>
                  </div>
                  <Select 
                    value={categoryId || "none"} 
                    onValueChange={(val) => setCategoryId(val === "none" ? "" : val)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar categoría..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Sin categoría</SelectItem>
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
                      {availableTeams?.filter((t) => t && !targetTeams.includes(t)).map((team) => (
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
              </form>
            </TabsContent>

            <TabsContent value="preview" className="flex-1 overflow-y-auto mt-4">
              <div className="p-4 bg-muted/20 rounded-lg min-h-[400px]">
                <p className="text-sm text-muted-foreground mb-4 flex items-center gap-2">
                  <Eye className="h-4 w-4" />
                  Así es como verán los usuarios este material:
                </p>
                <MaterialPreview
                  title={title}
                  description={description}
                  type={type}
                  contentUrl={contentUrl}
                  contentText={contentText}
                  tableData={tableData}
                  tags={selectedTags}
                  keywords={keywords}
                />
              </div>
            </TabsContent>

            {isEditing && material && (
              <TabsContent value="faqs" className="flex-1 overflow-y-auto mt-4">
                <div className="space-y-4">
                  <p className="text-sm text-muted-foreground">
                    Añade preguntas frecuentes para ayudar a los estudiantes a entender mejor el contenido. 
                    Las FAQs también aparecerán en los resultados de búsqueda.
                  </p>
                  <FaqManager materialId={material.id} />
                </div>
              </TabsContent>
            )}
          </Tabs>

          <DialogFooter className="mt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button 
              type="submit" 
              form="material-form"
              disabled={isPending || !title}
            >
              {isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {isEditing ? "Guardar cambios" : "Crear material"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <CategoryManager
        open={isCategoryManagerOpen}
        onOpenChange={(open) => {
          setIsCategoryManagerOpen(open);
          if (!open) {
            refetchCategories();
          }
        }}
      />
    </>
  );
};
