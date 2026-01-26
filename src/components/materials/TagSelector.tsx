import React, { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Check, Plus, Settings, Tag } from "lucide-react";
import { useMaterialTags, MaterialTag } from "@/hooks/useMaterialTags";
import { TagManager } from "./TagManager";
import { cn } from "@/lib/utils";

interface TagSelectorProps {
  selectedTags: string[];
  onChange: (tagIds: string[]) => void;
}

export const TagSelector: React.FC<TagSelectorProps> = ({
  selectedTags,
  onChange,
}) => {
  const { data: tags } = useMaterialTags();
  const [isTagManagerOpen, setIsTagManagerOpen] = useState(false);
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);

  const toggleTag = (tagId: string) => {
    if (selectedTags.includes(tagId)) {
      onChange(selectedTags.filter((id) => id !== tagId));
    } else {
      onChange([...selectedTags, tagId]);
    }
  };

  const selectedTagObjects = tags?.filter((t) => selectedTags.includes(t.id)) || [];

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <Label>Etiquetas</Label>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => setIsTagManagerOpen(true)}
        >
          <Settings className="h-4 w-4 mr-1" />
          Gestionar
        </Button>
      </div>

      <Popover open={isPopoverOpen} onOpenChange={setIsPopoverOpen}>
        <PopoverTrigger asChild>
          <Button
            type="button"
            variant="outline"
            className="w-full justify-start h-auto min-h-10 py-2"
          >
            {selectedTagObjects.length > 0 ? (
              <div className="flex flex-wrap gap-1">
                {selectedTagObjects.map((tag) => (
                  <Badge
                    key={tag.id}
                    style={{ backgroundColor: tag.color }}
                    className="text-white"
                  >
                    {tag.name}
                  </Badge>
                ))}
              </div>
            ) : (
              <span className="text-muted-foreground flex items-center gap-2">
                <Tag className="h-4 w-4" />
                Seleccionar etiquetas...
              </span>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-64 p-2" align="start">
          {tags && tags.length > 0 ? (
            <div className="space-y-1">
              {tags.map((tag) => (
                <button
                  key={tag.id}
                  type="button"
                  className={cn(
                    "w-full flex items-center justify-between p-2 rounded-md hover:bg-accent transition-colors",
                    selectedTags.includes(tag.id) && "bg-accent"
                  )}
                  onClick={() => toggleTag(tag.id)}
                >
                  <Badge
                    style={{ backgroundColor: tag.color }}
                    className="text-white"
                  >
                    {tag.name}
                  </Badge>
                  {selectedTags.includes(tag.id) && (
                    <Check className="h-4 w-4 text-primary" />
                  )}
                </button>
              ))}
            </div>
          ) : (
            <div className="text-center py-4">
              <p className="text-sm text-muted-foreground mb-2">
                No hay etiquetas disponibles
              </p>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  setIsPopoverOpen(false);
                  setIsTagManagerOpen(true);
                }}
              >
                <Plus className="h-4 w-4 mr-1" />
                Crear etiqueta
              </Button>
            </div>
          )}
        </PopoverContent>
      </Popover>

      <TagManager open={isTagManagerOpen} onOpenChange={setIsTagManagerOpen} />
    </div>
  );
};
