import React, { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Award, Download, Eye, Calendar, Trophy, FileText } from "lucide-react";
import { useMyEnrollments } from "@/hooks/useCourses";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { generateDiploma } from "@/lib/generateDiploma";
import { useAuth } from "@/contexts/AuthContext";

export const MyDiplomasSection: React.FC = () => {
  const { profile } = useAuth();
  const { data: enrollments, isLoading } = useMyEnrollments();
  const [previewDiploma, setPreviewDiploma] = useState<{
    courseName: string;
    completedAt: string;
    score: number | null;
    points: number;
  } | null>(null);

  // Filter only completed enrollments
  const completedEnrollments = enrollments?.filter(
    (e) => e.status === "completed" && e.course
  ) || [];

  const handleDownloadDiploma = (enrollment: any) => {
    generateDiploma({
      userName: profile?.full_name || profile?.email || "Estudiante",
      courseName: enrollment.course.title,
      completionDate: new Date(enrollment.completed_at || enrollment.updated_at),
      score: enrollment.score,
      points: enrollment.points_earned || enrollment.course.points,
      duration: enrollment.course.estimated_duration_minutes,
    });
  };

  const handlePreviewDiploma = (enrollment: any) => {
    setPreviewDiploma({
      courseName: enrollment.course.title,
      completedAt: enrollment.completed_at || enrollment.updated_at,
      score: enrollment.score,
      points: enrollment.points_earned || enrollment.course.points,
    });
  };

  if (isLoading) {
    return (
      <Card className="border-border/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Award className="h-5 w-5 text-primary" />
            Mis Diplomas
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-20 bg-muted rounded-lg" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card className="border-border/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Award className="h-5 w-5 text-primary" />
            Mis Diplomas
          </CardTitle>
          <CardDescription>
            Certificados de los cursos que has completado exitosamente
          </CardDescription>
        </CardHeader>
        <CardContent>
          {completedEnrollments.length === 0 ? (
            <div className="text-center py-8">
              <Award className="h-12 w-12 mx-auto text-muted-foreground/50 mb-3" />
              <p className="text-muted-foreground">
                Aún no tienes diplomas. Completa cursos para obtener tus certificados.
              </p>
            </div>
          ) : (
            <ScrollArea className="max-h-96">
              <div className="space-y-3">
                {completedEnrollments.map((enrollment: any) => (
                  <div
                    key={enrollment.id}
                    className="flex items-center justify-between p-4 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
                  >
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium truncate">{enrollment.course.title}</h4>
                      <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground flex-wrap">
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {format(
                            new Date(enrollment.completed_at || enrollment.updated_at),
                            "d MMM yyyy",
                            { locale: es }
                          )}
                        </span>
                        {enrollment.score !== null && (
                          <Badge 
                            variant="secondary" 
                            className={`gap-1 ${
                              enrollment.score >= 80 
                                ? "bg-success/10 text-success" 
                                : enrollment.score >= 60 
                                  ? "bg-warning/10 text-warning" 
                                  : "bg-destructive/10 text-destructive"
                            }`}
                          >
                            <Trophy className="h-3 w-3" />
                            {enrollment.score}%
                          </Badge>
                        )}
                        {enrollment.points_earned > 0 && (
                          <span className="flex items-center gap-1 text-primary">
                            <Trophy className="h-3 w-3" />
                            {enrollment.points_earned} pts
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 ml-4">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handlePreviewDiploma(enrollment)}
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        Ver
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => handleDownloadDiploma(enrollment)}
                      >
                        <Download className="h-4 w-4 mr-1" />
                        Descargar
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          )}
        </CardContent>
      </Card>

      {/* Preview Dialog */}
      <Dialog open={!!previewDiploma} onOpenChange={() => setPreviewDiploma(null)}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-primary" />
              Vista Previa del Diploma
            </DialogTitle>
          </DialogHeader>
          {previewDiploma && (
            <div className="space-y-4">
              {/* Diploma Preview Card */}
              <div className="relative bg-gradient-to-br from-primary/5 via-background to-primary/10 rounded-lg p-8 border-2 border-primary/20">
                {/* Decorative corners */}
                <div className="absolute top-0 left-0 w-12 h-12 border-l-4 border-t-4 border-primary/30 rounded-tl-lg" />
                <div className="absolute top-0 right-0 w-12 h-12 border-r-4 border-t-4 border-primary/30 rounded-tr-lg" />
                <div className="absolute bottom-0 left-0 w-12 h-12 border-l-4 border-b-4 border-primary/30 rounded-bl-lg" />
                <div className="absolute bottom-0 right-0 w-12 h-12 border-r-4 border-b-4 border-primary/30 rounded-br-lg" />
                
                <div className="text-center space-y-4">
                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-2">
                    <Award className="h-8 w-8 text-primary" />
                  </div>
                  
                  <div>
                    <p className="text-xs uppercase tracking-widest text-muted-foreground mb-1">
                      Training Center
                    </p>
                    <h2 className="text-2xl font-bold text-primary">
                      Certificado de Finalización
                    </h2>
                  </div>
                  
                  <div className="py-4">
                    <p className="text-sm text-muted-foreground mb-2">
                      Este certificado se otorga a
                    </p>
                    <p className="text-xl font-semibold">
                      {profile?.full_name || profile?.email || "Estudiante"}
                    </p>
                  </div>
                  
                  <div>
                    <p className="text-sm text-muted-foreground mb-2">
                      Por haber completado exitosamente el curso
                    </p>
                    <p className="text-lg font-semibold text-primary">
                      {previewDiploma.courseName}
                    </p>
                  </div>
                  
                  <div className="flex items-center justify-center gap-6 pt-4 text-sm">
                    <div>
                      <p className="text-muted-foreground">Fecha de finalización</p>
                      <p className="font-medium">
                        {format(new Date(previewDiploma.completedAt), "d 'de' MMMM 'de' yyyy", { locale: es })}
                      </p>
                    </div>
                    {previewDiploma.score !== null && (
                      <div>
                        <p className="text-muted-foreground">Calificación</p>
                        <p className="font-medium text-primary">{previewDiploma.score}%</p>
                      </div>
                    )}
                    {previewDiploma.points > 0 && (
                      <div>
                        <p className="text-muted-foreground">Puntos</p>
                        <p className="font-medium">{previewDiploma.points}</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
              
              <div className="flex justify-end">
                <Button onClick={() => {
                  generateDiploma({
                    userName: profile?.full_name || profile?.email || "Estudiante",
                    courseName: previewDiploma.courseName,
                    completionDate: new Date(previewDiploma.completedAt),
                    score: previewDiploma.score || undefined,
                    points: previewDiploma.points,
                  });
                  setPreviewDiploma(null);
                }}>
                  <Download className="h-4 w-4 mr-2" />
                  Descargar PDF
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};
