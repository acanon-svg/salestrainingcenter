import React, { useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
  MessageSquare,
  Send,
  Plus,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Star,
  Loader2,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";
import { useToast } from "@/hooks/use-toast";

// Mock feedback data
const mockFeedback = [
  {
    id: "1",
    subject: "Mejora en módulo de ventas",
    message: "Sería útil agregar más ejemplos prácticos en el módulo de cierre de ventas.",
    status: "implemented",
    response: "¡Gracias por tu sugerencia! Ya agregamos 5 nuevos casos de estudio.",
    points_awarded: 50,
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 5).toISOString(),
    responded_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2).toISOString(),
  },
  {
    id: "2",
    subject: "Quiz muy largo",
    message: "El quiz del curso de compliance tiene muchas preguntas. Podría dividirse en secciones.",
    status: "in_progress",
    response: null,
    points_awarded: 0,
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3).toISOString(),
  },
  {
    id: "3",
    subject: "Videos no cargan en móvil",
    message: "Los videos del curso de onboarding no cargan correctamente en dispositivos móviles.",
    status: "pending",
    response: null,
    points_awarded: 0,
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
  },
  {
    id: "4",
    subject: "Agregar subtítulos en inglés",
    message: "Sería genial tener subtítulos en inglés para practicar el idioma.",
    status: "rejected",
    response: "Por el momento nos enfocamos en contenido en español, pero lo consideramos para el futuro.",
    points_awarded: 25,
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 7).toISOString(),
    responded_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 6).toISOString(),
  },
];

const Feedback: React.FC = () => {
  const { profile } = useAuth();
  const { toast } = useToast();
  const [feedbackList, setFeedbackList] = useState(mockFeedback);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
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
    if (!newFeedback.subject || !newFeedback.message) {
      toast({
        title: "Error",
        description: "Por favor completa todos los campos",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1000));

    const newItem = {
      id: Date.now().toString(),
      subject: newFeedback.subject,
      message: newFeedback.message,
      status: "pending",
      response: null,
      points_awarded: 0,
      created_at: new Date().toISOString(),
    };

    setFeedbackList([newItem, ...feedbackList]);
    setNewFeedback({ subject: "", message: "", course_id: "" });
    setIsDialogOpen(false);
    setIsSubmitting(false);

    toast({
      title: "¡Feedback enviado!",
      description: "Gracias por tu sugerencia. Te notificaremos cuando sea revisada.",
    });
  };

  const totalPoints = feedbackList.reduce((sum, f) => sum + f.points_awarded, 0);
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
              Feedback y Sugerencias
            </h1>
            <p className="text-muted-foreground">
              Ayúdanos a mejorar la plataforma con tus ideas
            </p>
          </div>

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
                      <SelectItem value="1">Técnicas de Ventas</SelectItem>
                      <SelectItem value="2">Compliance 2024</SelectItem>
                      <SelectItem value="3">Onboarding</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button onClick={handleSubmit} disabled={isSubmitting}>
                  {isSubmitting ? (
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  ) : (
                    <Send className="w-4 h-4 mr-2" />
                  )}
                  Enviar
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
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
                  <p className="text-sm text-muted-foreground">Total enviados</p>
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
                <div className="p-3 rounded-lg bg-addi-yellow/10">
                  <Star className="w-6 h-6 text-addi-yellow" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{totalPoints}</p>
                  <p className="text-sm text-muted-foreground">Puntos ganados</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Feedback List */}
        <Card className="border-border/50">
          <CardHeader>
            <CardTitle>Mis Sugerencias</CardTitle>
            <CardDescription>
              Historial de feedback enviado y sus respuestas
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {feedbackList.map((feedback) => (
                <div
                  key={feedback.id}
                  className="p-4 rounded-lg border border-border/50 space-y-3"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-medium">{feedback.subject}</h3>
                        {getStatusBadge(feedback.status)}
                      </div>
                      <p className="text-sm text-muted-foreground">{feedback.message}</p>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(feedback.created_at), {
                        addSuffix: true,
                        locale: es,
                      })}
                    </span>
                  </div>

                  {feedback.response && (
                    <div className="p-3 rounded-lg bg-muted/50 ml-4 border-l-2 border-primary">
                      <p className="text-sm font-medium text-primary mb-1">Respuesta:</p>
                      <p className="text-sm text-muted-foreground">{feedback.response}</p>
                    </div>
                  )}

                  {feedback.points_awarded > 0 && (
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
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default Feedback;
