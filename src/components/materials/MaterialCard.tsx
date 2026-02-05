import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ThumbsUp, ThumbsDown, Video, FileText, Link as LinkIcon, Eye, Edit, Trash2, TableIcon } from "lucide-react";
import { TrainingMaterial, useMaterialFeedback } from "@/hooks/useTrainingMaterials";
import { cn } from "@/lib/utils";

interface MaterialCardProps {
  material: TrainingMaterial;
  isCreator?: boolean;
  onView?: (material: TrainingMaterial) => void;
  onEdit?: (material: TrainingMaterial) => void;
  onDelete?: (material: TrainingMaterial) => void;
}

const typeIcons: Record<string, React.ElementType> = {
  video: Video,
  documento: FileText,
  link: LinkIcon,
  tabla: TableIcon,
};

const typeLabels: Record<string, string> = {
  video: "Video",
  documento: "Documento",
  link: "Enlace",
  tabla: "Tabla",
};

const typeColors: Record<string, string> = {
  video: "bg-destructive/10 text-destructive border-destructive/20",
  documento: "bg-primary/10 text-primary border-primary/20",
  link: "bg-secondary/80 text-secondary-foreground border-secondary",
  tabla: "bg-accent text-accent-foreground border-accent",
};

export const MaterialCard: React.FC<MaterialCardProps> = ({
  material,
  isCreator = false,
  onView,
  onEdit,
  onDelete,
}) => {
  const feedbackMutation = useMaterialFeedback();
  const Icon = typeIcons[material.type] || FileText;

  const handleFeedback = (isUseful: boolean) => {
    feedbackMutation.mutate({ materialId: material.id, isUseful });
  };

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className={cn("p-2 rounded-lg", typeColors[material.type] || typeColors.documento)}>
              <Icon className="h-5 w-5" />
            </div>
            <div>
              <CardTitle className="text-lg line-clamp-1">{material.title}</CardTitle>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant="outline" className={typeColors[material.type] || typeColors.documento}>
                  {typeLabels[material.type] || material.type}
                </Badge>
                {!material.is_published && (
                  <Badge variant="secondary">Borrador</Badge>
                )}
              </div>
            </div>
          </div>
          {isCreator && (
            <div className="flex items-center gap-1">
              <Button variant="ghost" size="icon" onClick={() => onEdit?.(material)}>
                <Edit className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="text-destructive hover:text-destructive"
                onClick={() => onDelete?.(material)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {material.description && (
          <CardDescription className="line-clamp-2 mb-4">
            {material.description}
          </CardDescription>
        )}

        {material.target_teams && material.target_teams.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-4">
            {material.target_teams.map((team) => (
              <Badge key={team} variant="secondary" className="text-xs">
                {team}
              </Badge>
            ))}
          </div>
        )}

        <div className="flex items-center justify-between">
          <Button variant="outline" size="sm" onClick={() => onView?.(material)}>
            <Eye className="h-4 w-4 mr-2" />
            Ver contenido
          </Button>

          {!isCreator && (
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground mr-2">¿Te fue útil?</span>
              <Button
                variant="ghost"
                size="icon"
                className={cn(
                  "h-8 w-8",
                  material.user_feedback === true && "text-primary bg-primary/10"
                )}
                onClick={() => handleFeedback(true)}
                disabled={feedbackMutation.isPending}
              >
                <ThumbsUp className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className={cn(
                  "h-8 w-8",
                  material.user_feedback === false && "text-destructive bg-destructive/10"
                )}
                onClick={() => handleFeedback(false)}
                disabled={feedbackMutation.isPending}
              >
                <ThumbsDown className="h-4 w-4" />
              </Button>
            </div>
          )}

          {isCreator && (
            <div className="flex items-center gap-3 text-sm text-muted-foreground">
              <span className="flex items-center gap-1">
                <ThumbsUp className="h-3 w-3 text-primary" />
                {material.useful_count || 0}
              </span>
              <span className="flex items-center gap-1">
                <ThumbsDown className="h-3 w-3 text-destructive" />
                {material.not_useful_count || 0}
              </span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
