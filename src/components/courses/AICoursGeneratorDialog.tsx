import React, { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Sparkles, Loader2, CheckCircle2, BookOpen, HelpCircle, FileText } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";

export const AICourseGeneratorDialog: React.FC = () => {
  const [open, setOpen] = useState(false);
  const [prompt, setPrompt] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [result, setResult] = useState<any>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      toast({ title: "Error", description: "Escribe un prompt para generar el curso.", variant: "destructive" });
      return;
    }

    setIsGenerating(true);
    setResult(null);

    try {
      const { data, error } = await supabase.functions.invoke("create-ai-course", {
        body: { prompt: prompt.trim() },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      setResult(data);
      queryClient.invalidateQueries({ queryKey: ["creator-courses"] });
      queryClient.invalidateQueries({ queryKey: ["courses"] });

      toast({
        title: "¡Curso generado exitosamente!",
        description: `"${data.title}" fue creado como borrador.`,
      });
    } catch (err: any) {
      console.error("AI course generation error:", err);
      toast({
        title: "Error al generar curso",
        description: err.message || "Intenta de nuevo más tarde.",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleClose = () => {
    setOpen(false);
    setPrompt("");
    setResult(null);
  };

  const handleViewCourse = () => {
    if (result?.course_id) {
      navigate(`/courses/${result.course_id}/edit`);
      handleClose();
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) handleClose(); else setOpen(true); }}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2 border-primary/30 text-primary hover:bg-primary/5">
          <Sparkles className="w-4 h-4" />
          Crear con IA
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary" />
            Crear Curso con IA
          </DialogTitle>
          <DialogDescription>
            Describe el curso que necesitas y la IA generará título, contenido, materiales, imagen de portada y quiz automáticamente. Se guardará como borrador para que agregues vigencia y equipo.
          </DialogDescription>
        </DialogHeader>

        {!result ? (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="ai-prompt">Prompt del curso</Label>
              <Textarea
                id="ai-prompt"
                placeholder="Ej: Curso sobre técnicas de cierre de venta para asesores comerciales de campo, nivel intermedio, enfocado en manejo de objeciones y negociación con comercios..."
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                rows={5}
                disabled={isGenerating}
                className="resize-none"
              />
            </div>

            <div className="bg-muted/50 rounded-lg p-3 space-y-1.5">
              <p className="text-xs font-medium text-muted-foreground">💡 Tips para un mejor resultado:</p>
              <ul className="text-xs text-muted-foreground space-y-0.5">
                <li>• Especifica el tema principal y subtemas</li>
                <li>• Indica el nivel de dificultad deseado</li>
                <li>• Menciona la audiencia objetivo</li>
                <li>• Describe habilidades o conocimientos esperados</li>
              </ul>
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={handleClose} disabled={isGenerating}>
                Cancelar
              </Button>
              <Button onClick={handleGenerate} disabled={isGenerating || !prompt.trim()} className="gap-2">
                {isGenerating ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Generando curso...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    Generar Curso
                  </>
                )}
              </Button>
            </div>

            {isGenerating && (
              <div className="text-center space-y-2 py-4">
                <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Esto puede tomar 30-60 segundos...
                </div>
                <p className="text-xs text-muted-foreground">
                  La IA está creando contenido, materiales, quiz e imagen de portada
                </p>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            <div className="bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800 rounded-lg p-4 space-y-3">
              <div className="flex items-center gap-2 text-green-700 dark:text-green-400">
                <CheckCircle2 className="w-5 h-5" />
                <span className="font-semibold">¡Curso creado exitosamente!</span>
              </div>
              <p className="text-sm font-medium text-foreground">{result.title}</p>
              <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  <FileText className="w-3 h-3" />
                  {result.materials_count} materiales
                </span>
                <span className="flex items-center gap-1">
                  <HelpCircle className="w-3 h-3" />
                  {result.questions_count} preguntas
                </span>
                <span className="flex items-center gap-1">
                  <BookOpen className="w-3 h-3" />
                  {result.has_cover_image ? "Con imagen" : "Sin imagen"}
                </span>
              </div>
            </div>

            <p className="text-sm text-muted-foreground">
              El curso fue guardado como <strong>borrador</strong>. Edítalo para agregar vigencia, equipo objetivo y revisar el contenido.
            </p>

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={handleClose}>
                Cerrar
              </Button>
              <Button onClick={handleViewCourse} className="gap-2">
                <BookOpen className="w-4 h-4" />
                Editar Curso
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
