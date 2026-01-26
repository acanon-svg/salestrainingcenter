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
} from "lucide-react";
import { dimensionLabels, difficultyLabels, TrainingDimension, DifficultyLevel } from "@/lib/types";
import { useToast } from "@/hooks/use-toast";

const CreateCourse: React.FC = () => {
  const { profile } = useAuth();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
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
  });

  const [materials, setMaterials] = useState<
    { id: string; title: string; type: string; content_url: string }[]
  >([]);

  const [quizQuestions, setQuizQuestions] = useState<
    { id: string; question: string; options: { text: string; is_correct: boolean }[] }[]
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

  const handleAddMaterial = (type: string) => {
    const newMaterial = {
      id: Date.now().toString(),
      title: "",
      type,
      content_url: "",
    };
    setMaterials([...materials, newMaterial]);
  };

  const handleRemoveMaterial = (id: string) => {
    setMaterials(materials.filter((m) => m.id !== id));
  };

  const handleAddQuestion = () => {
    const newQuestion = {
      id: Date.now().toString(),
      question: "",
      options: [
        { text: "", is_correct: false },
        { text: "", is_correct: false },
        { text: "", is_correct: false },
        { text: "", is_correct: false },
      ],
    };
    setQuizQuestions([...quizQuestions, newQuestion]);
  };

  const handleSaveDraft = async () => {
    setIsSubmitting(true);
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1000));
    setIsSubmitting(false);
    toast({
      title: "Borrador guardado",
      description: "El curso se ha guardado como borrador.",
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

    setIsSubmitting(true);
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1500));
    setIsSubmitting(false);
    toast({
      title: "¡Curso publicado!",
      description: "El curso ya está disponible para los usuarios.",
    });
  };

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
              Diseña un nuevo curso con materiales y evaluaciones
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
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="basic">Información</TabsTrigger>
            <TabsTrigger value="content">Contenido</TabsTrigger>
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
                    <div className="flex gap-2">
                      <Input
                        id="cover"
                        placeholder="https://..."
                        value={courseData.cover_image_url}
                        onChange={(e) =>
                          setCourseData({ ...courseData, cover_image_url: e.target.value })
                        }
                      />
                      <Button variant="outline" size="icon">
                        <Upload className="w-4 h-4" />
                      </Button>
                    </div>
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
                <Button onClick={handleAddQuestion}>
                  <Plus className="w-4 h-4 mr-2" />
                  Agregar Pregunta
                </Button>

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

            {/* Target Audience */}
            <Card className="border-border/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="w-5 h-5 text-primary" />
                  Público Objetivo
                </CardTitle>
                <CardDescription>
                  Selecciona los equipos que verán este curso
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-2">
                  <Select value={newTeam} onValueChange={setNewTeam}>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar equipo" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Ventas Norte">Ventas Norte</SelectItem>
                      <SelectItem value="Ventas Centro">Ventas Centro</SelectItem>
                      <SelectItem value="Ventas Sur">Ventas Sur</SelectItem>
                      <SelectItem value="Soporte">Soporte</SelectItem>
                      <SelectItem value="Operaciones">Operaciones</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button onClick={handleAddTeam}>
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {courseData.target_audience.length === 0 ? (
                    <p className="text-sm text-muted-foreground">
                      Sin selección = visible para todos
                    </p>
                  ) : (
                    courseData.target_audience.map((team) => (
                      <Badge key={team} variant="secondary" className="gap-1">
                        {team}
                        <button onClick={() => handleRemoveTeam(team)}>
                          <X className="w-3 h-3" />
                        </button>
                      </Badge>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
};

export default CreateCourse;
