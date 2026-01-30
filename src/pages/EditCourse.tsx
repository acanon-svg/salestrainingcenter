import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Save,
  Eye,
  BookOpen,
  Video,
  FileText,
  Link2,
  Loader2,
  X,
  Trophy,
  ArrowLeft,
  Plus,
} from "lucide-react";
import { dimensionLabels, difficultyLabels, TrainingDimension, DifficultyLevel } from "@/lib/types";
import { useToast } from "@/hooks/use-toast";
import { useCourse, useCourseResources } from "@/hooks/useCourses";
import { useUpdateCourse } from "@/hooks/useCreateCourse";
import { supabase } from "@/integrations/supabase/client";

const EditCourse: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { data: course, isLoading: courseLoading } = useCourse(id || "");
  const { data: resources = [] } = useCourseResources(id || "");
  const updateCourseMutation = useUpdateCourse();
  const [activeTab, setActiveTab] = useState("basic");

  // Form state
  const [courseData, setCourseData] = useState({
    title: "",
    description: "",
    cover_image_url: "",
    dimension: "entrenamiento" as TrainingDimension,
    difficulty: "basico" as DifficultyLevel,
    points: 100,
    estimated_duration_minutes: 30,
    language: "es",
    subtitles_enabled: false,
    target_audience: [] as string[],
    tags: [] as string[],
    objectives: [] as string[],
    expires_at: "",
    scheduled_at: "",
    target_teams: [] as string[],
    target_users: [] as string[],
  });

  const [additionalResources, setAdditionalResources] = useState<
    { id: string; title: string; url: string }[]
  >([]);

  const [newTag, setNewTag] = useState("");
  const [newObjective, setNewObjective] = useState("");

  // Load course data when available
  useEffect(() => {
    if (course) {
      setCourseData({
        title: course.title || "",
        description: course.description || "",
        cover_image_url: course.cover_image_url || "",
        dimension: course.dimension as TrainingDimension,
        difficulty: course.difficulty as DifficultyLevel,
        points: course.points || 100,
        estimated_duration_minutes: course.estimated_duration_minutes || 30,
        language: course.language || "es",
        subtitles_enabled: course.subtitles_enabled || false,
        target_audience: course.target_audience || [],
        tags: course.tags || [],
        objectives: course.objectives || [],
        expires_at: course.expires_at || "",
        scheduled_at: course.scheduled_at || "",
        target_teams: course.target_teams || [],
        target_users: course.target_users || [],
      });
    }
  }, [course]);

  // Load resources
  useEffect(() => {
    if (resources.length > 0) {
      setAdditionalResources(resources.map(r => ({
        id: r.id,
        title: r.title,
        url: r.url,
      })));
    }
  }, [resources]);

  const handleAddTag = () => {
    if (newTag && !courseData.tags.includes(newTag)) {
      setCourseData({ ...courseData, tags: [...courseData.tags, newTag] });
      setNewTag("");
    }
  };

  const handleRemoveTag = (tag: string) => {
    setCourseData({ ...courseData, tags: courseData.tags.filter((t) => t !== tag) });
  };

  const handleAddObjective = () => {
    if (newObjective) {
      setCourseData({ ...courseData, objectives: [...courseData.objectives, newObjective] });
      setNewObjective("");
    }
  };

  const handleRemoveObjective = (index: number) => {
    setCourseData({
      ...courseData,
      objectives: courseData.objectives.filter((_, i) => i !== index),
    });
  };

  const handleAddResource = () => {
    const newResource = {
      id: `new-${Date.now()}`,
      title: "",
      url: "",
    };
    setAdditionalResources([...additionalResources, newResource]);
  };

  const handleRemoveResource = (resourceId: string) => {
    setAdditionalResources(additionalResources.filter((r) => r.id !== resourceId));
  };

  const handleSave = async () => {
    if (!courseData.title || !id) {
      toast({
        title: "Error",
        description: "El título del curso es requerido",
        variant: "destructive",
      });
      return;
    }

    try {
      // Update course data
      await updateCourseMutation.mutateAsync({
        courseId: id,
        courseData,
      });

      // Update resources
      // Delete existing resources
      await supabase.from("course_resources").delete().eq("course_id", id);

      // Insert new resources
      const resourcesToInsert = additionalResources
        .filter(r => r.title && r.url)
        .map((resource, index) => ({
          course_id: id,
          title: resource.title,
          url: resource.url,
          order_index: index,
        }));

      if (resourcesToInsert.length > 0) {
        await supabase.from("course_resources").insert(resourcesToInsert);
      }

      toast({
        title: "Curso actualizado",
        description: "Los cambios se han guardado correctamente.",
      });
    } catch (error) {
      console.error("Error updating course:", error);
    }
  };

  const isSubmitting = updateCourseMutation.isPending;

  if (courseLoading) {
    return (
      <DashboardLayout>
        <div className="space-y-8">
          <Skeleton className="h-12 w-64" />
          <Skeleton className="h-96 w-full" />
        </div>
      </DashboardLayout>
    );
  }

  if (!course) {
    return (
      <DashboardLayout>
        <div className="text-center py-12">
          <BookOpen className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
          <h2 className="text-xl font-semibold mb-2">Curso no encontrado</h2>
          <Button onClick={() => navigate("/my-courses")}>Volver a Mis Cursos</Button>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-8 animate-fade-in">
        {/* Header */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate("/my-courses")}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
                <BookOpen className="w-8 h-8 text-primary" />
                Editar Curso
              </h1>
              <p className="text-muted-foreground">
                Modifica la información del curso
              </p>
            </div>
          </div>

          <div className="flex gap-3">
            <Button variant="outline" onClick={() => navigate(`/courses/${id}`)}>
              <Eye className="w-4 h-4 mr-2" />
              Vista Previa
            </Button>
            <Button onClick={handleSave} disabled={isSubmitting}>
              {isSubmitting ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : (
                <Save className="w-4 h-4 mr-2" />
              )}
              Guardar Cambios
            </Button>
          </div>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="basic">Información</TabsTrigger>
            <TabsTrigger value="resources">Recursos</TabsTrigger>
            <TabsTrigger value="settings">Configuración</TabsTrigger>
          </TabsList>

          {/* Basic Info Tab */}
          <TabsContent value="basic" className="mt-6 space-y-6">
            <Card className="border-border/50">
              <CardHeader>
                <CardTitle>Información Básica</CardTitle>
                <CardDescription>Datos principales del curso</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid gap-6 md:grid-cols-2">
                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="title">Título del Curso *</Label>
                    <Input
                      id="title"
                      placeholder="Ej: Técnicas Avanzadas de Ventas"
                      value={courseData.title}
                      onChange={(e) => setCourseData({ ...courseData, title: e.target.value })}
                    />
                  </div>

                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="description">Descripción</Label>
                    <Textarea
                      id="description"
                      placeholder="Describe el contenido y beneficios del curso..."
                      rows={4}
                      value={courseData.description}
                      onChange={(e) => setCourseData({ ...courseData, description: e.target.value })}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="dimension">Dimensión</Label>
                    <Select
                      value={courseData.dimension}
                      onValueChange={(value: TrainingDimension) =>
                        setCourseData({ ...courseData, dimension: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(dimensionLabels).map(([value, label]) => (
                          <SelectItem key={value} value={value}>
                            {label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="difficulty">Nivel de Dificultad</Label>
                    <Select
                      value={courseData.difficulty}
                      onValueChange={(value: DifficultyLevel) =>
                        setCourseData({ ...courseData, difficulty: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(difficultyLabels).map(([value, label]) => (
                          <SelectItem key={value} value={value}>
                            {label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="points">Puntos</Label>
                    <div className="relative">
                      <Trophy className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        id="points"
                        type="number"
                        className="pl-10"
                        value={courseData.points}
                        onChange={(e) =>
                          setCourseData({ ...courseData, points: parseInt(e.target.value) || 0 })
                        }
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="duration">Duración Estimada (min)</Label>
                    <Input
                      id="duration"
                      type="number"
                      value={courseData.estimated_duration_minutes}
                      onChange={(e) =>
                        setCourseData({
                          ...courseData,
                          estimated_duration_minutes: parseInt(e.target.value) || 0,
                        })
                      }
                    />
                  </div>
                </div>

                {/* Tags */}
                <div className="space-y-2">
                  <Label>Etiquetas</Label>
                  <div className="flex gap-2">
                    <Input
                      placeholder="Añadir etiqueta..."
                      value={newTag}
                      onChange={(e) => setNewTag(e.target.value)}
                      onKeyPress={(e) => e.key === "Enter" && handleAddTag()}
                    />
                    <Button type="button" variant="outline" onClick={handleAddTag}>
                      <Plus className="w-4 h-4" />
                    </Button>
                  </div>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {courseData.tags.map((tag) => (
                      <Badge key={tag} variant="secondary" className="gap-1">
                        {tag}
                        <button onClick={() => handleRemoveTag(tag)}>
                          <X className="w-3 h-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                </div>

                {/* Objectives */}
                <div className="space-y-2">
                  <Label>Objetivos del Curso</Label>
                  <div className="flex gap-2">
                    <Input
                      placeholder="Añadir objetivo..."
                      value={newObjective}
                      onChange={(e) => setNewObjective(e.target.value)}
                      onKeyPress={(e) => e.key === "Enter" && handleAddObjective()}
                    />
                    <Button type="button" variant="outline" onClick={handleAddObjective}>
                      <Plus className="w-4 h-4" />
                    </Button>
                  </div>
                  <ul className="list-disc list-inside space-y-1 mt-2">
                    {courseData.objectives.map((obj, index) => (
                      <li key={index} className="flex items-center gap-2">
                        <span className="flex-1">{obj}</span>
                        <button onClick={() => handleRemoveObjective(index)}>
                          <X className="w-3 h-3 text-muted-foreground hover:text-destructive" />
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Resources Tab */}
          <TabsContent value="resources" className="mt-6 space-y-6">
            <Card className="border-border/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Link2 className="w-5 h-5" />
                  Recursos Adicionales
                </CardTitle>
                <CardDescription>Enlaces externos y materiales complementarios</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {additionalResources.map((resource, index) => (
                  <div key={resource.id} className="flex gap-3 items-start p-4 border rounded-lg">
                    <div className="flex-1 space-y-3">
                      <Input
                        placeholder="Nombre del recurso"
                        value={resource.title}
                        onChange={(e) => {
                          const updated = [...additionalResources];
                          updated[index].title = e.target.value;
                          setAdditionalResources(updated);
                        }}
                      />
                      <Input
                        placeholder="URL del recurso (https://...)"
                        value={resource.url}
                        onChange={(e) => {
                          const updated = [...additionalResources];
                          updated[index].url = e.target.value;
                          setAdditionalResources(updated);
                        }}
                      />
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleRemoveResource(resource.id)}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                ))}

                <Button variant="outline" onClick={handleAddResource} className="w-full">
                  <Plus className="w-4 h-4 mr-2" />
                  Agregar Recurso
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Settings Tab */}
          <TabsContent value="settings" className="mt-6 space-y-6">
            <Card className="border-border/50">
              <CardHeader>
                <CardTitle>Configuración Avanzada</CardTitle>
                <CardDescription>Opciones adicionales del curso</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Subtítulos Habilitados</Label>
                    <p className="text-sm text-muted-foreground">
                      Indica si los videos tienen subtítulos disponibles
                    </p>
                  </div>
                  <Switch
                    checked={courseData.subtitles_enabled}
                    onCheckedChange={(checked) =>
                      setCourseData({ ...courseData, subtitles_enabled: checked })
                    }
                  />
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Fecha de Publicación Programada</Label>
                    <Input
                      type="datetime-local"
                      value={courseData.scheduled_at ? courseData.scheduled_at.slice(0, 16) : ""}
                      onChange={(e) =>
                        setCourseData({
                          ...courseData,
                          scheduled_at: e.target.value ? new Date(e.target.value).toISOString() : "",
                        })
                      }
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Fecha de Expiración</Label>
                    <Input
                      type="datetime-local"
                      value={courseData.expires_at ? courseData.expires_at.slice(0, 16) : ""}
                      onChange={(e) =>
                        setCourseData({
                          ...courseData,
                          expires_at: e.target.value ? new Date(e.target.value).toISOString() : "",
                        })
                      }
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="cover">URL de Imagen de Portada</Label>
                  <Input
                    id="cover"
                    placeholder="https://..."
                    value={courseData.cover_image_url}
                    onChange={(e) => setCourseData({ ...courseData, cover_image_url: e.target.value })}
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
};

export default EditCourse;
