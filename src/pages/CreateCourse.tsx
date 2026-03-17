import React, { useState } from "react";
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
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { CoverImageUpload } from "@/components/courses/CoverImageUpload";
import {
  Plus,
  Save,
  Eye,
  Upload,
  BookOpen,
  Video,
  FileText,
  Link2,
  HelpCircle,
  BarChart,
  Trophy,
  Target,
  Users,
  Calendar,
  Loader2,
  X,
  GripVertical,
  Clock,
  UserPlus,
  Search,
  Timer,
  Sparkles,
} from "lucide-react";
import { dimensionLabels, difficultyLabels, TrainingDimension, DifficultyLevel } from "@/lib/types";
import { useToast } from "@/hooks/use-toast";
import { useAvailableTeams, useAvailableUsers } from "@/hooks/useCourseTargeting";
import { useCreateCourse } from "@/hooks/useCreateCourse";
import { CourseTagSelector } from "@/components/courses/CourseTagSelector";
import { QuizQuestionType, QuizQuestionState, createDefaultOptions } from "@/components/quiz/types";
import { QuestionEditor } from "@/components/quiz/QuestionEditor";

const CreateCourse: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const createCourseMutation = useCreateCourse();
  const [activeTab, setActiveTab] = useState("basic");
  const [userSearchQuery, setUserSearchQuery] = useState("");

  // Fetch available teams and users
  const { data: availableTeams = [], isLoading: teamsLoading } = useAvailableTeams();
  const { data: availableUsers = [], isLoading: usersLoading } = useAvailableUsers();

  // Form state
  const [courseData, setCourseData] = useState({
    title: "",
    description: "",
    cover_image_url: "",
    dimension: "entrenamiento" as TrainingDimension,
    difficulty: "basico" as DifficultyLevel,
    points: 100,
    estimated_duration_minutes: 30,
    time_limit_minutes: 60, // Required field for course timer
    language: "es",
    subtitles_enabled: false,
    target_audience: [] as string[],
    tags: [] as string[],
    objectives: [] as string[],
    expires_at: "",
    scheduled_at: "",
    target_teams: [] as string[],
    target_users: [] as string[],
    course_tags: [] as string[],
  });

  const [materials, setMaterials] = useState<
    { id: string; title: string; type: string; content_url: string; content_text: string }[]
  >([]);

  // AI module content generation state
  const [aiModuleDialog, setAiModuleDialog] = useState<{ materialId: string; prompt: string } | null>(null);
  const [aiModuleLoading, setAiModuleLoading] = useState(false);

  const [quizQuestions, setQuizQuestions] = useState<QuizQuestionState[]>([]);

  const [additionalResources, setAdditionalResources] = useState<
    { id: string; title: string; url: string }[]
  >([]);

  const [newTag, setNewTag] = useState("");
  const [newObjective, setNewObjective] = useState("");
  const [newTeam, setNewTeam] = useState("");

  // Gamification options
  const [gamification, setGamification] = useState({
    social: true,
    achievements: true,
    progression: true,
  });

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

  const handleAddTeam = () => {
    if (newTeam && !courseData.target_audience.includes(newTeam)) {
      setCourseData({ ...courseData, target_audience: [...courseData.target_audience, newTeam] });
      setNewTeam("");
    }
  };

  const handleRemoveTeam = (team: string) => {
    setCourseData({
      ...courseData,
      target_audience: courseData.target_audience.filter((t) => t !== team),
    });
  };

  // Target teams handlers
  const handleToggleTargetTeam = (team: string) => {
    setCourseData(prev => ({
      ...prev,
      target_teams: prev.target_teams.includes(team)
        ? prev.target_teams.filter(t => t !== team)
        : [...prev.target_teams, team]
    }));
  };

  const handleRemoveTargetTeam = (team: string) => {
    setCourseData(prev => ({
      ...prev,
      target_teams: prev.target_teams.filter(t => t !== team)
    }));
  };

  // Target users handlers (for personalized courses)
  const handleToggleTargetUser = (userId: string) => {
    setCourseData(prev => ({
      ...prev,
      target_users: prev.target_users.includes(userId)
        ? prev.target_users.filter(u => u !== userId)
        : [...prev.target_users, userId]
    }));
  };

  const handleRemoveTargetUser = (userId: string) => {
    setCourseData(prev => ({
      ...prev,
      target_users: prev.target_users.filter(u => u !== userId)
    }));
  };

  // Filter users by search query
  const filteredUsers = availableUsers.filter(user => {
    const query = userSearchQuery.toLowerCase();
    return (
      user.full_name?.toLowerCase().includes(query) ||
      user.email.toLowerCase().includes(query) ||
      user.team?.toLowerCase().includes(query)
    );
  });

  const getInitials = (name: string | null) => {
    if (!name) return "U";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const handleAddMaterial = (type: string) => {
    const newMaterial = {
      id: Date.now().toString(),
      title: "",
      type,
      content_url: "",
      content_text: "",
    };
    setMaterials([...materials, newMaterial]);
  };

  const handleRemoveMaterial = (id: string) => {
    setMaterials(materials.filter((m) => m.id !== id));
  };

  const handleAddQuestion = (type: QuizQuestionType) => {
    const newQuestion: QuizQuestionState = {
      id: Date.now().toString(),
      question: "",
      question_type: type,
      points: 10,
      options: createDefaultOptions(type),
    };
    setQuizQuestions([...quizQuestions, newQuestion]);
  };

  const handleAddResource = () => {
    const newResource = {
      id: Date.now().toString(),
      title: "",
      url: "",
    };
    setAdditionalResources([...additionalResources, newResource]);
  };

  const handleRemoveResource = (id: string) => {
    setAdditionalResources(additionalResources.filter((r) => r.id !== id));
  };

  // Calculate total quiz points
  const totalQuizPoints = quizQuestions.reduce((sum, q) => sum + q.points, 0);

  const handleSaveDraft = async () => {
    if (!courseData.title) {
      toast({
        title: "Error",
        description: "El título del curso es requerido",
        variant: "destructive",
      });
      return;
    }

    createCourseMutation.mutate({
      courseData,
      materials,
      quizQuestions,
      additionalResources,
      status: "draft",
    });
  };

  const handlePublish = async () => {
    if (!courseData.title) {
      toast({
        title: "Error",
        description: "El título del curso es requerido",
        variant: "destructive",
      });
      return;
    }

    createCourseMutation.mutate({
      courseData,
      materials,
      quizQuestions,
      additionalResources,
      status: "published",
    });
  };

  const isSubmitting = createCourseMutation.isPending;

  return (
    <DashboardLayout>
      <div className="space-y-8 animate-fade-in">
        {/* Header */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
              <Plus className="w-8 h-8 text-primary" />
              Crear Curso
            </h1>
            <p className="text-muted-foreground">
              Diseña un nuevo curso con materiales y evaluaciones by Alexandra Cañon
            </p>
          </div>

          <div className="flex gap-3">
            <Button variant="outline" onClick={handleSaveDraft} disabled={isSubmitting}>
              <Save className="w-4 h-4 mr-2" />
              Guardar Borrador
            </Button>
            <Button onClick={handlePublish} disabled={isSubmitting}>
              {isSubmitting ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : (
                <Eye className="w-4 h-4 mr-2" />
              )}
              Publicar
            </Button>
          </div>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="basic">Información</TabsTrigger>
            <TabsTrigger value="content">Contenido</TabsTrigger>
            <TabsTrigger value="resources">Recursos</TabsTrigger>
            <TabsTrigger value="quiz">Quiz</TabsTrigger>
            <TabsTrigger value="gamification">Gamificación</TabsTrigger>
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
                    <Label htmlFor="duration">Duración Estimada (minutos)</Label>
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
                    <p className="text-xs text-muted-foreground">
                      Tiempo estimado para completar el curso (informativo)
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="time_limit" className="flex items-center gap-2">
                      <Timer className="w-4 h-4 text-primary" />
                      Tiempo Límite (minutos) *
                    </Label>
                    <Input
                      id="time_limit"
                      type="number"
                      min="1"
                      value={courseData.time_limit_minutes}
                      onChange={(e) =>
                        setCourseData({
                          ...courseData,
                          time_limit_minutes: parseInt(e.target.value) || 60,
                        })
                      }
                    />
                    <p className="text-xs text-muted-foreground">
                      Tiempo máximo que tiene el estudiante para completar el curso después de inscribirse.
                      El temporizador se mostrará en verde los primeros 5 min, amarillo después, y rojo los últimos 5 min.
                    </p>
                  </div>

                  <div className="space-y-2 md:col-span-2">
                    <CoverImageUpload
                      currentImageUrl={courseData.cover_image_url}
                      onImageChange={(url) => setCourseData({ ...courseData, cover_image_url: url })}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Objectives */}
            <Card className="border-border/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="w-5 h-5 text-primary" />
                  Objetivos del Curso
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-2">
                  <Input
                    placeholder="Agregar objetivo..."
                    value={newObjective}
                    onChange={(e) => setNewObjective(e.target.value)}
                    onKeyPress={(e) => e.key === "Enter" && handleAddObjective()}
                  />
                  <Button onClick={handleAddObjective}>
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
                <div className="space-y-2">
                  {courseData.objectives.map((obj, index) => (
                    <div
                      key={index}
                      className="flex items-center gap-2 p-2 rounded-lg bg-muted/50"
                    >
                      <span className="flex-1 text-sm">{obj}</span>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        onClick={() => handleRemoveObjective(index)}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Course Type Tags */}
            <Card className="border-border/50">
              <CardHeader>
                <CardTitle>Tipo de Material</CardTitle>
                <CardDescription>
                  Selecciona el tipo de material del curso (auto-aprendizaje, asistido, etc.)
                </CardDescription>
              </CardHeader>
              <CardContent>
                <CourseTagSelector
                  selectedTags={courseData.course_tags}
                  onChange={(tags) => setCourseData({ ...courseData, course_tags: tags })}
                />
              </CardContent>
            </Card>

            {/* Tags */}
            <Card className="border-border/50">
              <CardHeader>
                <CardTitle>Etiquetas de Búsqueda</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-2">
                  <Input
                    placeholder="Agregar etiqueta..."
                    value={newTag}
                    onChange={(e) => setNewTag(e.target.value)}
                    onKeyPress={(e) => e.key === "Enter" && handleAddTag()}
                  />
                  <Button onClick={handleAddTag}>
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {courseData.tags.map((tag) => (
                    <Badge key={tag} variant="secondary" className="gap-1">
                      {tag}
                      <button onClick={() => handleRemoveTag(tag)}>
                        <X className="w-3 h-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Content Tab */}
          <TabsContent value="content" className="mt-6 space-y-6">
            <Card className="border-border/50">
              <CardHeader>
                <CardTitle>Materiales del Curso</CardTitle>
                <CardDescription>
                  Agrega videos, documentos, enlaces y más
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex flex-wrap gap-3">
                  <Button variant="outline" onClick={() => handleAddMaterial("video")}>
                    <Video className="w-4 h-4 mr-2" />
                    Video
                  </Button>
                  <Button variant="outline" onClick={() => handleAddMaterial("documento")}>
                    <FileText className="w-4 h-4 mr-2" />
                    Documento
                  </Button>
                  <Button variant="outline" onClick={() => handleAddMaterial("link")}>
                    <Link2 className="w-4 h-4 mr-2" />
                    Enlace
                  </Button>
                  <Button variant="outline" onClick={() => handleAddMaterial("documento")}>
                    <FileText className="w-4 h-4 mr-2" />
                    Google Embed
                  </Button>
                </div>

                <div className="space-y-4">
                  {materials.map((material, index) => (
                    <div
                      key={material.id}
                      className="flex flex-col gap-3 p-4 rounded-lg border border-border/50"
                    >
                      <div className="flex items-center gap-4">
                        <GripVertical className="w-5 h-5 text-muted-foreground cursor-move" />
                        <div className="flex-1 grid gap-4 md:grid-cols-2">
                          <Input
                            placeholder="Título del material"
                            value={material.title}
                            onChange={(e) => {
                              const updated = [...materials];
                              updated[index].title = e.target.value;
                              setMaterials(updated);
                            }}
                          />
                          <Input
                            placeholder="URL del contenido"
                            value={material.content_url}
                            onChange={(e) => {
                              const updated = [...materials];
                              updated[index].content_url = e.target.value;
                              setMaterials(updated);
                            }}
                          />
                        </div>
                        <Badge variant="outline">{material.type}</Badge>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleRemoveMaterial(material.id)}
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>

                      {/* AI Content Generation */}
                      {material.type === "documento" && (
                        <div className="pl-9">
                          {material.content_text ? (
                            <div className="space-y-2">
                              <div className="flex items-center justify-between">
                                <span className="text-xs text-muted-foreground flex items-center gap-1">
                                  <CheckCircle2 className="w-3 h-3 text-green-500" />
                                  Contenido generado ({material.content_text.replace(/<[^>]+>/g, " ").trim().split(/\s+/).length} palabras aprox.)
                                </span>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-7 text-xs gap-1 text-primary"
                                  onClick={() => setAiModuleDialog({ materialId: material.id, prompt: "" })}
                                >
                                  <Sparkles className="w-3 h-3" /> Regenerar
                                </Button>
                              </div>
                              <div className="text-xs text-muted-foreground bg-muted/50 rounded p-2 max-h-20 overflow-y-auto" dangerouslySetInnerHTML={{ __html: material.content_text.substring(0, 500) + "..." }} />
                            </div>
                          ) : (
                            <Button
                              variant="outline"
                              size="sm"
                              className="gap-2 text-xs border-primary/30 text-primary hover:bg-primary/5"
                              onClick={() => setAiModuleDialog({ materialId: material.id, prompt: "" })}
                            >
                              <Sparkles className="w-3.5 h-3.5" />
                              Generar contenido con IA
                            </Button>
                          )}
                        </div>
                      )}

                      {/* AI Module Dialog Inline */}
                      {aiModuleDialog?.materialId === material.id && (
                        <div className="pl-9 border-t pt-3 space-y-2">
                          <Label className="text-sm">¿Sobre qué debe tratar este módulo?</Label>
                          <Textarea
                            placeholder="Ej: Técnicas de manejo de objeciones en ventas de campo..."
                            value={aiModuleDialog.prompt}
                            onChange={(e) => setAiModuleDialog({ ...aiModuleDialog, prompt: e.target.value })}
                            rows={2}
                            className="resize-none text-sm"
                          />
                          <div className="flex gap-2 justify-end">
                            <Button variant="ghost" size="sm" onClick={() => setAiModuleDialog(null)} disabled={aiModuleLoading}>
                              Cancelar
                            </Button>
                            <Button
                              size="sm"
                              className="gap-1"
                              disabled={!aiModuleDialog.prompt.trim() || aiModuleLoading}
                              onClick={async () => {
                                setAiModuleLoading(true);
                                try {
                                  const { data, error } = await supabase.functions.invoke("create-ai-course", {
                                    body: { prompt: aiModuleDialog.prompt.trim(), single_module_mode: true },
                                  });
                                  if (error) throw error;
                                  if (data?.error) throw new Error(data.error);
                                  const updated = [...materials];
                                  updated[index].content_text = data.content;
                                  setMaterials(updated);
                                  setAiModuleDialog(null);
                                  toast({ title: "Contenido generado", description: `El módulo "${material.title || "sin título"}" fue completado con IA.` });
                                } catch (err: any) {
                                  toast({ title: "Error", description: err.message || "No se pudo generar el contenido.", variant: "destructive" });
                                } finally {
                                  setAiModuleLoading(false);
                                }
                              }}
                            >
                              {aiModuleLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
                              {aiModuleLoading ? "Generando..." : "Generar"}
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}

                  {materials.length === 0 && (
                    <div className="text-center py-8 text-muted-foreground">
                      <BookOpen className="w-12 h-12 mx-auto mb-4 opacity-50" />
                      <p>No hay materiales agregados</p>
                      <p className="text-sm">Usa los botones de arriba para agregar contenido</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Resources Tab */}
          <TabsContent value="resources" className="mt-6 space-y-6">
            <Card className="border-border/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Link2 className="w-5 h-5 text-primary" />
                  Recursos Adicionales
                </CardTitle>
                <CardDescription>
                  Agrega enlaces adicionales que los estudiantes podrán consultar
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <Button variant="outline" onClick={handleAddResource}>
                  <Plus className="w-4 h-4 mr-2" />
                  Agregar Recurso
                </Button>

                <div className="space-y-4">
                  {additionalResources.map((resource, index) => (
                    <div
                      key={resource.id}
                      className="flex items-center gap-4 p-4 rounded-lg border border-border/50"
                    >
                      <Link2 className="w-5 h-5 text-muted-foreground" />
                      <div className="flex-1 grid gap-4 md:grid-cols-2">
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

                  {additionalResources.length === 0 && (
                    <div className="text-center py-8 text-muted-foreground">
                      <Link2 className="w-12 h-12 mx-auto mb-4 opacity-50" />
                      <p>No hay recursos adicionales</p>
                      <p className="text-sm">Agrega enlaces a documentos, guías o herramientas externas</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Quiz Tab */}
          <TabsContent value="quiz" className="mt-6 space-y-6">
            <Card className="border-border/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <HelpCircle className="w-5 h-5 text-primary" />
                  Quiz de Evaluación
                </CardTitle>
                <CardDescription>
                  Crea preguntas para evaluar el aprendizaje
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex flex-wrap gap-3">
                  <Button variant="outline" onClick={() => handleAddQuestion("multiple_choice")}>
                    <Plus className="w-4 h-4 mr-2" />
                    Selección Múltiple
                  </Button>
                  <Button variant="outline" onClick={() => handleAddQuestion("true_false")}>
                    <Plus className="w-4 h-4 mr-2" />
                    Verdadero/Falso
                  </Button>
                  <Button variant="outline" onClick={() => handleAddQuestion("mind_map")}>
                    <Plus className="w-4 h-4 mr-2" />
                    Mapa Mental
                  </Button>
                  <Button variant="outline" onClick={() => handleAddQuestion("fill_blanks")}>
                    <Plus className="w-4 h-4 mr-2" />
                    Completar Frases
                  </Button>
                  <Button variant="outline" onClick={() => handleAddQuestion("match_columns")}>
                    <Plus className="w-4 h-4 mr-2" />
                    Unir Columnas
                  </Button>
                  <Button variant="outline" onClick={() => handleAddQuestion("image_puzzle")}>
                    <Plus className="w-4 h-4 mr-2" />
                    Rompecabezas
                  </Button>
                  <Button variant="outline" onClick={() => handleAddQuestion("open_answer")}>
                    <Plus className="w-4 h-4 mr-2" />
                    Respuesta Abierta
                  </Button>
                  <Button variant="outline" onClick={() => handleAddQuestion("image_activity")}>
                    <Plus className="w-4 h-4 mr-2" />
                    Actividad con Imagen
                  </Button>
                </div>

                {quizQuestions.length > 0 && (
                  <div className="p-4 rounded-lg bg-muted/50">
                    <div className="flex items-center justify-between">
                      <span className="font-medium">Total de puntos:</span>
                      <span className={`text-lg font-bold ${totalQuizPoints === 100 ? "text-success" : totalQuizPoints > 100 ? "text-destructive" : "text-muted-foreground"}`}>
                        {totalQuizPoints} / 100 puntos
                      </span>
                    </div>
                    {totalQuizPoints !== 100 && (
                      <p className="text-xs text-muted-foreground mt-1">
                        Los puntos deben sumar exactamente 100 para una evaluación correcta
                      </p>
                    )}
                  </div>
                )}

                <div className="space-y-6">
                  {quizQuestions.map((q, qIndex) => (
                    <QuestionEditor
                      key={q.id}
                      question={q}
                      index={qIndex}
                      onUpdate={(updated) => {
                        const newQuestions = [...quizQuestions];
                        newQuestions[qIndex] = updated;
                        setQuizQuestions(newQuestions);
                      }}
                      onDelete={() => setQuizQuestions(quizQuestions.filter((_, i) => i !== qIndex))}
                    />
                  ))}

                  {quizQuestions.length === 0 && (
                    <div className="text-center py-8 text-muted-foreground">
                      <HelpCircle className="w-12 h-12 mx-auto mb-4 opacity-50" />
                      <p>No hay preguntas agregadas</p>
                      <p className="text-sm">Agrega preguntas para evaluar a los estudiantes</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Gamification Tab */}
          <TabsContent value="gamification" className="mt-6 space-y-6">
            <Card className="border-border/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Trophy className="w-5 h-5 text-addi-yellow" />
                  Opciones de Gamificación
                </CardTitle>
                <CardDescription>
                  Activa elementos de juego para hacer el curso más interactivo
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 rounded-lg bg-muted/50">
                    <div className="flex items-center gap-3">
                      <Users className="w-5 h-5 text-primary" />
                      <div>
                        <p className="font-medium">Gamificación Social y Colaborativa</p>
                        <p className="text-sm text-muted-foreground">
                          Competencia en equipo, rankings en tiempo real
                        </p>
                      </div>
                    </div>
                    <Switch
                      checked={gamification.social}
                      onCheckedChange={(checked) =>
                        setGamification({ ...gamification, social: checked })
                      }
                    />
                  </div>

                  <div className="flex items-center justify-between p-4 rounded-lg bg-muted/50">
                    <div className="flex items-center gap-3">
                      <Trophy className="w-5 h-5 text-addi-yellow" />
                      <div>
                        <p className="font-medium">Logros y Recompensas</p>
                        <p className="text-sm text-muted-foreground">
                          Insignias, diplomas y puntos extra
                        </p>
                      </div>
                    </div>
                    <Switch
                      checked={gamification.achievements}
                      onCheckedChange={(checked) =>
                        setGamification({ ...gamification, achievements: checked })
                      }
                    />
                  </div>

                  <div className="flex items-center justify-between p-4 rounded-lg bg-muted/50">
                    <div className="flex items-center gap-3">
                      <BarChart className="w-5 h-5 text-success" />
                      <div>
                        <p className="font-medium">Niveles y Progresión</p>
                        <p className="text-sm text-muted-foreground">
                          Barra de progreso visible, desbloqueo de contenido
                        </p>
                      </div>
                    </div>
                    <Switch
                      checked={gamification.progression}
                      onCheckedChange={(checked) =>
                        setGamification({ ...gamification, progression: checked })
                      }
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Settings Tab */}
          <TabsContent value="settings" className="mt-6 space-y-6">
            <Card className="border-border/50">
              <CardHeader>
                <CardTitle>Configuración Avanzada</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid gap-6 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="language">Idioma</Label>
                    <Select
                      value={courseData.language}
                      onValueChange={(value) =>
                        setCourseData({ ...courseData, language: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="es">Español</SelectItem>
                        <SelectItem value="en">Inglés</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="scheduled">Fecha de Publicación Programada</Label>
                    <div className="relative">
                      <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        id="scheduled"
                        type="datetime-local"
                        className="pl-10"
                        value={courseData.scheduled_at}
                        onChange={(e) =>
                          setCourseData({ ...courseData, scheduled_at: e.target.value })
                        }
                      />
                    </div>
                    <p className="text-xs text-muted-foreground">
                      El curso se publicará automáticamente en esta fecha
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="expires">Fecha de Vencimiento</Label>
                    <div className="relative">
                      <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        id="expires"
                        type="date"
                        className="pl-10"
                        value={courseData.expires_at}
                        onChange={(e) =>
                          setCourseData({ ...courseData, expires_at: e.target.value })
                        }
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-4 rounded-lg bg-muted/50 md:col-span-2">
                    <div>
                      <p className="font-medium">Subtítulos</p>
                      <p className="text-sm text-muted-foreground">
                        Habilitar subtítulos en videos
                      </p>
                    </div>
                    <Switch
                      checked={courseData.subtitles_enabled}
                      onCheckedChange={(checked) =>
                        setCourseData({ ...courseData, subtitles_enabled: checked })
                      }
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Target Teams */}
            <Card className="border-border/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="w-5 h-5 text-primary" />
                  Asignar a Equipos
                </CardTitle>
                <CardDescription>
                  Selecciona los equipos que tendrán acceso a este curso. 
                  Todos los miembros de los equipos seleccionados serán inscritos automáticamente.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {teamsLoading ? (
                  <div className="flex items-center justify-center py-4">
                    <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                  </div>
                ) : availableTeams.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    No hay equipos disponibles. Los equipos se crean desde la gestión de usuarios.
                  </p>
                ) : (
                  <>
                    <ScrollArea className="h-48 rounded-md border p-4">
                      <div className="space-y-2">
                        {availableTeams.map((team) => (
                          <div
                            key={team}
                            className="flex items-center space-x-3 p-2 rounded-lg hover:bg-muted/50 transition-colors"
                          >
                            <Checkbox
                              id={`team-${team}`}
                              checked={courseData.target_teams.includes(team)}
                              onCheckedChange={() => handleToggleTargetTeam(team)}
                            />
                            <label
                              htmlFor={`team-${team}`}
                              className="flex-1 text-sm font-medium cursor-pointer"
                            >
                              {team}
                            </label>
                            <Badge variant="outline" className="text-xs">
                              Equipo
                            </Badge>
                          </div>
                        ))}
                      </div>
                    </ScrollArea>
                    
                    {courseData.target_teams.length > 0 && (
                      <div className="space-y-2">
                        <Label className="text-sm text-muted-foreground">Equipos seleccionados:</Label>
                        <div className="flex flex-wrap gap-2">
                          {courseData.target_teams.map((team) => (
                            <Badge key={team} variant="secondary" className="gap-1">
                              <Users className="w-3 h-3" />
                              {team}
                              <button onClick={() => handleRemoveTargetTeam(team)}>
                                <X className="w-3 h-3" />
                              </button>
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {courseData.target_teams.length === 0 && (
                      <p className="text-sm text-muted-foreground">
                        Sin equipos seleccionados = curso disponible para todos
                      </p>
                    )}
                  </>
                )}
              </CardContent>
            </Card>

            {/* Target Users (Personalized Courses) */}
            <Card className="border-border/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <UserPlus className="w-5 h-5 text-primary" />
                  Asignar a Usuarios Específicos
                </CardTitle>
                <CardDescription>
                  Asigna este curso a personas específicas para cursos personalizados o planes de desarrollo individual.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {usersLoading ? (
                  <div className="flex items-center justify-center py-4">
                    <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                  </div>
                ) : (
                  <>
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        placeholder="Buscar usuario por nombre, email o equipo..."
                        value={userSearchQuery}
                        onChange={(e) => setUserSearchQuery(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                    
                    <ScrollArea className="h-64 rounded-md border p-4">
                      <div className="space-y-2">
                        {filteredUsers.length === 0 ? (
                          <p className="text-sm text-muted-foreground text-center py-4">
                            No se encontraron usuarios
                          </p>
                        ) : (
                          filteredUsers.map((user) => (
                            <div
                              key={user.user_id}
                              className="flex items-center space-x-3 p-2 rounded-lg hover:bg-muted/50 transition-colors"
                            >
                              <Checkbox
                                id={`user-${user.user_id}`}
                                checked={courseData.target_users.includes(user.user_id)}
                                onCheckedChange={() => handleToggleTargetUser(user.user_id)}
                              />
                              <Avatar className="h-8 w-8">
                                <AvatarFallback className="bg-primary/10 text-primary text-xs">
                                  {getInitials(user.full_name)}
                                </AvatarFallback>
                              </Avatar>
                              <label
                                htmlFor={`user-${user.user_id}`}
                                className="flex-1 cursor-pointer"
                              >
                                <p className="text-sm font-medium">{user.full_name || "Sin nombre"}</p>
                                <p className="text-xs text-muted-foreground">{user.email}</p>
                              </label>
                              {user.team && (
                                <Badge variant="outline" className="text-xs">
                                  {user.team}
                                </Badge>
                              )}
                            </div>
                          ))
                        )}
                      </div>
                    </ScrollArea>
                    
                    {courseData.target_users.length > 0 && (
                      <div className="space-y-2">
                        <Label className="text-sm text-muted-foreground">
                          Usuarios seleccionados ({courseData.target_users.length}):
                        </Label>
                        <div className="flex flex-wrap gap-2">
                          {courseData.target_users.map((userId) => {
                            const user = availableUsers.find(u => u.user_id === userId);
                            return (
                              <Badge key={userId} variant="secondary" className="gap-1">
                                {user?.full_name || user?.email || userId}
                                <button onClick={() => handleRemoveTargetUser(userId)}>
                                  <X className="w-3 h-3" />
                                </button>
                              </Badge>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
};

export default CreateCourse;
