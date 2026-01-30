import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
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
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
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
  Target,
  GripVertical,
  HelpCircle,
  Users,
  BarChart,
  Clock,
  Calendar,
  UserPlus,
  Search,
} from "lucide-react";
import { dimensionLabels, difficultyLabels, TrainingDimension, DifficultyLevel } from "@/lib/types";
import { useToast } from "@/hooks/use-toast";
import { useCourse, useCourseResources, useCourseMaterials, useCourseQuizzes } from "@/hooks/useCourses";
import { useUpdateCourse } from "@/hooks/useCreateCourse";
import { useAvailableTeams, useAvailableUsers } from "@/hooks/useCourseTargeting";
import { supabase } from "@/integrations/supabase/client";

const EditCourse: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  
  const { data: course, isLoading: courseLoading } = useCourse(id || "");
  const { data: resources = [] } = useCourseResources(id || "");
  const { data: existingMaterials = [] } = useCourseMaterials(id || "");
  const { data: quizzes = [] } = useCourseQuizzes(id || "");
  const { data: availableTeams = [], isLoading: teamsLoading } = useAvailableTeams();
  const { data: availableUsers = [], isLoading: usersLoading } = useAvailableUsers();
  
  const updateCourseMutation = useUpdateCourse();
  const [activeTab, setActiveTab] = useState("basic");
  const [userSearchQuery, setUserSearchQuery] = useState("");

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

  const [materials, setMaterials] = useState<
    { id: string; title: string; type: string; content_url: string }[]
  >([]);

  const [quizQuestions, setQuizQuestions] = useState<
    { id: string; question: string; question_type: "multiple_choice" | "true_false"; points: number; options: { text: string; is_correct: boolean }[] }[]
  >([]);

  const [additionalResources, setAdditionalResources] = useState<
    { id: string; title: string; url: string }[]
  >([]);

  const [newTag, setNewTag] = useState("");
  const [newObjective, setNewObjective] = useState("");
  
  // Gamification options
  const [gamification, setGamification] = useState({
    social: true,
    achievements: true,
    progression: true,
  });

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

  // Load materials
  useEffect(() => {
    if (existingMaterials && existingMaterials.length > 0) {
      setMaterials(existingMaterials.map((m: any) => ({
        id: m.id,
        title: m.title,
        type: m.type,
        content_url: m.content_url || "",
      })));
    }
  }, [existingMaterials]);

  // Load quiz questions
  useEffect(() => {
    if (quizzes && quizzes.length > 0) {
      const quiz = quizzes[0]; // Get first quiz
      if (quiz?.questions && quiz.questions.length > 0) {
        setQuizQuestions(quiz.questions.map((q: any) => ({
          id: q.id,
          question: q.question,
          question_type: q.question_type || "multiple_choice",
          points: q.points || 10,
          options: q.options || [],
        })));
      }
    }
  }, [quizzes]);

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

  // Target users handlers
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

  const handleAddMaterial = (type: string) => {
    const newMaterial = {
      id: `new-${Date.now()}`,
      title: "",
      type,
      content_url: "",
    };
    setMaterials([...materials, newMaterial]);
  };

  const handleRemoveMaterial = (materialId: string) => {
    setMaterials(materials.filter((m) => m.id !== materialId));
  };

  const handleAddQuestion = (type: "multiple_choice" | "true_false") => {
    const options = type === "true_false" 
      ? [
          { text: "Verdadero", is_correct: false },
          { text: "Falso", is_correct: false },
        ]
      : [
          { text: "", is_correct: false },
          { text: "", is_correct: false },
          { text: "", is_correct: false },
          { text: "", is_correct: false },
        ];
    
    const newQuestion = {
      id: `new-${Date.now()}`,
      question: "",
      question_type: type,
      points: 10,
      options,
    };
    setQuizQuestions([...quizQuestions, newQuestion]);
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

  // Calculate total quiz points
  const totalQuizPoints = quizQuestions.reduce((sum, q) => sum + q.points, 0);

  // Map content types to valid enum values
  const mapContentType = (type: string): "video" | "documento" | "link" | "quiz" | "encuesta" => {
    if (type === "google_embed") return "documento";
    if (["video", "documento", "link", "quiz", "encuesta"].includes(type)) {
      return type as "video" | "documento" | "link" | "quiz" | "encuesta";
    }
    return "documento";
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
      // 1. Update course data
      await updateCourseMutation.mutateAsync({
        courseId: id,
        courseData,
      });

      // 2. Update materials - delete existing and insert new
      await supabase.from("course_materials").delete().eq("course_id", id);
      
      const materialsToInsert = materials
        .filter(m => m.title && m.content_url)
        .map((material, index) => ({
          course_id: id,
          title: material.title,
          type: mapContentType(material.type),
          content_url: material.content_url,
          order_index: index,
          is_required: true,
        }));

      if (materialsToInsert.length > 0) {
        await supabase.from("course_materials").insert(materialsToInsert);
      }

      // 3. Update quiz - delete existing quiz and questions, then recreate
      if (quizzes && quizzes.length > 0) {
        const quizId = quizzes[0].id;
        await supabase.from("quiz_questions").delete().eq("quiz_id", quizId);
        await supabase.from("quizzes").delete().eq("id", quizId);
      }

      // Create new quiz if there are questions
      const validQuestions = quizQuestions.filter(
        q => q.question && q.options.some(o => o.text && o.is_correct)
      );

      if (validQuestions.length > 0) {
        const { data: newQuiz, error: quizError } = await supabase
          .from("quizzes")
          .insert({
            course_id: id,
            title: `Quiz: ${courseData.title}`,
            description: "Evaluación del curso",
            passing_score: 70,
            order_index: 0,
          })
          .select()
          .single();

        if (!quizError && newQuiz) {
          const questionsToInsert = validQuestions.map((q, index) => ({
            quiz_id: newQuiz.id,
            question: q.question,
            question_type: q.question_type || "multiple_choice",
            options: q.options.filter(o => o.text),
            order_index: index,
            points: q.points || 10,
          }));

          await supabase.from("quiz_questions").insert(questionsToInsert);
        }
      }

      // 4. Update resources
      await supabase.from("course_resources").delete().eq("course_id", id);

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

      // Invalidate all course-related queries to ensure all users see the updates
      await queryClient.invalidateQueries({ queryKey: ["courses"] });
      await queryClient.invalidateQueries({ queryKey: ["my-courses"] });
      await queryClient.invalidateQueries({ queryKey: ["course", id] });
      await queryClient.invalidateQueries({ queryKey: ["course-materials", id] });
      await queryClient.invalidateQueries({ queryKey: ["course-quizzes", id] });
      await queryClient.invalidateQueries({ queryKey: ["course-resources", id] });
      await queryClient.invalidateQueries({ queryKey: ["enrollments"] });

      toast({
        title: "Curso actualizado",
        description: "Los cambios se han guardado correctamente y están visibles para todos los usuarios.",
      });
    } catch (error) {
      console.error("Error updating course:", error);
      toast({
        title: "Error",
        description: "No se pudieron guardar los cambios",
        variant: "destructive",
      });
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
                    <Label htmlFor="duration">Duración (minutos)</Label>
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

                  <div className="space-y-2">
                    <Label htmlFor="cover">URL de Imagen de Portada</Label>
                    <Input
                      id="cover"
                      placeholder="https://..."
                      value={courseData.cover_image_url}
                      onChange={(e) => setCourseData({ ...courseData, cover_image_url: e.target.value })}
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

            {/* Tags */}
            <Card className="border-border/50">
              <CardHeader>
                <CardTitle>Etiquetas</CardTitle>
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
                      className="flex items-center gap-4 p-4 rounded-lg border border-border/50"
                    >
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
                    <div
                      key={q.id}
                      className="p-4 rounded-lg border border-border/50 space-y-4"
                    >
                      <div className="flex items-start gap-4">
                        <span className="text-lg font-semibold text-primary">
                          {qIndex + 1}.
                        </span>
                        <div className="flex-1 space-y-4">
                          <div className="flex gap-2 items-center">
                            <Badge variant="outline">
                              {q.question_type === "true_false" ? "V/F" : "Selección múltiple"}
                            </Badge>
                            <div className="flex items-center gap-2 ml-auto">
                              <Label className="text-sm">Puntos:</Label>
                              <Input
                                type="number"
                                min={1}
                                max={100}
                                className="w-20"
                                value={q.points}
                                onChange={(e) => {
                                  const updated = [...quizQuestions];
                                  updated[qIndex].points = Math.min(100, Math.max(1, parseInt(e.target.value) || 1));
                                  setQuizQuestions(updated);
                                }}
                              />
                            </div>
                          </div>
                          <Input
                            placeholder="Escribe la pregunta..."
                            value={q.question}
                            onChange={(e) => {
                              const updated = [...quizQuestions];
                              updated[qIndex].question = e.target.value;
                              setQuizQuestions(updated);
                            }}
                          />
                          <div className="grid gap-2 md:grid-cols-2">
                            {q.options.map((opt, oIndex) => (
                              <div key={oIndex} className="flex items-center gap-2">
                                <input
                                  type="radio"
                                  name={`correct-${q.id}`}
                                  checked={opt.is_correct}
                                  onChange={() => {
                                    const updated = [...quizQuestions];
                                    updated[qIndex].options = updated[qIndex].options.map(
                                      (o, i) => ({
                                        ...o,
                                        is_correct: i === oIndex,
                                      })
                                    );
                                    setQuizQuestions(updated);
                                  }}
                                  className="w-4 h-4"
                                />
                                {q.question_type === "true_false" ? (
                                  <span className={`px-3 py-2 rounded border ${opt.is_correct ? "border-success bg-success/10" : "border-border"}`}>
                                    {opt.text}
                                  </span>
                                ) : (
                                  <Input
                                    placeholder={`Opción ${oIndex + 1}`}
                                    value={opt.text}
                                    onChange={(e) => {
                                      const updated = [...quizQuestions];
                                      updated[qIndex].options[oIndex].text = e.target.value;
                                      setQuizQuestions(updated);
                                    }}
                                    className={opt.is_correct ? "border-success" : ""}
                                  />
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() =>
                            setQuizQuestions(quizQuestions.filter((_, i) => i !== qIndex))
                          }
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
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
                        value={courseData.scheduled_at ? courseData.scheduled_at.slice(0, 16) : ""}
                        onChange={(e) =>
                          setCourseData({ ...courseData, scheduled_at: e.target.value ? new Date(e.target.value).toISOString() : "" })
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
                        value={courseData.expires_at ? courseData.expires_at.slice(0, 10) : ""}
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
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {teamsLoading ? (
                  <div className="flex items-center justify-center py-4">
                    <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                  </div>
                ) : availableTeams.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    No hay equipos disponibles.
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

            {/* Target Users */}
            <Card className="border-border/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <UserPlus className="w-5 h-5 text-primary" />
                  Asignar a Usuarios Específicos
                </CardTitle>
                <CardDescription>
                  Asigna este curso a personas específicas para cursos personalizados.
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
                            const targetUser = availableUsers.find(u => u.user_id === userId);
                            return (
                              <Badge key={userId} variant="secondary" className="gap-1">
                                {targetUser?.full_name || targetUser?.email || userId}
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

export default EditCourse;
