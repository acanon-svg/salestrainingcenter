import React, { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Sparkles, Loader2, History, BookOpen, ChevronDown, ChevronUp } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";

interface PromptStats {
  courses: number;
  materials: number;
  glossary: number;
  announcements: number;
  teamData: number;
}

interface PromptHistoryItem {
  id: string;
  created_at: string;
  courses_count: number;
  materials_count: number;
  glossary_count: number;
  announcements_count: number;
  team_data_count: number;
}

export const PromptGeneratorSection: React.FC = () => {
  const { toast } = useToast();
  const [isGenerating, setIsGenerating] = useState(false);
  const [lastStats, setLastStats] = useState<PromptStats | null>(null);
  const [lastGenerated, setLastGenerated] = useState<string | null>(null);
  const [autoPrompt, setAutoPrompt] = useState("");
  const [showPrompt, setShowPrompt] = useState(false);
  const [history, setHistory] = useState<PromptHistoryItem[]>([]);
  const [showHistory, setShowHistory] = useState(false);

  useEffect(() => {
    fetchCurrentPrompt();
    fetchHistory();
  }, []);

  const fetchCurrentPrompt = async () => {
    const { data } = await (supabase as any)
      .from("chatbot_config")
      .select("auto_generated_prompt, updated_at")
      .limit(1)
      .maybeSingle();
    if (data?.auto_generated_prompt) {
      setAutoPrompt(data.auto_generated_prompt);
      setLastGenerated(data.updated_at);
    }
  };

  const fetchHistory = async () => {
    const { data } = await (supabase as any)
      .from("chatbot_prompt_history")
      .select("id, created_at, courses_count, materials_count, glossary_count, announcements_count, team_data_count")
      .order("created_at", { ascending: false })
      .limit(10);
    if (data) setHistory(data);
  };

  const handleGenerate = async () => {
    setIsGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke("generate-chatbot-prompt");
      
      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      setLastStats(data.stats);
      setLastGenerated(data.generatedAt);
      
      toast({
        title: "✅ Prompt generado exitosamente",
        description: `Se incluyeron ${data.stats.courses} cursos, ${data.stats.materials} materiales, ${data.stats.glossary} términos del glosario y ${data.stats.announcements} anuncios.`,
      });

      // Refresh data
      await fetchCurrentPrompt();
      await fetchHistory();
    } catch (error: any) {
      console.error("Error generating prompt:", error);
      toast({
        title: "Error",
        description: error.message || "No se pudo generar el prompt",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <Card className="border-primary/20">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-primary" />
          Prompt Auto-Generado con IA
        </CardTitle>
        <CardDescription>
          Genera automáticamente un prompt con toda la información de cursos, materiales, glosario y anuncios de la plataforma. 
          Este prompt se usa como contexto para Andy.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Stats badges */}
        {lastStats && (
          <div className="flex flex-wrap gap-2">
            <Badge variant="secondary" className="gap-1">
              <BookOpen className="h-3 w-3" />
              {lastStats.courses} cursos
            </Badge>
            <Badge variant="secondary" className="gap-1">
              📄 {lastStats.materials} materiales
            </Badge>
            <Badge variant="secondary" className="gap-1">
              📖 {lastStats.glossary} glosario
            </Badge>
            <Badge variant="secondary" className="gap-1">
              📢 {lastStats.announcements} anuncios
            </Badge>
            <Badge variant="secondary" className="gap-1">
              👥 {lastStats.teamData} datos equipo
            </Badge>
          </div>
        )}

        {lastGenerated && (
          <p className="text-xs text-muted-foreground">
            Última generación: {new Date(lastGenerated).toLocaleString("es-CO")}
          </p>
        )}

        {/* Generate Button */}
        <Button
          onClick={handleGenerate}
          disabled={isGenerating}
          className="w-full gap-2"
          variant="default"
        >
          {isGenerating ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Sparkles className="h-4 w-4" />
          )}
          {isGenerating ? "Generando prompt..." : "Generar / Actualizar Prompt"}
        </Button>

        {/* Show/Hide Generated Prompt */}
        {autoPrompt && (
          <div className="space-y-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowPrompt(!showPrompt)}
              className="gap-2 w-full"
            >
              {showPrompt ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              {showPrompt ? "Ocultar prompt generado" : "Ver prompt generado"} ({autoPrompt.length.toLocaleString()} caracteres)
            </Button>
            {showPrompt && (
              <Textarea
                value={autoPrompt}
                readOnly
                rows={15}
                className="font-mono text-xs bg-muted/50"
              />
            )}
          </div>
        )}

        {/* History */}
        {history.length > 0 && (
          <div className="space-y-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowHistory(!showHistory)}
              className="gap-2"
            >
              <History className="h-4 w-4" />
              Historial de generaciones ({history.length})
              {showHistory ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
            </Button>
            {showHistory && (
              <div className="space-y-1 max-h-48 overflow-y-auto">
                {history.map((item) => (
                  <div key={item.id} className="text-xs p-2 rounded bg-muted/30 flex justify-between items-center">
                    <span>{new Date(item.created_at).toLocaleString("es-CO")}</span>
                    <div className="flex gap-2 text-muted-foreground">
                      <span>{item.courses_count} cursos</span>
                      <span>{item.materials_count} mat</span>
                      <span>{item.glossary_count} glos</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
