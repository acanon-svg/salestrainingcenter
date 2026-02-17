import React, { useRef, useState } from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { ImageActivityData } from "../types";
import { ImageIcon, Upload, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface Props {
  data: ImageActivityData;
  onChange: (data: ImageActivityData) => void;
}

export const ImageActivityEditor: React.FC<Props> = ({ data, onChange }) => {
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast({ title: "Error", description: "Selecciona un archivo de imagen válido.", variant: "destructive" });
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast({ title: "Error", description: "La imagen debe ser menor a 5MB.", variant: "destructive" });
      return;
    }

    setIsUploading(true);
    try {
      const fileExt = file.name.split(".").pop();
      const fileName = `activity-${Date.now()}.${fileExt}`;
      const { error: uploadError } = await supabase.storage
        .from("puzzle-images")
        .upload(fileName, file, { cacheControl: "3600", upsert: true });
      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage.from("puzzle-images").getPublicUrl(fileName);
      onChange({ ...data, example_image_url: urlData.publicUrl });
      toast({ title: "Imagen subida", description: "La imagen se cargó correctamente." });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Error al subir la imagen";
      toast({ title: "Error", description: message, variant: "destructive" });
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <Label className="text-sm font-medium text-muted-foreground mb-2 block">
          Instrucción para el estudiante
        </Label>
        <Textarea
          placeholder="Describe la actividad a realizar con base en la imagen de ejemplo..."
          value={data.instruction}
          onChange={e => onChange({ ...data, instruction: e.target.value })}
          rows={3}
        />
      </div>
      <div>
        <Label className="text-sm font-medium text-muted-foreground mb-2 block">
          Imagen de ejemplo
        </Label>
        <div className="flex gap-3 items-start">
          <div className="flex-1">
            <Input
              placeholder="https://ejemplo.com/imagen.png"
              value={data.example_image_url}
              onChange={e => onChange({ ...data, example_image_url: e.target.value })}
            />
          </div>
          <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileSelect} className="hidden" />
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
            className="gap-2 shrink-0"
          >
            {isUploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
            {isUploading ? "Subiendo..." : "Subir imagen"}
          </Button>
        </div>
        <p className="text-xs text-muted-foreground mt-1">
          Sube una imagen o pega la URL. El estudiante podrá descargarla y deberá adjuntar su respuesta.
        </p>
      </div>
      {data.example_image_url ? (
        <div>
          <Label className="text-sm font-medium text-muted-foreground mb-2 block">
            Vista previa
          </Label>
          <div className="rounded-lg border border-border overflow-hidden max-w-md">
            <img
              src={data.example_image_url}
              alt="Imagen de ejemplo"
              className="w-full h-auto object-contain max-h-64"
              onError={e => {
                (e.target as HTMLImageElement).style.display = "none";
              }}
            />
          </div>
        </div>
      ) : (
        <div className="flex items-center gap-2 p-4 rounded-lg bg-muted/30 text-muted-foreground">
          <ImageIcon className="w-5 h-5" />
          <span className="text-sm">Sube o pega una URL para ver la vista previa de la imagen</span>
        </div>
      )}
    </div>
  );
};
