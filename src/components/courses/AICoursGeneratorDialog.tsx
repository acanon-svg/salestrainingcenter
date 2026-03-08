import React, { useState, useRef } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Sparkles, Loader2, CheckCircle2, BookOpen, HelpCircle, FileText, Plus, Trash2, ArrowRight, ArrowLeft, Link, Globe, Upload, File } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";

interface MaterialInput {
  id: string;
  title: string;
  type: "text" | "url" | "file";
  content: string;
  fileName?: string;
}

export const AICourseGeneratorDialog: React.FC = () => {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [prompt, setPrompt] = useState("");
  const [materials, setMaterials] = useState<MaterialInput[]>([
    { id: crypto.randomUUID(), title: "", type: "text", content: "" },
  ]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [result, setResult] = useState<any>(null);
  const fileInputRefs = useRef<Record<string, HTMLInputElement | null>>({});
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const addMaterial = () => {
    setMaterials((prev) => [
      ...prev,
      { id: crypto.randomUUID(), title: "", type: "text", content: "" },
    ]);
  };

  const removeMaterial = (id: string) => {
    if (materials.length <= 1) return;
    setMaterials((prev) => prev.filter((m) => m.id !== id));
  };

  const updateMaterial = (id: string, field: keyof MaterialInput, value: string) => {
    setMaterials((prev) =>
      prev.map((m) => (m.id === id ? { ...m, [field]: value } : m))
    );
  };

  const handleFileUpload = async (materialId: string, file: globalThis.File) => {
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      toast({ title: "Error", description: "El archivo debe ser menor a 10MB.", variant: "destructive" });
      return;
    }

    const allowedTypes = [
      "text/plain", "text/csv", "text/markdown",
      "application/pdf",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "application/vnd.openxmlformats-officedocument.presentationml.presentation",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "application/msword",
    ];
    const isText = file.type.startsWith("text/") || file.name.endsWith(".md") || file.name.endsWith(".txt") || file.name.endsWith(".csv") || file.name.endsWith(".html") || file.name.endsWith(".htm");

    if (isText) {
      const text = await file.text();
      setMaterials((prev) =>
        prev.map((m) => m.id === materialId ? { ...m, content: text, fileName: file.name, title: m.title || file.name } : m)
      );
      toast({ title: "Archivo cargado", description: `"${file.name}" fue leído correctamente.` });
    } else if (allowedTypes.includes(file.type)) {
      // Read as base64 for non-text files and send to edge function for parsing
      const reader = new FileReader();
      reader.onload = () => {
        const base64 = (reader.result as string).split(",")[1];
        setMaterials((prev) =>
          prev.map((m) => m.id === materialId ? { 
            ...m, 
            content: `[ARCHIVO: ${file.name}]\n\nContenido del archivo en base64 (el sistema lo procesará automáticamente):\n${base64.substring(0, 50000)}`,
            fileName: file.name,
            title: m.title || file.name 
          } : m)
        );
        toast({ title: "Archivo cargado", description: `"${file.name}" fue adjuntado correctamente.` });
      };
      reader.readAsDataURL(file);
    } else {
      toast({ title: "Formato no soportado", description: "Usa archivos TXT, CSV, MD, HTML, PDF, DOCX, PPTX o XLSX.", variant: "destructive" });
    }
  };

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      toast({ title: "Error", description: "Escribe un prompt para generar el curso.", variant: "destructive" });
      return;
    }

    // Validate materials have content
    const validMaterials = materials.filter((m) => m.content.trim());
    if (validMaterials.length === 0) {
      toast({ title: "Error", description: "Agrega al menos un material o recurso de contenido.", variant: "destructive" });
      return;
    }

    setIsGenerating(true);
    setResult(null);

    try {
      const { data, error } = await supabase.functions.invoke("create-ai-course", {
        body: {
          prompt: prompt.trim(),
          provided_materials: validMaterials.map((m) => ({
            title: m.title || "Material sin título",
            type: m.type,
            content: m.content,
          })),
        },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      setResult(data);
      setStep(3);
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
    setMaterials([{ id: crypto.randomUUID(), title: "", type: "text", content: "", fileName: undefined }]);
    setStep(1);
    setResult(null);
  };

  const handleViewCourse = () => {
    if (result?.course_id) {
      navigate(`/courses/${result.course_id}/edit`);
      handleClose();
    }
  };

  const canProceedToStep2 = prompt.trim().length > 0;
  const canGenerate = materials.some((m) => m.content.trim());

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) handleClose(); else setOpen(true); }}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2 border-primary/30 text-primary hover:bg-primary/5">
          <Sparkles className="w-4 h-4" />
          Crear con IA
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[700px] max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary" />
            Crear Curso con IA
          </DialogTitle>
          <DialogDescription>
            {step === 1 && "Paso 1: Describe el curso que necesitas."}
            {step === 2 && "Paso 2: Agrega los materiales y recursos que la IA usará para crear el contenido."}
            {step === 3 && "¡Curso generado exitosamente!"}
          </DialogDescription>
        </DialogHeader>

        {/* Step indicators */}
        <div className="flex items-center gap-2 mb-2">
          {[1, 2, 3].map((s) => (
            <div key={s} className="flex items-center gap-1">
              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${
                step >= s ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
              }`}>
                {s === 3 && step === 3 ? "✓" : s}
              </div>
              {s < 3 && <div className={`w-8 h-0.5 ${step > s ? "bg-primary" : "bg-muted"}`} />}
            </div>
          ))}
          <span className="text-xs text-muted-foreground ml-2">
            {step === 1 ? "Descripción" : step === 2 ? "Materiales" : "Resultado"}
          </span>
        </div>

        {/* Step 1: Prompt */}
        {step === 1 && (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="ai-prompt">¿Qué curso necesitas?</Label>
              <Textarea
                id="ai-prompt"
                placeholder="Ej: Curso sobre técnicas de cierre de venta para asesores comerciales de campo, nivel intermedio, enfocado en manejo de objeciones y negociación con comercios..."
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                rows={5}
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
              <Button variant="outline" onClick={handleClose}>Cancelar</Button>
              <Button onClick={() => setStep(2)} disabled={!canProceedToStep2} className="gap-2">
                Siguiente: Agregar Materiales
                <ArrowRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}

        {/* Step 2: Materials */}
        {step === 2 && (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Agrega el contenido que la IA utilizará como base para crear los módulos, materiales y quiz del curso. 
              Puedes pegar texto directamente o agregar URLs de documentos/recursos.
            </p>

            <div className="space-y-3 max-h-[40vh] overflow-y-auto pr-1">
              {materials.map((material, index) => (
                <div key={material.id} className="border rounded-lg p-3 space-y-2 bg-card">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Material {index + 1}</span>
                    <div className="flex items-center gap-1">
                      <Button
                        variant={material.type === "text" ? "default" : "outline"}
                        size="sm"
                        className="h-7 text-xs gap-1"
                        onClick={() => updateMaterial(material.id, "type", "text")}
                      >
                        <FileText className="w-3 h-3" /> Texto
                      </Button>
                      <Button
                        variant={material.type === "url" ? "default" : "outline"}
                        size="sm"
                        className="h-7 text-xs gap-1"
                        onClick={() => updateMaterial(material.id, "type", "url")}
                      >
                        <Globe className="w-3 h-3" /> URL
                      </Button>
                      <Button
                        variant={material.type === "file" ? "default" : "outline"}
                        size="sm"
                        className="h-7 text-xs gap-1"
                        onClick={() => updateMaterial(material.id, "type", "file")}
                      >
                        <Upload className="w-3 h-3" /> Archivo
                      </Button>
                      {materials.length > 1 && (
                        <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-destructive" onClick={() => removeMaterial(material.id)}>
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      )}
                    </div>
                  </div>

                  <Input
                    placeholder="Título del material (opcional)"
                    value={material.title}
                    onChange={(e) => updateMaterial(material.id, "title", e.target.value)}
                    className="h-8 text-sm"
                  />

                  {material.type === "text" ? (
                    <Textarea
                      placeholder="Pega aquí el contenido del material: texto de documentos, guías, manuales, información del producto, procesos, etc."
                      value={material.content}
                      onChange={(e) => updateMaterial(material.id, "content", e.target.value)}
                      rows={4}
                      className="resize-none text-sm"
                    />
                  ) : material.type === "url" ? (
                    <Input
                      placeholder="URL del recurso (Google Docs, página web, etc.)"
                      value={material.content}
                      onChange={(e) => updateMaterial(material.id, "content", e.target.value)}
                      className="h-8 text-sm"
                    />
                  ) : (
                    <div className="space-y-2">
                      <input
                        ref={(el) => { fileInputRefs.current[material.id] = el; }}
                        type="file"
                        accept=".txt,.csv,.md,.pdf,.docx,.pptx,.xlsx,.doc"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) handleFileUpload(material.id, file);
                          e.target.value = "";
                        }}
                      />
                      {material.fileName ? (
                        <div className="flex items-center gap-2 p-2 rounded-md bg-muted/50 border border-border">
                          <File className="w-4 h-4 text-primary shrink-0" />
                          <span className="text-sm truncate flex-1">{material.fileName}</span>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 text-xs"
                            onClick={() => fileInputRefs.current[material.id]?.click()}
                          >
                            Cambiar
                          </Button>
                        </div>
                      ) : (
                        <Button
                          variant="outline"
                          className="w-full border-dashed border-2 h-16 flex flex-col gap-1"
                          onClick={() => fileInputRefs.current[material.id]?.click()}
                        >
                          <Upload className="w-4 h-4" />
                          <span className="text-xs">Seleccionar archivo (TXT, CSV, MD, PDF, DOCX, PPTX, XLSX)</span>
                        </Button>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>

            <Button variant="outline" size="sm" onClick={addMaterial} className="gap-1 w-full">
              <Plus className="w-4 h-4" /> Agregar otro material
            </Button>

            <div className="bg-muted/50 rounded-lg p-3">
              <p className="text-xs text-muted-foreground">
                📌 La IA usará estos materiales para estructurar los módulos del curso, generar contenido educativo enriquecido y crear preguntas de evaluación relevantes. Entre más información proporciones, mejor será el resultado.
              </p>
            </div>

            <div className="flex justify-between gap-2">
              <Button variant="outline" onClick={() => setStep(1)} className="gap-2" disabled={isGenerating}>
                <ArrowLeft className="w-4 h-4" /> Atrás
              </Button>
              <Button onClick={handleGenerate} disabled={isGenerating || !canGenerate} className="gap-2">
                {isGenerating ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Generando curso...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    Generar Curso con IA
                  </>
                )}
              </Button>
            </div>

            {isGenerating && (
              <div className="text-center space-y-2 py-2">
                <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Esto puede tomar 30-60 segundos...
                </div>
                <p className="text-xs text-muted-foreground">
                  La IA está analizando tus materiales y creando contenido, quiz e imagen de portada
                </p>
              </div>
            )}
          </div>
        )}

        {/* Step 3: Result */}
        {step === 3 && result && (
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
              El curso fue guardado como <strong>borrador</strong>. Edítalo para agregar vigencia, equipo objetivo y revisar el contenido generado.
            </p>

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={handleClose}>Cerrar</Button>
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
