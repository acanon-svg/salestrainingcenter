import React, { useState, useMemo } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ThumbsUp, ThumbsDown, ExternalLink, Video, FileText, Link as LinkIcon, TableIcon, HelpCircle } from "lucide-react";
import { TrainingMaterial, useMaterialFeedback } from "@/hooks/useTrainingMaterials";
import { useMaterialTags } from "@/hooks/useMaterialTags";
import { GoogleDocEmbed, isGoogleUrl } from "./GoogleDocEmbed";
import { KeywordsGlossary } from "@/components/glossary/KeywordsGlossary";
import { FaqDisplay } from "./FaqDisplay";
import { parseRichText } from "./RichTextEditor";
import { cn } from "@/lib/utils";
import { MaterialContentSearch } from "./MaterialContentSearch";
import { TableViewer } from "./TableViewer";
import DOMPurify from "dompurify";

interface MaterialViewerProps {
  material: TrainingMaterial | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  showFeedback?: boolean;
}

const typeLabels: Record<string, string> = {
  video: "Video",
  documento: "Documento",
  link: "Enlace",
  tabla: "Tabla",
  faq: "FAQ",
};

export const MaterialViewer: React.FC<MaterialViewerProps> = ({
  material,
  open,
  onOpenChange,
  showFeedback = true,
}) => {
  const feedbackMutation = useMaterialFeedback();
  const { data: allTags } = useMaterialTags();
  const [contentSearch, setContentSearch] = useState("");

  if (!material) return null;

  const handleFeedback = (isUseful: boolean) => {
    feedbackMutation.mutate({ materialId: material.id, isUseful });
  };

  const materialTags = allTags?.filter((t) => material.tag_ids?.includes(t.id)) || [];

  // Highlight matching text in document content
  const highlightContent = (html: string, query: string) => {
    if (!query.trim()) return html;
    const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
    return html.replace(regex, '<mark class="bg-accent text-accent-foreground px-0.5 rounded">$1</mark>');
  };

  const renderContent = () => {
    switch (material.type) {
      case "faq":
        // For FAQ type, we just show the FaqDisplay component (rendered below)
        return (
          <div className="flex flex-col items-center justify-center py-8 gap-3 bg-muted/30 rounded-lg">
            <HelpCircle className="h-12 w-12 text-primary" />
            <p className="text-sm text-muted-foreground text-center">
              Consulta las preguntas frecuentes a continuación
            </p>
          </div>
        );

      case "tabla":
        return <TableViewer data={material.content_text} />;

      case "video":
        if (!material.content_url) {
          return (
            <div className="flex items-center justify-center h-64 bg-muted rounded-lg">
              <p className="text-muted-foreground">No hay video disponible</p>
            </div>
          );
        }
        
        // Check if it's a YouTube URL
        const youtubeMatch = material.content_url.match(
          /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/
        );
        
        if (youtubeMatch) {
          return (
            <div className="aspect-video rounded-lg overflow-hidden">
              <iframe
                src={`https://www.youtube.com/embed/${youtubeMatch[1]}`}
                title={material.title}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                className="w-full h-full"
              />
            </div>
          );
        }
        
        // Regular video file
        return (
          <div className="aspect-video rounded-lg overflow-hidden bg-black">
            <video
              src={material.content_url}
              controls
              className="w-full h-full"
            >
              Tu navegador no soporta la reproducción de videos.
            </video>
          </div>
        );

      case "documento":
        if (material.content_text) {
          const parsedContent = parseRichText(material.content_text);
          const highlightedContent = highlightContent(parsedContent, contentSearch);
          const searchMatches = contentSearch ? (parsedContent.toLowerCase().match(new RegExp(contentSearch.toLowerCase(), 'g')) || []).length : 0;
          
          return (
            <div className="space-y-3">
              <MaterialContentSearch
                value={contentSearch}
                onChange={setContentSearch}
                placeholder="Buscar en el documento..."
                resultsCount={contentSearch ? searchMatches : undefined}
              />
              <div className="prose prose-sm max-w-none dark:prose-invert">
                <div 
                  className="whitespace-pre-wrap bg-muted/50 p-4 rounded-lg max-h-96 overflow-y-auto"
                  dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(highlightedContent) }}
                />
              </div>
            </div>
          );
        }
        
        if (material.content_url) {
          // Check if it's a Google URL
          if (isGoogleUrl(material.content_url)) {
            return <GoogleDocEmbed url={material.content_url} />;
          }
          
          // Check if it's a PDF
          if (material.content_url.toLowerCase().endsWith('.pdf')) {
            return (
              <div className="aspect-[4/3] rounded-lg overflow-hidden">
                <iframe
                  src={material.content_url}
                  title={material.title}
                  className="w-full h-full"
                />
              </div>
            );
          }
          
          return (
            <div className="flex flex-col items-center justify-center py-8 gap-4">
              <FileText className="h-16 w-16 text-muted-foreground" />
              <Button asChild>
                <a href={material.content_url} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Abrir documento
                </a>
              </Button>
            </div>
          );
        }
        
        return (
          <div className="flex items-center justify-center h-32 bg-muted rounded-lg">
            <p className="text-muted-foreground">No hay documento disponible</p>
          </div>
        );

      case "link":
        if (!material.content_url) {
          return (
            <div className="flex items-center justify-center h-32 bg-muted rounded-lg">
              <p className="text-muted-foreground">No hay enlace disponible</p>
            </div>
          );
        }
        
        // Check if it's a Google URL - show embedded preview
        if (isGoogleUrl(material.content_url)) {
          return <GoogleDocEmbed url={material.content_url} />;
        }
        
        return (
          <div className="flex flex-col items-center justify-center py-8 gap-4">
            <LinkIcon className="h-16 w-16 text-muted-foreground" />
            <p className="text-sm text-muted-foreground max-w-md text-center">
              {material.description ? parseRichText(material.description) : "Haz clic en el botón para abrir el enlace externo"}
            </p>
            <Button asChild>
              <a href={material.content_url} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="h-4 w-4 mr-2" />
                Abrir enlace
              </a>
            </Button>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex flex-wrap items-center gap-2 mb-2">
            <Badge variant="outline">{typeLabels[material.type]}</Badge>
            {materialTags.map((tag) => (
              <Badge
                key={tag.id}
                style={{ backgroundColor: tag.color }}
                className="text-white"
              >
                {tag.name}
              </Badge>
            ))}
            {material.target_teams && material.target_teams.length > 0 && (
              <>
                {material.target_teams.map((team) => (
                  <Badge key={team} variant="secondary" className="text-xs">
                    {team}
                  </Badge>
                ))}
              </>
            )}
          </div>
          <DialogTitle className="text-xl">{material.title}</DialogTitle>
          {material.description && (
            <DialogDescription 
              dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(parseRichText(material.description)) }}
            />
          )}
          {material.keywords && material.keywords.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              {material.keywords.map((keyword) => (
                <Badge key={keyword} variant="outline" className="text-xs">
                  {keyword}
                </Badge>
              ))}
            </div>
          )}
        </DialogHeader>

        <div className="mt-4">
          {renderContent()}
        </div>

        {/* Glossary Section */}
        <KeywordsGlossary keywords={material.keywords} className="mt-4" />

        {/* FAQ Section */}
        <FaqDisplay materialId={material.id} className="mt-4" />

        {showFeedback && (
          <div className="flex items-center justify-center gap-4 mt-6 pt-6 border-t">
            <span className="text-sm text-muted-foreground">¿Este contenido te fue útil?</span>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                className={cn(
                  material.user_feedback === true && "bg-primary/10 border-primary text-primary"
                )}
                onClick={() => handleFeedback(true)}
                disabled={feedbackMutation.isPending}
              >
                <ThumbsUp className="h-4 w-4 mr-2" />
                Sí
              </Button>
              <Button
                variant="outline"
                size="sm"
                className={cn(
                  material.user_feedback === false && "bg-destructive/10 border-destructive text-destructive"
                )}
                onClick={() => handleFeedback(false)}
                disabled={feedbackMutation.isPending}
              >
                <ThumbsDown className="h-4 w-4 mr-2" />
                No
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
