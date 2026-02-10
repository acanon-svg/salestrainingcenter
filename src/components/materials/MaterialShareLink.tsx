import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Copy, Check, Link2, ExternalLink } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

interface MaterialShareLinkProps {
  materialId: string;
  materialTitle?: string;
  /** Render as inline icon button (for list items) */
  compact?: boolean;
}

export const MaterialShareLink: React.FC<MaterialShareLinkProps> = ({
  materialId,
  materialTitle,
  compact = false,
}) => {
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);

  const baseUrl = window.location.origin;
  const materialLink = `${baseUrl}/materials/${materialId}`;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(materialLink);
      setCopied(true);
      toast({
        title: "¡Link copiado!",
        description: "El enlace del material ha sido copiado al portapapeles.",
      });
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast({
        title: "Error",
        description: "No se pudo copiar el enlace.",
        variant: "destructive",
      });
    }
  };

  const handleOpenInNewTab = () => {
    window.open(materialLink, "_blank");
  };

  if (compact) {
    return (
      <Popover>
        <PopoverTrigger asChild>
          <Button variant="ghost" size="icon" title="Copiar enlace de recurso">
            <Link2 className="h-4 w-4" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-80" align="end">
          <div className="space-y-2">
            <p className="text-sm font-medium">Link del material</p>
            <p className="text-xs text-muted-foreground">
              Usa este enlace como recurso en cursos u otros materiales.
            </p>
            <div className="flex gap-2">
              <Input
                value={materialLink}
                readOnly
                className="text-xs font-mono bg-muted"
              />
              <Button
                variant="outline"
                size="icon"
                onClick={handleCopy}
                className="shrink-0"
              >
                {copied ? (
                  <Check className="w-4 h-4 text-primary" />
                ) : (
                  <Copy className="w-4 h-4" />
                )}
              </Button>
            </div>
          </div>
        </PopoverContent>
      </Popover>
    );
  }

  return (
    <div className="border rounded-lg p-4 bg-muted/30 space-y-2">
      <div className="flex items-center gap-2">
        <Link2 className="w-4 h-4 text-primary" />
        <span className="text-sm font-medium">Link de Recurso</span>
      </div>
      <p className="text-xs text-muted-foreground">
        Comparte este enlace para acceder directamente al material
        {materialTitle ? ` "${materialTitle}"` : ""}.
        Úsalo como recurso en cursos.
      </p>
      <div className="flex gap-2">
        <Input
          value={materialLink}
          readOnly
          className="text-sm font-mono bg-muted"
        />
        <Button
          variant="outline"
          size="icon"
          onClick={handleCopy}
          className="shrink-0"
        >
          {copied ? (
            <Check className="w-4 h-4 text-primary" />
          ) : (
            <Copy className="w-4 h-4" />
          )}
        </Button>
        <Button
          variant="outline"
          size="icon"
          onClick={handleOpenInNewTab}
          className="shrink-0"
        >
          <ExternalLink className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
};
