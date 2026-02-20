import React, { useState, useEffect, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import DOMPurify from "dompurify";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { useCourse, useCourseMaterials, useCourseQuizzes, useCourseResources, useUpdateEnrollmentProgress, useMyEnrollments, useEnrollInCourse } from "@/hooks/useCourses";
import { useMaterialProgress, useMarkMaterialComplete } from "@/hooks/useMaterialProgress";
import { useQuizAttempts, useSubmitQuizAttempt } from "@/hooks/useQuizAttempts";
import { useCourseFeedback, useSubmitCourseFeedback } from "@/hooks/useFeedback";
import { useAuth } from "@/contexts/AuthContext";
import { useBadgeAwarder } from "@/hooks/useBadgeAwarder";
import { gradeQuestion } from "@/components/quiz/grading";
import { isAdvancedType, questionTypeLabels } from "@/components/quiz/types";
import { MindMapPlayer } from "@/components/quiz/players/MindMapPlayer";
import { FillBlanksPlayer } from "@/components/quiz/players/FillBlanksPlayer";
import { MatchColumnsPlayer } from "@/components/quiz/players/MatchColumnsPlayer";
import { ImagePuzzlePlayer } from "@/components/quiz/players/ImagePuzzlePlayer";
import { OpenAnswerPlayer } from "@/components/quiz/players/OpenAnswerPlayer";
import { ImageActivityPlayer } from "@/components/quiz/players/ImageActivityPlayer";
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
import { supabase } from "@/integrations/supabase/client";
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
  const { checkAndAwardBadges } = useBadgeAwarder();

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
  const [quizAnswers, setQuizAnswers] = useState<Record<string, any>>({});
  const [quizStartTime, setQuizStartTime] = useState<Date | null>(null);
  const [showQuizResults, setShowQuizResults] = useState(false);
  const [lastQuizScore, setLastQuizScore] = useState<{ score: number; passed: boolean; coursePoints?: number; gradeDetails?: Record<string, Record<string, boolean>> } | null>(null);
  const [currentMaterialIndex, setCurrentMaterialIndex] = useState<number>(0);
  const [isTimeExpired, setIsTimeExpired] = useState(false);
  const [isFullscreenOpen, setIsFullscreenOpen] = useState(false);

  const enrollment = enrollments?.find((e) => e.course_id === id);
  const isCourseExpired = useMemo(() => {
    if (!course?.expires_at) return false;
    return new Date(course.expires_at) < new Date();
  }, [course?.expires_at]);
  const completedMaterialIds = new Set(materialProgress?.filter((p) => p.completed).map((p) => p.material_id) || []);

  // Calculate progress
  const totalMaterials = materials?.length || 0;
  const completedMaterials = completedMaterialIds.size;
  const progressPercentage = totalMaterials > 0 ? Math.round((completedMaterials / totalMaterials) * 100) : 0;

  // Update enrollment progress when materials are completed
  // NOTE: We only update progress percentage here, NOT status to "completed"
  // The course should only be marked as "completed" when the user passes the quiz
  // This is handled in useSubmitQuizAttempt hook
  useEffect(() => {
    if (enrollment && enrollment.status !== "completed" && progressPercentage !== enrollment.progress_percentage) {
      updateProgress.mutate({
        enrollmentId: enrollment.id,
        progress: progressPercentage,
        status: "in_progress", // Never auto-complete here, quiz must be passed
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
    const allGradeDetails: Record<string, Record<string, boolean>> = {};

    questions.forEach((q) => {
      const userAnswer = quizAnswers[q.id];
      const result = gradeQuestion(
        (q.question_type || "multiple_choice") as any,
        q.options,
        userAnswer
      );
      allGradeDetails[q.id] = result.details;
      if (result.correct) {
        correctAnswers++;
      }
    });

    const score = questions.length > 0 ? Math.round((correctAnswers / questions.length) * 100) : 0;
    const MINIMUM_PASSING_SCORE = 90;
    const passed = score >= MINIMUM_PASSING_SCORE;

    const effectivePoints = isCourseExpired ? Math.floor((course?.points || 0) / 2) : course?.points;

    try {
      await submitQuiz.mutateAsync({
        quizId: selectedQuiz.id,
        answers: quizAnswers,
        score,
        passed,
        startedAt: quizStartTime,
        courseId: id,
        coursePoints: effectivePoints,
      });

      setLastQuizScore({ score, passed, coursePoints: effectivePoints, gradeDetails: allGradeDetails });
      setShowQuizResults(true);

      if (passed) {
        const pointsMsg = isCourseExpired
          ? `Obtuviste ${score}% y has ganado ${effectivePoints} puntos (50% por completar fuera del plazo de vencimiento). Podrás verlos reflejados en tu perfil.`
          : `Obtuviste ${score}% y has ganado ${course?.points || 0} puntos. Podrás verlos reflejados en tu perfil.`;
        toast({
          title: "🎉 ¡Felicitaciones! Has aprobado el curso",
          description: pointsMsg,
        });
        // Small delay to ensure database has updated enrollment status before checking badges
        setTimeout(async () => {
          await checkAndAwardBadges();
        }, 500);
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
                      {isCourseExpired && (
                        <span className="block text-warning mt-1">
                          <AlertTriangle className="w-3 h-3 inline mr-1" />
                          Este curso está vencido. Si lo completas, recibirás solo el 50% de los puntos ({Math.floor((course?.points || 0) / 2)} pts).
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
                    <div className="flex items-center gap-2">
                      <Button size="sm" onClick={handleDownloadDiploma} className="gap-2">
                        <Download className="w-4 h-4" />
                        Descargar Diploma
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="gap-2 border-green-500 text-green-600 hover:bg-green-50 dark:hover:bg-green-950 animate-[pulse_2s_cubic-bezier(0.4,0,0.6,1)_infinite] hover:animate-none transition-all hover:scale-105 shadow-md hover:shadow-lg font-bold"
                        onClick={async () => {
                          const courseUrl = `${window.location.origin}/courses/${id}`;
                          const message = `🎓 ¡Acabo de completar el curso *${course.title}* en el Sales Training Center! Te lo recomiendo, échale un vistazo 👉 ${courseUrl}`;
                          window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, "_blank");
                          
                          // Award 5 points for sharing (only once per course)
                          if (profile?.user_id && id) {
                            try {
                              // Check if already shared this course
                              const { data: existingShare } = await supabase
                                .from("notifications")
                                .select("id")
                                .eq("user_id", profile.user_id)
                                .eq("type", "whatsapp_share")
                                .eq("related_id", id)
                                .maybeSingle();
                              
                              if (!existingShare) {
                                // Award points
                                await supabase
                                  .from("profiles")
                                  .update({ points: (profile.points || 0) + 5 })
                                  .eq("user_id", profile.user_id);
                                
                                // Track the share
                                await supabase
                                  .from("notifications")
                                  .insert({
                                    user_id: profile.user_id,
                                    title: "🎉 ¡+5 puntos por recomendar!",
                                    message: `Has ganado 5 puntos por recomendar el curso "${course.title}" por WhatsApp.`,
                                    type: "whatsapp_share",
                                    related_id: id,
                                  });
                                
                                toast({
                                  title: "🎉 ¡+5 puntos ganados!",
                                  description: "Gracias por recomendar el curso por WhatsApp.",
                                });
                              }
                            } catch (err) {
                              console.error("Error awarding share points:", err);
                            }
                          }
                        }}
                      >
                        <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                        <span className="flex flex-col items-start leading-tight">
                          <span className="font-semibold text-[10px]">Gana 5 puntos por recomendar</span>
                          <span className="text-[12px] font-bold">WhatsApp</span>
                        </span>
                      </Button>
                    </div>
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

        {/* Completed course banner - show when course is completed */}
        {enrollment?.status === "completed" && (
          <Card className="border-success bg-success/10">
            <CardContent className="py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Award className="w-8 h-8 text-success" />
                  <div>
                    <h3 className="font-semibold text-success">¡Curso Completado!</h3>
                    <p className="text-sm text-muted-foreground">
                      Puedes revisar el material en cualquier momento
                    </p>
                  </div>
                </div>
                <Button size="sm" onClick={handleDownloadDiploma} className="gap-2">
                  <Download className="w-4 h-4" />
                  Descargar Diploma
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Time expired overlay - blocks content */}
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

        {/* Course expired (past expires_at) warning - allow continuing with 50% points */}
        {isCourseExpired && enrollment?.status !== "completed" && !isTimeExpired && (
          <Card className="border-warning bg-warning/10">
            <CardContent className="py-4">
              <div className="flex items-center gap-3">
                <AlertTriangle className="w-8 h-8 text-warning flex-shrink-0" />
                <div>
                  <h3 className="font-semibold text-warning">Curso Vencido - 50% de Puntos</h3>
                  <p className="text-sm text-muted-foreground">
                    La fecha de vencimiento de este curso ya pasó. 
                    Puedes continuar con el contenido, pero al aprobar el quiz recibirás solo el <strong>50% de los puntos</strong> ({Math.floor((course?.points || 0) / 2)} pts en vez de {course?.points || 0} pts).
                  </p>
                </div>
              </div>
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

        {/* Main content - visible when enrolled (hidden when timer expired for non-completed courses) */}
        {enrollment && (enrollment.status === "completed" || !isTimeExpired) && (
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
                      {selectedQuiz.questions?.map((question, index) => {
                        const qType = (question.question_type || "multiple_choice") as string;
                        const showResultsForQ = showQuizResults && lastQuizScore;
                        const resultDetails = lastQuizScore?.gradeDetails?.[question.id];

                        return (
                          <div key={question.id} className="space-y-3 p-4 rounded-lg bg-muted/50">
                            <p className="font-medium">
                              {index + 1}. {question.question}
                              {qType !== "multiple_choice" && qType !== "true_false" && (
                                <span className="ml-2 text-xs text-muted-foreground">
                                  ({questionTypeLabels[qType as keyof typeof questionTypeLabels] || qType})
                                </span>
                              )}
                            </p>

                            {/* Standard MC/TF */}
                            {(qType === "multiple_choice" || qType === "true_false") && (
                              <RadioGroup
                                value={quizAnswers[question.id] || ""}
                                onValueChange={(value) =>
                                  setQuizAnswers((prev) => ({ ...prev, [question.id]: value }))
                                }
                              >
                                {question.options?.map((option: any, optIndex: number) => (
                                  <div key={optIndex} className="flex items-center space-x-2">
                                    <RadioGroupItem value={option.text} id={`${question.id}-${optIndex}`} />
                                    <Label htmlFor={`${question.id}-${optIndex}`}>{option.text}</Label>
                                  </div>
                                ))}
                              </RadioGroup>
                            )}

                            {/* Mind Map */}
                            {qType === "mind_map" && (
                              <MindMapPlayer
                                data={question.options as any}
                                answer={quizAnswers[question.id] || {}}
                                onChange={(val) => setQuizAnswers((prev) => ({ ...prev, [question.id]: val }))}
                                showResults={showResultsForQ ? true : false}
                                resultDetails={resultDetails}
                              />
                            )}

                            {/* Fill Blanks */}
                            {qType === "fill_blanks" && (
                              <FillBlanksPlayer
                                data={question.options as any}
                                answer={quizAnswers[question.id] || {}}
                                onChange={(val) => setQuizAnswers((prev) => ({ ...prev, [question.id]: val }))}
                                showResults={showResultsForQ ? true : false}
                                resultDetails={resultDetails}
                              />
                            )}

                            {/* Match Columns */}
                            {qType === "match_columns" && (
                              <MatchColumnsPlayer
                                data={question.options as any}
                                answer={quizAnswers[question.id] || {}}
                                onChange={(val) => setQuizAnswers((prev) => ({ ...prev, [question.id]: val }))}
                                showResults={showResultsForQ ? true : false}
                                resultDetails={resultDetails}
                              />
                            )}

                            {/* Image Puzzle */}
                            {qType === "image_puzzle" && (
                              <ImagePuzzlePlayer
                                data={question.options as any}
                                answer={quizAnswers[question.id] || []}
                                onChange={(val) => setQuizAnswers((prev) => ({ ...prev, [question.id]: val }))}
                                showResults={showResultsForQ ? true : false}
                                resultDetails={resultDetails}
                              />
                            )}

                            {/* Open Answer */}
                            {qType === "open_answer" && (
                              <OpenAnswerPlayer
                                data={question.options as any}
                                answer={quizAnswers[question.id] || ""}
                                onChange={(val) => setQuizAnswers((prev) => ({ ...prev, [question.id]: val }))}
                                showResults={showResultsForQ ? true : false}
                              />
                            )}

                            {/* Image Activity */}
                            {qType === "image_activity" && (
                              <ImageActivityPlayer
                                data={question.options as any}
                                answer={quizAnswers[question.id] || {}}
                                onChange={(val) => setQuizAnswers((prev) => ({ ...prev, [question.id]: val }))}
                                showResults={showResultsForQ ? true : false}
                              />
                            )}
                          </div>
                        );
                      })}
                      <Button
                        onClick={handleSubmitQuiz}
                        className="w-full"
                        disabled={
                          Object.keys(quizAnswers).length < (selectedQuiz.questions?.length || 0) ||
                          submitQuiz.isPending
                        }
                      >
                        {submitQuiz.isPending ? "Enviando..." : "Enviar respuestas"}
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
                    {!completedMaterialIds.has(selectedMaterial.id) && enrollment?.status !== "completed" && (
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
                {enrollment?.status === "completed" ? (
                  <Alert className="mb-4 border-success/50 bg-success/10">
                    <CheckCircle2 className="h-4 w-4 text-success" />
                    <AlertDescription className="text-sm">
                      ¡Felicidades! Ya completaste este curso y ganaste <strong>{course.points} puntos</strong>. Los quizzes ya no están disponibles.
                    </AlertDescription>
                  </Alert>
                ) : (
                  <Alert className="mb-4 border-warning/50 bg-warning/10">
                    <Target className="h-4 w-4 text-warning" />
                    <AlertDescription className="text-sm">
                      Para aprobar el curso y recibir los <strong>{course.points} puntos</strong>, debes obtener una calificación mínima del <strong>90%</strong> en el quiz.
                    </AlertDescription>
                  </Alert>
                )}
                {loadingQuizzes ? (
                  <Skeleton className="h-16 w-full" />
                ) : quizzes && quizzes.length > 0 ? (
                  quizzes.map((quiz) => (
                    <div
                      key={quiz.id}
                      className={`w-full text-left p-3 rounded-lg border transition-all ${
                        enrollment?.status === "completed"
                          ? "border-success bg-success/5 cursor-default"
                          : selectedQuiz?.id === quiz.id 
                            ? "border-primary bg-primary/10 cursor-pointer" 
                            : "border-border hover:border-primary/50 hover:bg-muted/50 cursor-pointer"
                      }`}
                      onClick={() => {
                        if (enrollment?.status !== "completed") {
                          handleStartQuiz(quiz as Quiz);
                        }
                      }}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg ${
                          enrollment?.status === "completed" ? "bg-success/20" : "bg-addi-orange/20"
                        }`}>
                          {enrollment?.status === "completed" ? (
                            <CheckCircle2 className="w-4 h-4 text-success" />
                          ) : (
                            <FileQuestion className="w-4 h-4 text-addi-orange" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className={`font-medium truncate ${enrollment?.status === "completed" ? "text-success" : ""}`}>
                            {quiz.title}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {enrollment?.status === "completed" 
                              ? "✓ Quiz aprobado" 
                              : `${quiz.questions?.length || 0} preguntas • Mínimo 90%`}
                          </p>
                        </div>
                        {enrollment?.status !== "completed" && (
                          <ChevronRight className="w-4 h-4 text-muted-foreground" />
                        )}
                      </div>
                    </div>
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
