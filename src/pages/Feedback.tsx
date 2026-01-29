import React, { useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  MessageSquare,
  Send,
  Plus,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Star,
  Loader2,
  Trash2,
  User,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";
import { Skeleton } from "@/components/ui/skeleton";
import { useFeedback, useCreateFeedback, useDeleteFeedback, Feedback as FeedbackType } from "@/hooks/useFeedback";
import { useCourses } from "@/hooks/useCourses";

const Feedback: React.FC = () => {
  const { profile, hasRole } = useAuth();
  const isCreatorOrAdmin = hasRole("creator") || hasRole("admin");
  
  const { data: feedbackList = [], isLoading } = useFeedback();
  const { data: courses = [] } = useCourses({ status: "published" });
  const createFeedback = useCreateFeedback();
  const deleteFeedback = useDeleteFeedback();
  
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newFeedback, setNewFeedback] = useState({
    subject: "",
    message: "",
    course_id: "",
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return (
          <Badge variant="outline" className="gap-1 text-warning border-warning">
            <Clock className="w-3 h-3" />
            Pendiente
          </Badge>
        );
      case "in_progress":
        return (
          <Badge variant="outline" className="gap-1 text-primary border-primary">
            <AlertCircle className="w-3 h-3" />
            En Proceso
          </Badge>
        );
      case "implemented":
        return (
          <Badge className="gap-1 bg-success text-success-foreground">
            <CheckCircle className="w-3 h-3" />
            Implementado
          </Badge>
        );
      case "rejected":
        return (
          <Badge variant="outline" className="gap-1 text-muted-foreground">
            <XCircle className="w-3 h-3" />
            No Aplica
          </Badge>
        );
      default:
        return null;
    }
  };

  const handleSubmit = async () => {
    if (!newFeedback.subject || !newFeedback.message) return;

    await createFeedback.mutateAsync({
      subject: newFeedback.subject,
      message: newFeedback.message,
      course_id: newFeedback.course_id || undefined,
    });

    setNewFeedback({ subject: "", message: "", course_id: "" });
    setIsDialogOpen(false);
  };

  const handleDelete = async (feedbackId: string) => {
    await deleteFeedback.mutateAsync(feedbackId);
  };

  const totalPoints = feedbackList.reduce((sum, f) => sum + (f.points_awarded || 0), 0);
  const pendingCount = feedbackList.filter((f) => f.status === "pending").length;
  const implementedCount = feedbackList.filter((f) => f.status === "implemented").length;

  return (
    <DashboardLayout>
      <div className="space-y-8 animate-fade-in">
        {/* Header */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
              <MessageSquare className="w-8 h-8 text-primary" />
              {isCreatorOrAdmin ? "Gestión de Feedback" : "Feedback y Sugerencias"}
            </h1>
            <p className="text-muted-foreground">
              {isCreatorOrAdmin 
                ? "Revisa y gestiona las sugerencias de los usuarios" 
                : "Ayúdanos a mejorar la plataforma con tus ideas"}
            </p>
          </div>

          {!isCreatorOrAdmin && (
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button className="gap-2">
                  <Plus className="w-4 h-4" />
                  Nuevo Feedback
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Enviar Feedback</DialogTitle>
                  <DialogDescription>
                    Tu opinión nos ayuda a mejorar. Recibirás puntos cuando tu feedback sea revisado.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="subject">Asunto</Label>
                    <Input
                      id="subject"
                      placeholder="Resumen de tu sugerencia"
                      value={newFeedback.subject}
                      onChange={(e) =>
                        setNewFeedback({ ...newFeedback, subject: e.target.value })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="message">Descripción</Label>
                    <Textarea
                      id="message"
                      placeholder="Describe tu sugerencia con detalle..."
                      rows={4}
                      value={newFeedback.message}
                      onChange={(e) =>
                        setNewFeedback({ ...newFeedback, message: e.target.value })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="course">Curso relacionado (opcional)</Label>
                    <Select
                      value={newFeedback.course_id}
                      onValueChange={(value) =>
                        setNewFeedback({ ...newFeedback, course_id: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecciona un curso" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="general">Sugerencia general</SelectItem>
                        {courses.map((course) => (
                          <SelectItem key={course.id} value={course.id}>
                            {course.title}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                    Cancelar
                  </Button>
                  <Button 
                    onClick={handleSubmit} 
                    disabled={createFeedback.isPending || !newFeedback.subject || !newFeedback.message}
                  >
                    {createFeedback.isPending ? (
                      <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    ) : (
                      <Send className="w-4 h-4 mr-2" />
                    )}
                    Enviar
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          )}
        </div>

        {/* Stats */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card className="border-border/50">
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-lg bg-primary/10">
                  <MessageSquare className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{feedbackList.length}</p>
                  <p className="text-sm text-muted-foreground">
                    {isCreatorOrAdmin ? "Total recibidos" : "Total enviados"}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-border/50">
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-lg bg-success/10">
                  <CheckCircle className="w-6 h-6 text-success" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{implementedCount}</p>
                  <p className="text-sm text-muted-foreground">Implementados</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-border/50">
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-lg bg-warning/10">
                  <Clock className="w-6 h-6 text-warning" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{pendingCount}</p>
                  <p className="text-sm text-muted-foreground">Pendientes</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Feedback List */}
        <Card className="border-border/50">
          <CardHeader>
            <CardTitle>{isCreatorOrAdmin ? "Todos los Feedbacks" : "Mis Sugerencias"}</CardTitle>
            <CardDescription>
              {isCreatorOrAdmin 
                ? "Historial de feedback recibido de usuarios"
                : "Historial de feedback enviado y sus respuestas"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-32 w-full" />
                ))}
              </div>
            ) : feedbackList.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <MessageSquare className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>No hay feedback registrado aún.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {feedbackList.map((feedback) => (
                  <div
                    key={feedback.id}
                    className="p-4 rounded-lg border border-border/50 space-y-3"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <h3 className="font-medium">{feedback.subject}</h3>
                          {getStatusBadge(feedback.status)}
                        </div>
                        <p className="text-sm text-muted-foreground">{feedback.message}</p>
                        
                        {isCreatorOrAdmin && feedback.sender_profile && (
                          <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                            <User className="w-3 h-3" />
                            <span>
                              {feedback.sender_profile.full_name || feedback.sender_profile.email}
                            </span>
                          </div>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground">
                          {formatDistanceToNow(new Date(feedback.created_at), {
                            addSuffix: true,
                            locale: es,
                          })}
                        </span>
                        
                        {isCreatorOrAdmin && (
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="text-destructive hover:text-destructive"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>¿Eliminar este feedback?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Esta acción no se puede deshacer. El feedback será eliminado permanentemente.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => handleDelete(feedback.id)}
                                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                >
                                  Eliminar
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        )}
                      </div>
                    </div>

                    {feedback.response && (
                      <div className="p-3 rounded-lg bg-muted/50 ml-4 border-l-2 border-primary">
                        <p className="text-sm font-medium text-primary mb-1">Respuesta:</p>
                        <p className="text-sm text-muted-foreground">{feedback.response}</p>
                      </div>
                    )}

                    {(feedback.points_awarded ?? 0) > 0 && (
                      <div className="flex items-center gap-2 text-sm">
                        <Star className="w-4 h-4 text-addi-yellow" />
                        <span className="font-medium text-addi-yellow">
                          +{feedback.points_awarded} puntos
                        </span>
                        <span className="text-muted-foreground">por tu feedback</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default Feedback;