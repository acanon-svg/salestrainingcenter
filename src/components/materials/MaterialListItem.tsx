import React from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ThumbsUp, ThumbsDown, Video, FileText, Link as LinkIcon, Eye, Edit, Trash2, Calendar, Users, TableIcon } from "lucide-react";
import { TrainingMaterial, useMaterialFeedback } from "@/hooks/useTrainingMaterials";
import { MaterialShareLink } from "./MaterialShareLink";
import { MaterialCategory } from "@/hooks/useMaterialCategories";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { es } from "date-fns/locale";

interface MaterialTag {
  id: string;
  name: string;
  color: string;
  priority: number;
}

interface MaterialListItemProps {
  material: TrainingMaterial;
  isCreator?: boolean;
  category?: MaterialCategory;
  tags?: MaterialTag[];
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

export const MaterialListItem: React.FC<MaterialListItemProps> = ({
  material,
  isCreator = false,
  category,
  tags = [],
  onView,
  onEdit,
  onDelete,
}) => {
  const feedbackMutation = useMaterialFeedback();
  const Icon = typeIcons[material.type] || FileText;

  const handleFeedback = (isUseful: boolean) => {
    feedbackMutation.mutate({ materialId: material.id, isUseful });
  };

  // Get category color or default
  const categoryColor = category?.color || "#6366f1";
  
  // Get material tags
  const materialTags = tags.filter(tag => material.tag_ids?.includes(tag.id));

  return (
    <div 
      className="flex items-start gap-4 p-4 rounded-lg border bg-card hover:shadow-md transition-all"
      style={{ borderLeftWidth: "4px", borderLeftColor: categoryColor }}
    >
      {/* Type Icon */}
      <div 
        className="p-2 rounded-lg shrink-0"
        style={{ backgroundColor: `${categoryColor}15` }}
      >
        <Icon className="h-5 w-5" style={{ color: categoryColor }} />
      </div>

      {/* Main Content */}
      <div className="flex-1 min-w-0 space-y-2">
        {/* Title and Status */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-foreground line-clamp-1">{material.title}</h3>
            {material.description && (
              <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                {material.description}
              </p>
            )}
          </div>
          
          {!material.is_published && (
            <Badge variant="secondary" className="shrink-0">Borrador</Badge>
          )}
        </div>

        {/* Metadata Row */}
        <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
          {/* Type Badge */}
          <Badge 
            variant="outline" 
            className="text-xs"
            style={{ 
              borderColor: categoryColor, 
              color: categoryColor,
              backgroundColor: `${categoryColor}10`
            }}
          >
            {typeLabels[material.type] || material.type}
          </Badge>

          {/* Category */}
          {category && (
            <Badge 
              className="text-xs text-white"
              style={{ backgroundColor: categoryColor }}
            >
              {category.name}
            </Badge>
          )}

          {/* Tags */}
          {materialTags.map((tag) => (
            <Badge 
              key={tag.id}
              className="text-xs text-white"
              style={{ backgroundColor: tag.color }}
            >
              {tag.name}
            </Badge>
          ))}

          {/* Date */}
          <span className="flex items-center gap-1">
            <Calendar className="h-3 w-3" />
            {format(new Date(material.created_at), "d MMM yyyy", { locale: es })}
          </span>

          {/* Target Teams */}
          {material.target_teams && material.target_teams.length > 0 && (
            <span className="flex items-center gap-1">
              <Users className="h-3 w-3" />
              {material.target_teams.length} {material.target_teams.length === 1 ? "equipo" : "equipos"}
            </span>
          )}

          {/* Keywords */}
          {material.keywords && material.keywords.length > 0 && (
            <span className="text-muted-foreground/70">
              Palabras clave: {material.keywords.slice(0, 3).join(", ")}
              {material.keywords.length > 3 && ` +${material.keywords.length - 3}`}
            </span>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2 shrink-0">
        <Button variant="outline" size="sm" onClick={() => onView?.(material)}>
          <Eye className="h-4 w-4 mr-1" />
          Ver
        </Button>

        {isCreator ? (
          <>
            {material.is_published && (
              <MaterialShareLink
                materialId={material.id}
                materialTitle={material.title}
                compact
              />
            )}
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
            <div className="flex items-center gap-2 text-sm text-muted-foreground border-l pl-2 ml-2">
              <span className="flex items-center gap-1">
                <ThumbsUp className="h-3 w-3 text-primary" />
                {material.useful_count || 0}
              </span>
              <span className="flex items-center gap-1">
                <ThumbsDown className="h-3 w-3 text-destructive" />
                {material.not_useful_count || 0}
              </span>
            </div>
          </>
        ) : (
          <div className="flex items-center gap-1">
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
      </div>
    </div>
  );
};
