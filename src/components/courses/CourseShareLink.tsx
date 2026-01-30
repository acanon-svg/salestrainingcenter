import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Copy, Check, Link2, ExternalLink } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface CourseShareLinkProps {
  courseId: string;
  courseTitle?: string;
}

export const CourseShareLink: React.FC<CourseShareLinkProps> = ({
  courseId,
  courseTitle,
}) => {
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);

  // Generate the universal course link
  const baseUrl = window.location.origin;
  const courseLink = `${baseUrl}/courses/${courseId}`;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(courseLink);
      setCopied(true);
      toast({
        title: "¡Link copiado!",
        description: "El enlace del curso ha sido copiado al portapapeles.",
      });
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo copiar el enlace.",
        variant: "destructive",
      });
    }
  };

  const handleOpenInNewTab = () => {
    window.open(courseLink, "_blank");
  };

  return (
    <Card className="border-border/50">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Link2 className="w-4 h-4 text-primary" />
          Link Universal del Curso
        </CardTitle>
        <CardDescription className="text-xs">
          Comparte este enlace para acceder directamente al curso
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex gap-2">
          <Input
            value={courseLink}
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
              <Check className="w-4 h-4 text-success" />
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
        <p className="text-xs text-muted-foreground">
          Este enlace redirige automáticamente a los usuarios al curso "{courseTitle || "sin título"}".
        </p>
      </CardContent>
    </Card>
  );
};

export default CourseShareLink;
