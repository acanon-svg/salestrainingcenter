import React, { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { 
  BookOpen, 
  ThumbsUp, 
  ThumbsDown, 
  Video, 
  FileText, 
  Link as LinkIcon, 
  Eye,
  MessageSquare,
  Send,
  Loader2,
  Star,
  AlertCircle
} from "lucide-react";
import { useTrainingMaterials, useMaterialFeedback, TrainingMaterial } from "@/hooks/useTrainingMaterials";
import { useMaterialCategories } from "@/hooks/useMaterialCategories";
import { MaterialViewer } from "./MaterialViewer";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

const typeIcons = {
  video: Video,
  documento: FileText,
  link: LinkIcon,
};

const typeLabels = {
  video: "Video",
  documento: "Documento",
  link: "Enlace",
};

export const ProfileMaterialsSection: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const { data: materials, isLoading } = useTrainingMaterials({ onlyPublished: true });
  const { data: categories } = useMaterialCategories();
  const feedbackMutation = useMaterialFeedback();
  
  const [viewingMaterial, setViewingMaterial] = useState<TrainingMaterial | null>(null);
  const [feedbackDialogOpen, setFeedbackDialogOpen] = useState(false);
  const [feedbackMaterial, setFeedbackMaterial] = useState<TrainingMaterial | null>(null);
  const [feedbackSubject, setFeedbackSubject] = useState("");
  const [feedbackMessage, setFeedbackMessage] = useState("");
  const [isSubmittingFeedback, setIsSubmittingFeedback] = useState(false);

  // Filter materials that haven't been rated yet
  const unreviewedMaterials = materials?.filter(m => m.user_feedback === null) || [];
  const reviewedMaterials = materials?.filter(m => m.user_feedback !== null) || [];

  const getCategoryById = (id: string | null) => {
    if (!id) return null;
    return categories?.flat.find(c => c.id === id);
  };

  const handleFeedback = async (material: TrainingMaterial, isUseful: boolean) => {
    if (!isUseful) {
      // Open feedback dialog for negative reviews
      setFeedbackMaterial(material);
      setFeedbackSubject(`Feedback sobre: ${material.title}`);
      setFeedbackMessage("");
      setFeedbackDialogOpen(true);
    }
    
    // Submit the rating
    feedbackMutation.mutate({ materialId: material.id, isUseful });
  };

  const handleSubmitDetailedFeedback = async () => {
    if (!feedbackMaterial || !feedbackMessage.trim() || !user) return;

    setIsSubmittingFeedback(true);
    try {
      // Get the creator of the material to send feedback to them
      const { error } = await supabase.from("feedback").insert({
        sender_id: user.id,
        recipient_id: feedbackMaterial.created_by,
        material_id: feedbackMaterial.id,
        subject: feedbackSubject || `Feedback sobre: ${feedbackMaterial.title}`,
        message: feedbackMessage,
        status: "pending",
      });

      if (error) throw error;

      toast({
        title: "¡Feedback enviado!",
        description: "Gracias por ayudarnos a mejorar el contenido. Tu feedback será revisado pronto.",
      });

      setFeedbackDialogOpen(false);
      setFeedbackMaterial(null);
      setFeedbackSubject("");
      setFeedbackMessage("");
    } catch (error: any) {
      toast({
        title: "Error",
        description: "No se pudo enviar el feedback. Intenta de nuevo.",
        variant: "destructive",
      });
    } finally {
      setIsSubmittingFeedback(false);
    }
  };

  if (isLoading) {
    return (
      <Card className="border-border/50">
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  if (!materials?.length) {
    return (
      <Card className="border-border/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-primary" />
            Material Formativo
          </CardTitle>
          <CardDescription>
            No hay material formativo disponible para tu equipo
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <>
      <Card className="border-border/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-primary" />
            Material Formativo
          </CardTitle>
          <CardDescription>
            Consulta y califica el material de apoyo disponible
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Pending Reviews Alert */}
          {unreviewedMaterials.length > 0 && (
            <div className="flex items-start gap-3 p-4 rounded-lg bg-amber-500/10 border border-amber-500/20">
              <Star className="h-5 w-5 text-amber-500 mt-0.5" />
              <div className="flex-1">
                <p className="font-medium text-amber-700 dark:text-amber-400">
                  ¡Tienes {unreviewedMaterials.length} material{unreviewedMaterials.length > 1 ? "es" : ""} sin calificar!
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  Tu opinión nos ayuda a mejorar el contenido. Califica cada material con 👍 o 👎
                </p>
              </div>
            </div>
          )}

          {/* Unreviewed Materials */}
          {unreviewedMaterials.length > 0 && (
            <div className="space-y-3">
              <h4 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">
                Pendientes de calificar
              </h4>
              <div className="space-y-2">
                {unreviewedMaterials.slice(0, 5).map((material) => {
                  const Icon = typeIcons[material.type];
                  const category = getCategoryById(material.category_id);
                  
                  return (
                    <div 
                      key={material.id}
                      className="flex items-center gap-3 p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
                      style={{ borderLeftWidth: "3px", borderLeftColor: category?.color || "#6b7280" }}
                    >
                      <div 
                        className="p-2 rounded-lg shrink-0"
                        style={{ backgroundColor: `${category?.color || "#6b7280"}15` }}
                      >
                        <Icon className="h-4 w-4" style={{ color: category?.color || "#6b7280" }} />
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm line-clamp-1">{material.title}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge 
                            variant="outline" 
                            className="text-xs"
                            style={{ borderColor: category?.color, color: category?.color }}
                          >
                            {typeLabels[material.type]}
                          </Badge>
                          {category && (
                            <span className="text-xs text-muted-foreground">{category.name}</span>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => setViewingMaterial(material)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <div className="flex items-center gap-1 border-l pl-2">
                          <span className="text-xs text-muted-foreground mr-1">¿Útil?</span>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 hover:text-green-600 hover:bg-green-50"
                            onClick={() => handleFeedback(material, true)}
                            disabled={feedbackMutation.isPending}
                          >
                            <ThumbsUp className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 hover:text-red-600 hover:bg-red-50"
                            onClick={() => handleFeedback(material, false)}
                            disabled={feedbackMutation.isPending}
                          >
                            <ThumbsDown className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  );
                })}
                {unreviewedMaterials.length > 5 && (
                  <p className="text-sm text-muted-foreground text-center py-2">
                    +{unreviewedMaterials.length - 5} materiales más por calificar
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Already Reviewed Materials */}
          {reviewedMaterials.length > 0 && (
            <div className="space-y-3">
              <h4 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">
                Ya calificados ({reviewedMaterials.length})
              </h4>
              <div className="grid gap-2 md:grid-cols-2">
                {reviewedMaterials.slice(0, 4).map((material) => {
                  const Icon = typeIcons[material.type];
                  const category = getCategoryById(material.category_id);
                  
                  return (
                    <div 
                      key={material.id}
                      className="flex items-center gap-2 p-2 rounded-lg bg-muted/30"
                    >
                      <Icon className="h-4 w-4 text-muted-foreground" />
                      <span className="flex-1 text-sm line-clamp-1">{material.title}</span>
                      {material.user_feedback === true ? (
                        <ThumbsUp className="h-4 w-4 text-green-600" />
                      ) : (
                        <ThumbsDown className="h-4 w-4 text-red-600" />
                      )}
                    </div>
                  );
                })}
              </div>
              {reviewedMaterials.length > 4 && (
                <p className="text-xs text-muted-foreground text-center">
                  +{reviewedMaterials.length - 4} más calificados
                </p>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Material Viewer */}
      <MaterialViewer
        material={viewingMaterial}
        open={!!viewingMaterial}
        onOpenChange={(open) => !open && setViewingMaterial(null)}
        showFeedback={true}
      />

      {/* Negative Feedback Dialog */}
      <Dialog open={feedbackDialogOpen} onOpenChange={setFeedbackDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5 text-primary" />
              Cuéntanos más
            </DialogTitle>
            <DialogDescription>
              Lamentamos que este contenido no te haya sido útil. Tu feedback nos ayuda a mejorar.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {feedbackMaterial && (
              <div className="p-3 rounded-lg bg-muted/50 flex items-center gap-3">
                <AlertCircle className="h-5 w-5 text-muted-foreground" />
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm line-clamp-1">{feedbackMaterial.title}</p>
                  <p className="text-xs text-muted-foreground">Material calificado negativamente</p>
                </div>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="feedback-subject">Asunto</Label>
              <Input
                id="feedback-subject"
                value={feedbackSubject}
                onChange={(e) => setFeedbackSubject(e.target.value)}
                placeholder="¿Qué aspecto quieres comentar?"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="feedback-message">Tu comentario *</Label>
              <Textarea
                id="feedback-message"
                value={feedbackMessage}
                onChange={(e) => setFeedbackMessage(e.target.value)}
                placeholder="¿Qué podemos mejorar? ¿Falta información? ¿Hay errores?"
                rows={4}
              />
            </div>

            <div className="text-xs text-muted-foreground bg-muted/30 p-3 rounded-lg">
              <Star className="h-4 w-4 inline mr-1 text-amber-500" />
              Tu feedback será enviado al creador del contenido y recibirás puntos cuando sea revisado.
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setFeedbackDialogOpen(false)}>
              Omitir
            </Button>
            <Button 
              onClick={handleSubmitDetailedFeedback} 
              disabled={isSubmittingFeedback || !feedbackMessage.trim()}
            >
              {isSubmittingFeedback ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Send className="h-4 w-4 mr-2" />
              )}
              Enviar Feedback
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};
