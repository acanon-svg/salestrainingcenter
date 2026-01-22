import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import DOMPurify from "dompurify";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { useCourse, useCourseMaterials, useCourseQuizzes, useUpdateEnrollmentProgress, useMyEnrollments } from "@/hooks/useCourses";
import { useMaterialProgress, useMarkMaterialComplete } from "@/hooks/useMaterialProgress";
import { useQuizAttempts, useSubmitQuizAttempt } from "@/hooks/useQuizAttempts";
import { useAuth } from "@/contexts/AuthContext";
import { generateDiploma } from "@/lib/generateDiploma";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { 
  ArrowLeft, 
  Play, 
  FileText, 
  ExternalLink, 
  CheckCircle2, 
  Clock, 
  Trophy, 
  Target,
  BookOpen,
  Video,
  FileQuestion,
  ChevronRight,
  Award,
  Download
} from "lucide-react";
import { dimensionLabels, difficultyLabels, contentTypeLabels, CourseMaterial, Quiz, QuizQuestion } from "@/lib/types";

const CourseDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { profile } = useAuth();

  const { data: course, isLoading: loadingCourse } = useCourse(id || "");
  const { data: materials, isLoading: loadingMaterials } = useCourseMaterials(id || "");
  const { data: quizzes, isLoading: loadingQuizzes } = useCourseQuizzes(id || "");
  const { data: materialProgress } = useMaterialProgress(id || "");
  const { data: enrollments } = useMyEnrollments();
  
  const markComplete = useMarkMaterialComplete();
  const updateProgress = useUpdateEnrollmentProgress();
  const submitQuiz = useSubmitQuizAttempt();

  const handleDownloadDiploma = () => {
    if (!course || !profile) return;
    
    generateDiploma({
      userName: profile.full_name || profile.email || "Usuario",
      courseName: course.title,
      completionDate: enrollment?.completed_at ? new Date(enrollment.completed_at) : new Date(),
      score: enrollment?.score || undefined,
      points: course.points,
      duration: course.estimated_duration_minutes || undefined,
    });
    
    toast({
      title: "¡Diploma descargado!",
      description: "Tu certificado se ha descargado correctamente.",
    });
  };

  const [selectedMaterial, setSelectedMaterial] = useState<CourseMaterial | null>(null);
  const [selectedQuiz, setSelectedQuiz] = useState<Quiz | null>(null);
  const [quizAnswers, setQuizAnswers] = useState<Record<string, string>>({});
  const [quizStartTime, setQuizStartTime] = useState<Date | null>(null);
  const [showQuizResults, setShowQuizResults] = useState(false);
  const [lastQuizScore, setLastQuizScore] = useState<{ score: number; passed: boolean } | null>(null);

  const enrollment = enrollments?.find((e) => e.course_id === id);
  const completedMaterialIds = new Set(materialProgress?.filter((p) => p.completed).map((p) => p.material_id) || []);

  // Calculate progress
  const totalMaterials = materials?.length || 0;
  const completedMaterials = completedMaterialIds.size;
  const progressPercentage = totalMaterials > 0 ? Math.round((completedMaterials / totalMaterials) * 100) : 0;

  // Update enrollment progress when materials are completed
  useEffect(() => {
    if (enrollment && progressPercentage !== enrollment.progress_percentage) {
      updateProgress.mutate({
        enrollmentId: enrollment.id,
        progress: progressPercentage,
        status: progressPercentage === 100 ? "completed" : "in_progress",
      });
    }
  }, [progressPercentage, enrollment]);

  const handleMarkComplete = async (material: CourseMaterial) => {
    try {
      await markComplete.mutateAsync({ materialId: material.id, courseId: id || "" });
      toast({
        title: "¡Material completado!",
        description: `Has completado "${material.title}"`,
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleStartQuiz = (quiz: Quiz) => {
    setSelectedQuiz(quiz);
    setQuizAnswers({});
    setQuizStartTime(new Date());
    setShowQuizResults(false);
    setLastQuizScore(null);
  };

  const handleSubmitQuiz = async () => {
    if (!selectedQuiz || !quizStartTime) return;

    const questions = selectedQuiz.questions || [];
    let correctAnswers = 0;

    questions.forEach((q) => {
      const userAnswer = quizAnswers[q.id];
      const correctOption = q.options?.find((opt) => opt.is_correct);
      if (correctOption && userAnswer === correctOption.text) {
        correctAnswers++;
      }
    });

    const score = questions.length > 0 ? Math.round((correctAnswers / questions.length) * 100) : 0;
    const passed = score >= selectedQuiz.passing_score;

    try {
      await submitQuiz.mutateAsync({
        quizId: selectedQuiz.id,
        answers: quizAnswers,
        score,
        passed,
        startedAt: quizStartTime,
      });

      setLastQuizScore({ score, passed });
      setShowQuizResults(true);

      toast({
        title: passed ? "¡Felicitaciones!" : "Quiz completado",
        description: passed 
          ? `Aprobaste con ${score}%` 
          : `Obtuviste ${score}%. Necesitas ${selectedQuiz.passing_score}% para aprobar.`,
        variant: passed ? "default" : "destructive",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const getMaterialIcon = (type: string) => {
    switch (type) {
      case "video":
        return Video;
      case "documento":
        return FileText;
      case "link":
        return ExternalLink;
      case "quiz":
        return FileQuestion;
      default:
        return BookOpen;
    }
  };

  if (loadingCourse) {
    return (
      <DashboardLayout>
        <div className="space-y-6">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-64 w-full" />
        </div>
      </DashboardLayout>
    );
  }

  if (!course) {
    return (
      <DashboardLayout>
        <div className="text-center py-16">
          <h2 className="text-2xl font-bold">Curso no encontrado</h2>
          <Button onClick={() => navigate("/courses")} className="mt-4">
            Volver a cursos
          </Button>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6 animate-fade-in">
        {/* Back button and header */}
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate("/courses")}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex-1">
            <h1 className="text-2xl font-bold">{course.title}</h1>
            <div className="flex items-center gap-2 mt-1">
              <Badge className="bg-primary text-primary-foreground">
                {dimensionLabels[course.dimension]}
              </Badge>
              <Badge variant="outline">
                {difficultyLabels[course.difficulty]}
              </Badge>
              {course.estimated_duration_minutes && (
                <span className="text-sm text-muted-foreground flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {course.estimated_duration_minutes} min
                </span>
              )}
            </div>
          </div>
          <div className="text-right">
            <Badge className="bg-addi-orange text-secondary gap-1 text-lg px-3 py-1">
              <Trophy className="w-4 h-4" />
              {course.points} pts
            </Badge>
          </div>
        </div>

        {/* Progress bar */}
        {enrollment && (
          <Card className="border-primary/20 bg-primary/5">
            <CardContent className="py-4">
              <div className="flex items-center justify-between mb-2">
                <span className="font-medium">Tu progreso</span>
                <div className="flex items-center gap-3">
                  <span className="text-lg font-bold text-primary">{progressPercentage}%</span>
                  {enrollment.status === "completed" && (
                    <Button size="sm" onClick={handleDownloadDiploma} className="gap-2">
                      <Download className="w-4 h-4" />
                      Descargar Diploma
                    </Button>
                  )}
                </div>
              </div>
              <Progress value={progressPercentage} className="h-3" />
              <p className="text-sm text-muted-foreground mt-2">
                {completedMaterials} de {totalMaterials} materiales completados
                {enrollment.status === "completed" && " • ¡Curso completado!"}
              </p>
            </CardContent>
          </Card>
        )}

        {/* Main content */}
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Content viewer */}
          <div className="lg:col-span-2 space-y-4">
            {selectedQuiz ? (
              // Quiz mode
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>{selectedQuiz.title}</CardTitle>
                      <CardDescription>{selectedQuiz.description}</CardDescription>
                    </div>
                    <Button variant="outline" onClick={() => setSelectedQuiz(null)}>
                      Cerrar quiz
                    </Button>
                  </div>
                  <div className="flex gap-4 text-sm text-muted-foreground mt-2">
                    <span className="flex items-center gap-1">
                      <Target className="w-4 h-4" />
                      Puntaje mínimo: {selectedQuiz.passing_score}%
                    </span>
                    {selectedQuiz.max_attempts && (
                      <span>Intentos máximos: {selectedQuiz.max_attempts}</span>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="space-y-6">
                  {showQuizResults && lastQuizScore ? (
                    // Results view
                    <div className="text-center py-8">
                      <div className={`w-24 h-24 rounded-full mx-auto flex items-center justify-center ${
                        lastQuizScore.passed ? "bg-success/20" : "bg-destructive/20"
                      }`}>
                        {lastQuizScore.passed ? (
                          <Award className="w-12 h-12 text-success" />
                        ) : (
                          <Target className="w-12 h-12 text-destructive" />
                        )}
                      </div>
                      <h3 className="text-2xl font-bold mt-4">
                        {lastQuizScore.passed ? "¡Aprobaste!" : "No aprobaste"}
                      </h3>
                      <p className="text-4xl font-bold text-primary mt-2">
                        {lastQuizScore.score}%
                      </p>
                      <p className="text-muted-foreground mt-2">
                        Puntaje mínimo: {selectedQuiz.passing_score}%
                      </p>
                      <div className="flex gap-4 justify-center mt-6">
                        <Button variant="outline" onClick={() => setSelectedQuiz(null)}>
                          Volver al curso
                        </Button>
                        {!lastQuizScore.passed && (
                          <Button onClick={() => handleStartQuiz(selectedQuiz)}>
                            Intentar de nuevo
                          </Button>
                        )}
                      </div>
                    </div>
                  ) : (
                    // Questions view
                    <>
                      {selectedQuiz.questions?.map((question, index) => (
                        <div key={question.id} className="space-y-3 p-4 rounded-lg bg-muted/50">
                          <p className="font-medium">
                            {index + 1}. {question.question}
                          </p>
                          <RadioGroup
                            value={quizAnswers[question.id] || ""}
                            onValueChange={(value) =>
                              setQuizAnswers((prev) => ({ ...prev, [question.id]: value }))
                            }
                          >
                            {question.options?.map((option, optIndex) => (
                              <div key={optIndex} className="flex items-center space-x-2">
                                <RadioGroupItem value={option.text} id={`${question.id}-${optIndex}`} />
                                <Label htmlFor={`${question.id}-${optIndex}`}>{option.text}</Label>
                              </div>
                            ))}
                          </RadioGroup>
                        </div>
                      ))}
                      <Button
                        onClick={handleSubmitQuiz}
                        className="w-full"
                        disabled={Object.keys(quizAnswers).length < (selectedQuiz.questions?.length || 0)}
                      >
                        Enviar respuestas
                      </Button>
                    </>
                  )}
                </CardContent>
              </Card>
            ) : selectedMaterial ? (
              // Material viewer
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        {React.createElement(getMaterialIcon(selectedMaterial.type), { className: "w-5 h-5" })}
                        {selectedMaterial.title}
                      </CardTitle>
                      <CardDescription>
                        {contentTypeLabels[selectedMaterial.type as keyof typeof contentTypeLabels]}
                        {selectedMaterial.duration_minutes && ` • ${selectedMaterial.duration_minutes} min`}
                      </CardDescription>
                    </div>
                    {!completedMaterialIds.has(selectedMaterial.id) && (
                      <Button onClick={() => handleMarkComplete(selectedMaterial)}>
                        <CheckCircle2 className="w-4 h-4 mr-2" />
                        Marcar completado
                      </Button>
                    )}
                    {completedMaterialIds.has(selectedMaterial.id) && (
                      <Badge className="bg-success text-success-foreground">
                        <CheckCircle2 className="w-4 h-4 mr-1" />
                        Completado
                      </Badge>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  {selectedMaterial.type === "video" && selectedMaterial.content_url && (
                    <div className="aspect-video bg-secondary rounded-lg overflow-hidden">
                      <video
                        src={selectedMaterial.content_url}
                        controls
                        className="w-full h-full"
                        onEnded={() => handleMarkComplete(selectedMaterial)}
                      >
                        Tu navegador no soporta videos.
                      </video>
                    </div>
                  )}
                  {selectedMaterial.type === "documento" && (
                    <div className="prose max-w-none">
                      {selectedMaterial.content_text && (
                        <div dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(selectedMaterial.content_text) }} />
                      )}
                      {selectedMaterial.content_url && (
                        <Button asChild className="mt-4">
                          <a href={selectedMaterial.content_url} target="_blank" rel="noopener noreferrer">
                            <FileText className="w-4 h-4 mr-2" />
                            Ver documento
                          </a>
                        </Button>
                      )}
                    </div>
                  )}
                  {selectedMaterial.type === "link" && selectedMaterial.content_url && (
                    <div className="text-center py-8">
                      <ExternalLink className="w-16 h-16 text-primary mx-auto mb-4" />
                      <p className="text-muted-foreground mb-4">
                        Este material te llevará a un recurso externo.
                      </p>
                      <Button asChild>
                        <a href={selectedMaterial.content_url} target="_blank" rel="noopener noreferrer">
                          <ExternalLink className="w-4 h-4 mr-2" />
                          Abrir enlace
                        </a>
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            ) : (
              // Course overview
              <Card>
                <CardHeader>
                  <CardTitle>Descripción del curso</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  {course.cover_image_url && (
                    <img
                      src={course.cover_image_url}
                      alt={course.title}
                      className="w-full h-64 object-cover rounded-lg"
                    />
                  )}
                  <p className="text-muted-foreground">{course.description}</p>
                  
                  {course.objectives && course.objectives.length > 0 && (
                    <div>
                      <h4 className="font-semibold mb-2 flex items-center gap-2">
                        <Target className="w-4 h-4" />
                        Objetivos de aprendizaje
                      </h4>
                      <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                        {course.objectives.map((obj, i) => (
                          <li key={i}>{obj}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {course.tags && course.tags.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {course.tags.map((tag, i) => (
                        <Badge key={i} variant="outline">{tag}</Badge>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </div>

          {/* Sidebar - Content list */}
          <div className="space-y-4">
            <Tabs defaultValue="materials">
              <TabsList className="w-full">
                <TabsTrigger value="materials" className="flex-1">
                  <BookOpen className="w-4 h-4 mr-2" />
                  Materiales
                </TabsTrigger>
                <TabsTrigger value="quizzes" className="flex-1">
                  <FileQuestion className="w-4 h-4 mr-2" />
                  Quizzes
                </TabsTrigger>
              </TabsList>

              <TabsContent value="materials" className="mt-4 space-y-2">
                {loadingMaterials ? (
                  Array.from({ length: 3 }).map((_, i) => (
                    <Skeleton key={i} className="h-16 w-full" />
                  ))
                ) : materials && materials.length > 0 ? (
                  materials.map((material, index) => {
                    const Icon = getMaterialIcon(material.type);
                    const isCompleted = completedMaterialIds.has(material.id);
                    const isSelected = selectedMaterial?.id === material.id;

                    return (
                      <button
                        key={material.id}
                        onClick={() => {
                          setSelectedMaterial(material as CourseMaterial);
                          setSelectedQuiz(null);
                        }}
                        className={`w-full text-left p-3 rounded-lg border transition-all ${
                          isSelected 
                            ? "border-primary bg-primary/10" 
                            : "border-border hover:border-primary/50 hover:bg-muted/50"
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`p-2 rounded-lg ${
                            isCompleted ? "bg-success/20" : "bg-muted"
                          }`}>
                            {isCompleted ? (
                              <CheckCircle2 className="w-4 h-4 text-success" />
                            ) : (
                              <Icon className="w-4 h-4 text-muted-foreground" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className={`font-medium truncate ${isCompleted ? "text-success" : ""}`}>
                              {index + 1}. {material.title}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {contentTypeLabels[material.type as keyof typeof contentTypeLabels]}
                              {material.duration_minutes && ` • ${material.duration_minutes} min`}
                            </p>
                          </div>
                          <ChevronRight className="w-4 h-4 text-muted-foreground" />
                        </div>
                      </button>
                    );
                  })
                ) : (
                  <p className="text-center text-muted-foreground py-8">
                    No hay materiales disponibles
                  </p>
                )}
              </TabsContent>

              <TabsContent value="quizzes" className="mt-4 space-y-2">
                {loadingQuizzes ? (
                  <Skeleton className="h-16 w-full" />
                ) : quizzes && quizzes.length > 0 ? (
                  quizzes.map((quiz) => (
                    <button
                      key={quiz.id}
                      onClick={() => handleStartQuiz(quiz as Quiz)}
                      className={`w-full text-left p-3 rounded-lg border transition-all ${
                        selectedQuiz?.id === quiz.id 
                          ? "border-primary bg-primary/10" 
                          : "border-border hover:border-primary/50 hover:bg-muted/50"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-addi-orange/20">
                          <FileQuestion className="w-4 h-4 text-addi-orange" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate">{quiz.title}</p>
                          <p className="text-xs text-muted-foreground">
                            {quiz.questions?.length || 0} preguntas • Mínimo {quiz.passing_score}%
                          </p>
                        </div>
                        <ChevronRight className="w-4 h-4 text-muted-foreground" />
                      </div>
                    </button>
                  ))
                ) : (
                  <p className="text-center text-muted-foreground py-8">
                    No hay quizzes disponibles
                  </p>
                )}
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default CourseDetail;
