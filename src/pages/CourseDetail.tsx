import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import DOMPurify from "dompurify";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { useCourse, useCourseMaterials, useCourseQuizzes, useCourseResources, useUpdateEnrollmentProgress, useMyEnrollments, useEnrollInCourse } from "@/hooks/useCourses";
import { useMaterialProgress, useMarkMaterialComplete } from "@/hooks/useMaterialProgress";
import { useQuizAttempts, useSubmitQuizAttempt } from "@/hooks/useQuizAttempts";
import { useCourseFeedback, useSubmitCourseFeedback } from "@/hooks/useFeedback";
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
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { KeywordsGlossary } from "@/components/glossary/KeywordsGlossary";
import { GoogleDocEmbed, isGoogleUrl } from "@/components/materials/GoogleDocEmbed";
import { GoogleDriveVideo, isGoogleDriveVideoUrl } from "@/components/materials/GoogleDriveVideo";
import { CourseFeedbackForm } from "@/components/courses/CourseFeedbackForm";
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
  ChevronLeft,
  Award,
  Download,
  Link2,
  AlertTriangle,
  Timer,
  UserPlus,
  Maximize2,
  Minimize2
} from "lucide-react";
import { dimensionLabels, difficultyLabels, contentTypeLabels, CourseMaterial, Quiz, QuizQuestion } from "@/lib/types";
import { CourseTimer } from "@/components/courses/CourseTimer";
import { CourseFullscreenDialog } from "@/components/courses/CourseFullscreenDialog";

// Helper to detect embeddable URLs
const getEmbedInfo = (url: string): { type: "youtube" | "vimeo" | "google" | "pdf" | "iframe" | "external"; embedUrl: string } | null => {
  try {
    const urlObj = new URL(url);
    
    // YouTube
    if (urlObj.hostname.includes("youtube.com") || urlObj.hostname.includes("youtu.be")) {
      let videoId = "";
      if (urlObj.hostname.includes("youtu.be")) {
        videoId = urlObj.pathname.slice(1);
      } else {
        videoId = urlObj.searchParams.get("v") || "";
      }
      if (videoId) {
        return { type: "youtube", embedUrl: `https://www.youtube.com/embed/${videoId}` };
      }
    }
    
    // Vimeo
    if (urlObj.hostname.includes("vimeo.com")) {
      const videoId = urlObj.pathname.split("/").pop();
      if (videoId) {
        return { type: "vimeo", embedUrl: `https://player.vimeo.com/video/${videoId}` };
      }
    }
    
    // Google Docs/Sheets/Slides/Drive
    if (isGoogleUrl(url)) {
      return { type: "google", embedUrl: url };
    }
    
    // PDF files
    if (url.toLowerCase().endsWith(".pdf")) {
      return { type: "pdf", embedUrl: url };
    }
    
    // Loom videos
    if (urlObj.hostname.includes("loom.com")) {
      const videoId = urlObj.pathname.split("/").pop();
      if (videoId) {
        return { type: "iframe", embedUrl: `https://www.loom.com/embed/${videoId}` };
      }
    }
    
    // Canva
    if (urlObj.hostname.includes("canva.com")) {
      return { type: "iframe", embedUrl: url.replace("/design/", "/design/embed/") };
    }
    
    // Default: external link
    return { type: "external", embedUrl: url };
  } catch {
    return null;
  }
};

const CourseDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { profile } = useAuth();

  const { data: course, isLoading: loadingCourse } = useCourse(id || "");
  const { data: materials, isLoading: loadingMaterials } = useCourseMaterials(id || "");
  const { data: quizzes, isLoading: loadingQuizzes } = useCourseQuizzes(id || "");
  const { data: resources, isLoading: loadingResources } = useCourseResources(id || "");
  const { data: materialProgress } = useMaterialProgress(id || "");
  const { data: enrollments } = useMyEnrollments();
  const { data: existingFeedback, isLoading: loadingFeedback } = useCourseFeedback(id || "");
  
  const markComplete = useMarkMaterialComplete();
  const updateProgress = useUpdateEnrollmentProgress();
  const submitQuiz = useSubmitQuizAttempt();
  const submitCourseFeedback = useSubmitCourseFeedback();
  const enrollMutation = useEnrollInCourse();

  const handleEnroll = async () => {
    if (!id) return;
    try {
      await enrollMutation.mutateAsync(id);
      toast({
        title: "¡Inscripción exitosa!",
        description: "Ya puedes comenzar el curso. El temporizador ha iniciado.",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

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
  const [lastQuizScore, setLastQuizScore] = useState<{ score: number; passed: boolean; coursePoints?: number } | null>(null);
  const [currentMaterialIndex, setCurrentMaterialIndex] = useState<number>(0);
  const [isTimeExpired, setIsTimeExpired] = useState(false);
  const [isFullscreenOpen, setIsFullscreenOpen] = useState(false);

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
    // Minimum passing score is always 90 points
    const MINIMUM_PASSING_SCORE = 90;
    const passed = score >= MINIMUM_PASSING_SCORE;

    try {
      await submitQuiz.mutateAsync({
        quizId: selectedQuiz.id,
        answers: quizAnswers,
        score,
        passed,
        startedAt: quizStartTime,
        courseId: id,
        coursePoints: course?.points,
      });

      setLastQuizScore({ score, passed, coursePoints: course?.points });
      setShowQuizResults(true);

      if (passed) {
        toast({
          title: "🎉 ¡Felicitaciones! Has aprobado el curso",
          description: `Obtuviste ${score}% y has ganado ${course?.points || 0} puntos. Podrás verlos reflejados en tu perfil.`,
        });
      } else {
        toast({
          title: "No alcanzaste la calificación mínima",
          description: `Obtuviste ${score}%. Necesitas mínimo 90 puntos de 100 para aprobar. ¡Tienes otro intento!`,
          variant: "destructive",
        });
      }
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

        {/* Enrollment CTA - show when NOT enrolled */}
        {!enrollment && (
          <Card className="border-primary bg-gradient-to-r from-primary/10 to-primary/5">
            <CardContent className="py-6">
              <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-full bg-primary/20">
                    <UserPlus className="w-8 h-8 text-primary" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold">¿Listo para comenzar?</h3>
                    <p className="text-sm text-muted-foreground">
                      Inscríbete para acceder al contenido del curso
                      {course.time_limit_minutes && (
                        <span className="block text-warning mt-1">
                          <Timer className="w-3 h-3 inline mr-1" />
                          Tendrás {course.time_limit_minutes} minutos para completarlo una vez inscrito
                        </span>
                      )}
                    </p>
                  </div>
                </div>
                <Button 
                  size="lg" 
                  onClick={handleEnroll}
                  disabled={enrollMutation.isPending}
                  className="gap-2 min-w-[200px]"
                >
                  {enrollMutation.isPending ? (
                    <>Inscribiendo...</>
                  ) : (
                    <>
                      <UserPlus className="w-5 h-5" />
                      Inscribirme ahora
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Progress bar - show when enrolled */}
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

        {/* Course Feedback Section - show when course is completed */}
        {enrollment?.status === "completed" && !loadingFeedback && (
          <CourseFeedbackForm
            courseId={id || ""}
            courseTitle={course.title}
            onSubmit={async (data) => {
              await submitCourseFeedback.mutateAsync({
                courseId: id || "",
                courseTitle: course.title,
                rating: data.rating,
                message: data.message,
              });
            }}
            isSubmitting={submitCourseFeedback.isPending}
            hasSubmitted={!!existingFeedback}
          />
        )}

        {/* Course Timer - show when enrolled and course has time limit */}
        {enrollment && course.time_limit_minutes && enrollment.status !== "completed" && (
          <CourseTimer
            timeLimitMinutes={course.time_limit_minutes}
            startedAt={enrollment.started_at}
            onTimeExpired={() => {
              setIsTimeExpired(true);
              toast({
                title: "Tiempo agotado",
                description: "El tiempo para completar este curso ha expirado. Ya no puedes continuar con el contenido.",
                variant: "destructive",
              });
            }}
          />
        )}

        {/* Time expired overlay message */}
        {isTimeExpired && enrollment?.status !== "completed" && (
          <Card className="border-destructive bg-destructive/10">
            <CardContent className="py-6 text-center">
              <AlertTriangle className="w-12 h-12 text-destructive mx-auto mb-3" />
              <h3 className="text-lg font-bold text-destructive mb-2">Tiempo Expirado</h3>
              <p className="text-sm text-muted-foreground">
                El tiempo asignado para completar este curso ha terminado. 
                No puedes continuar con el contenido.
              </p>
              <Button onClick={() => navigate("/courses")} className="mt-4">
                Volver a cursos
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Course Preview - show when NOT enrolled */}
        {!enrollment && (
          <div className="grid gap-6 lg:grid-cols-3">
            <div className="lg:col-span-2 space-y-4">
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
            </div>

            {/* Course Info Sidebar */}
            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Información del curso</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Dimensión</span>
                    <Badge variant="secondary">{dimensionLabels[course.dimension]}</Badge>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Dificultad</span>
                    <Badge variant="outline">{difficultyLabels[course.difficulty]}</Badge>
                  </div>
                  {course.estimated_duration_minutes && (
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Duración estimada</span>
                      <span className="font-medium">{course.estimated_duration_minutes} min</span>
                    </div>
                  )}
                  {course.time_limit_minutes && (
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground flex items-center gap-1">
                        <Timer className="w-3 h-3" />
                        Límite de tiempo
                      </span>
                      <span className="font-medium text-warning">{course.time_limit_minutes} min</span>
                    </div>
                  )}
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Puntos</span>
                    <span className="font-medium text-addi-orange">{course.points} pts</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Materiales</span>
                    <span className="font-medium">{materials?.length || 0}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Quizzes</span>
                    <span className="font-medium">{quizzes?.length || 0}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Calificación mínima</span>
                    <span className="font-medium text-warning">90%</span>
                  </div>

                  <div className="pt-4 border-t">
                    <Button 
                      className="w-full gap-2" 
                      size="lg"
                      onClick={handleEnroll}
                      disabled={enrollMutation.isPending}
                    >
                      {enrollMutation.isPending ? (
                        <>Inscribiendo...</>
                      ) : (
                        <>
                          <UserPlus className="w-5 h-5" />
                          Inscribirme
                        </>
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {/* Main content - hidden when time expired or not enrolled */}
        {!isTimeExpired && enrollment && (
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
                      Puntaje mínimo: 90%
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
                        lastQuizScore.passed ? "bg-success/20" : "bg-warning/20"
                      }`}>
                        {lastQuizScore.passed ? (
                          <Award className="w-12 h-12 text-success" />
                        ) : (
                          <AlertTriangle className="w-12 h-12 text-warning" />
                        )}
                      </div>
                      <h3 className="text-2xl font-bold mt-4">
                        {lastQuizScore.passed ? "🎉 ¡Felicitaciones, aprobaste!" : "No alcanzaste la calificación mínima"}
                      </h3>
                      <p className="text-4xl font-bold text-primary mt-2">
                        {lastQuizScore.score}%
                      </p>
                      <p className="text-muted-foreground mt-2">
                        Puntaje mínimo: 90%
                      </p>
                      
                      {lastQuizScore.passed ? (
                        <div className="mt-4 p-4 bg-success/10 rounded-lg border border-success/30">
                          <div className="flex items-center justify-center gap-2 text-success">
                            <Trophy className="w-5 h-5" />
                            <span className="font-semibold">
                              ¡Ganaste {lastQuizScore.coursePoints || 0} puntos!
                            </span>
                          </div>
                          <p className="text-sm text-muted-foreground mt-1">
                            Los puntos ya se han añadido a tu perfil
                          </p>
                        </div>
                      ) : (
                        <div className="mt-4 p-4 bg-warning/10 rounded-lg border border-warning/30">
                          <p className="text-sm text-warning-foreground">
                            Recuerda: necesitas obtener mínimo <strong>90 puntos de 100</strong> para aprobar el curso y recibir los puntos.
                          </p>
                          <p className="text-sm text-muted-foreground mt-2">
                            ¡No te desanimes! Puedes intentarlo de nuevo.
                          </p>
                        </div>
                      )}
                      
                      <div className="flex gap-4 justify-center mt-6">
                        <Button variant="outline" onClick={() => setSelectedQuiz(null)}>
                          Volver al curso
                        </Button>
                        {!lastQuizScore.passed && (
                          <Button onClick={() => handleStartQuiz(selectedQuiz)} className="gap-2">
                            <Target className="w-4 h-4" />
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
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      onClick={() => setIsFullscreenOpen((v) => !v)}
                      aria-label={isFullscreenOpen ? "Salir de pantalla completa" : "Ver en pantalla completa"}
                      title={isFullscreenOpen ? "Salir de pantalla completa" : "Pantalla completa"}
                    >
                      {isFullscreenOpen ? (
                        <Minimize2 className="h-4 w-4" />
                      ) : (
                        <Maximize2 className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {(() => {
                    const contentHeightClass = "h-[calc(100vh-300px)] min-h-[500px]";
                    const fullscreenHeightClass = "h-[calc(100dvh-96px)]";

                    const renderMaterialContent = (heightClassName: string) => {
                      if (!selectedMaterial.content_url) return null;
                      const embedInfo = getEmbedInfo(selectedMaterial.content_url);

                      // Video type - check if it's YouTube/Vimeo, Google Drive, or direct video
                      if (selectedMaterial.type === "video") {
                        // YouTube or Vimeo videos
                        if (embedInfo?.type === "youtube" || embedInfo?.type === "vimeo") {
                          return (
                            <div className={`w-full ${heightClassName} bg-secondary rounded-lg overflow-hidden`}>
                              <iframe
                                src={embedInfo.embedUrl}
                                className="w-full h-full"
                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                allowFullScreen
                                title={selectedMaterial.title}
                              />
                            </div>
                          );
                        }
                        
                        // Google Drive videos (MP4, etc.)
                        if (isGoogleDriveVideoUrl(selectedMaterial.content_url)) {
                          return (
                            <GoogleDriveVideo
                              url={selectedMaterial.content_url}
                              title={selectedMaterial.title}
                              heightClassName={heightClassName}
                              onEnded={() => handleMarkComplete(selectedMaterial)}
                            />
                          );
                        }
                        
                        // Direct video file (non-Drive URLs)
                        return (
                          <div className={`w-full ${heightClassName} bg-secondary rounded-lg overflow-hidden`}>
                            <video
                              src={selectedMaterial.content_url}
                              controls
                              playsInline
                              preload="auto"
                              className="w-full h-full object-contain"
                              onEnded={() => handleMarkComplete(selectedMaterial)}
                            >
                              Tu navegador no soporta videos.
                            </video>
                          </div>
                        );
                      }

                      // Document type - embed if possible
                      if (selectedMaterial.type === "documento") {
                        // Show text content if available
                        if (selectedMaterial.content_text) {
                          return (
                            <div className="prose max-w-none">
                              <div dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(selectedMaterial.content_text) }} />
                            </div>
                          );
                        }

                        // Google Docs/Sheets/Slides
                        if (embedInfo?.type === "google") {
                          return (
                            <GoogleDocEmbed
                              url={selectedMaterial.content_url}
                              heightClassName={heightClassName}
                            />
                          );
                        }

                        // PDF files
                        if (embedInfo?.type === "pdf") {
                          return (
                            <div className={`w-full ${heightClassName} rounded-lg overflow-hidden border`}>
                              <iframe
                                src={selectedMaterial.content_url}
                                className="w-full h-full"
                                title={selectedMaterial.title}
                              />
                            </div>
                          );
                        }

                        // Other iframe-embeddable content
                        if (embedInfo?.type === "iframe") {
                          return (
                            <div className={`w-full ${heightClassName} bg-secondary rounded-lg overflow-hidden`}>
                              <iframe
                                src={embedInfo.embedUrl}
                                className="w-full h-full"
                                allowFullScreen
                                title={selectedMaterial.title}
                              />
                            </div>
                          );
                        }

                        // Fallback for documents - try to embed with Google Docs Viewer
                        return (
                          <div className={`w-full ${heightClassName} rounded-lg overflow-hidden border`}>
                            <iframe
                              src={`https://docs.google.com/viewer?url=${encodeURIComponent(selectedMaterial.content_url)}&embedded=true`}
                              className="w-full h-full"
                              title={selectedMaterial.title}
                            />
                          </div>
                        );
                      }

                      // Link type - try to embed
                      if (selectedMaterial.type === "link") {
                        // YouTube/Vimeo videos
                        if (embedInfo?.type === "youtube" || embedInfo?.type === "vimeo") {
                          return (
                            <div className={`w-full ${heightClassName} bg-secondary rounded-lg overflow-hidden`}>
                              <iframe
                                src={embedInfo.embedUrl}
                                className="w-full h-full"
                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                allowFullScreen
                                title={selectedMaterial.title}
                              />
                            </div>
                          );
                        }

                        // Google Docs/Sheets/Slides
                        if (embedInfo?.type === "google") {
                          return (
                            <GoogleDocEmbed
                              url={selectedMaterial.content_url}
                              heightClassName={heightClassName}
                            />
                          );
                        }

                        // Other iframe content (Loom, Canva, etc.)
                        if (embedInfo?.type === "iframe") {
                          return (
                            <div className={`w-full ${heightClassName} bg-secondary rounded-lg overflow-hidden`}>
                              <iframe
                                src={embedInfo.embedUrl}
                                className="w-full h-full"
                                allowFullScreen
                                title={selectedMaterial.title}
                              />
                            </div>
                          );
                        }

                        // PDF files
                        if (embedInfo?.type === "pdf") {
                          return (
                            <div className={`w-full ${heightClassName} rounded-lg overflow-hidden border`}>
                              <iframe
                                src={selectedMaterial.content_url}
                                className="w-full h-full"
                                title={selectedMaterial.title}
                              />
                            </div>
                          );
                        }

                        // External link - try to embed in an iframe
                        return (
                          <div className={`w-full ${heightClassName} rounded-lg overflow-hidden border`}>
                            <iframe
                              src={selectedMaterial.content_url}
                              className="w-full h-full"
                              title={selectedMaterial.title}
                              sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
                            />
                          </div>
                        );
                      }

                      return null;
                    };

                    return (
                      <>
                        {/* Inline */}
                        {renderMaterialContent(contentHeightClass)}

                        {/* Fullscreen */}
                        <CourseFullscreenDialog
                          open={isFullscreenOpen}
                          onOpenChange={setIsFullscreenOpen}
                          title={selectedMaterial.title}
                        >
                          {renderMaterialContent(fullscreenHeightClass)}
                        </CourseFullscreenDialog>
                      </>
                    );
                  })()}

                  {/* Render material content based on type and URL */}


                  {/* Slide Navigation */}
                  {materials && materials.length > 1 && (
                    <div className="flex items-center justify-between pt-4 border-t border-border">
                      <Button
                        variant="outline"
                        onClick={() => {
                          const prevIndex = currentMaterialIndex - 1;
                          if (prevIndex >= 0) {
                            setCurrentMaterialIndex(prevIndex);
                            setSelectedMaterial(materials[prevIndex] as CourseMaterial);
                          }
                        }}
                        disabled={currentMaterialIndex === 0}
                      >
                        <ChevronLeft className="w-4 h-4 mr-2" />
                        Anterior
                      </Button>
                      
                      <div className="flex items-center gap-2">
                        {materials.map((_, idx) => (
                          <button
                            key={idx}
                            onClick={() => {
                              setCurrentMaterialIndex(idx);
                              setSelectedMaterial(materials[idx] as CourseMaterial);
                            }}
                            className={`w-3 h-3 rounded-full transition-all ${
                              idx === currentMaterialIndex 
                                ? "bg-primary scale-110" 
                                : completedMaterialIds.has(materials[idx].id)
                                  ? "bg-success"
                                  : "bg-muted-foreground/30 hover:bg-muted-foreground/50"
                            }`}
                          />
                        ))}
                      </div>
                      
                      <Button
                        variant="outline"
                        onClick={() => {
                          const nextIndex = currentMaterialIndex + 1;
                          if (nextIndex < materials.length) {
                            setCurrentMaterialIndex(nextIndex);
                            setSelectedMaterial(materials[nextIndex] as CourseMaterial);
                          }
                        }}
                        disabled={currentMaterialIndex === materials.length - 1}
                      >
                        Siguiente
                        <ChevronRight className="w-4 h-4 ml-2" />
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

            {/* Glossary Section */}
            {course && (
              <KeywordsGlossary keywords={course.tags} className="mt-4" />
            )}
          </div>

          {/* Sidebar - Content list */}
          <div className="space-y-4">
            <Tabs defaultValue="materials">
              <TabsList className="w-full grid grid-cols-3">
                <TabsTrigger value="materials">
                  <BookOpen className="w-4 h-4 mr-2" />
                  Materiales
                </TabsTrigger>
                <TabsTrigger value="quizzes">
                  <FileQuestion className="w-4 h-4 mr-2" />
                  Quizzes
                </TabsTrigger>
                <TabsTrigger value="resources">
                  <Link2 className="w-4 h-4 mr-2" />
                  Recursos
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
                          setCurrentMaterialIndex(index);
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
                <Alert className="mb-4 border-warning/50 bg-warning/10">
                  <Target className="h-4 w-4 text-warning" />
                  <AlertDescription className="text-sm">
                    Para aprobar el curso y recibir los <strong>{course.points} puntos</strong>, debes obtener una calificación mínima del <strong>90%</strong> en el quiz.
                  </AlertDescription>
                </Alert>
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
                            {quiz.questions?.length || 0} preguntas • Mínimo 90%
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

              <TabsContent value="resources" className="mt-4 space-y-2">
                {loadingResources ? (
                  <Skeleton className="h-16 w-full" />
                ) : resources && resources.length > 0 ? (
                  resources.map((resource) => (
                    <a
                      key={resource.id}
                      href={resource.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full text-left p-3 rounded-lg border border-border hover:border-primary/50 hover:bg-muted/50 transition-all flex items-center gap-3"
                    >
                      <div className="p-2 rounded-lg bg-primary/10">
                        <Link2 className="w-4 h-4 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate text-primary hover:underline">
                          {resource.title}
                        </p>
                        <p className="text-xs text-muted-foreground truncate">
                          {resource.url}
                        </p>
                      </div>
                      <ExternalLink className="w-4 h-4 text-muted-foreground" />
                    </a>
                  ))
                ) : (
                  <p className="text-center text-muted-foreground py-8">
                    No hay recursos adicionales
                  </p>
                )}
              </TabsContent>
            </Tabs>
          </div>
        </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default CourseDetail;
