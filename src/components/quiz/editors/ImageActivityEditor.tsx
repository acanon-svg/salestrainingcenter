import React from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { ImageActivityData } from "../types";
import { ImageIcon } from "lucide-react";

interface Props {
  data: ImageActivityData;
  onChange: (data: ImageActivityData) => void;
}

export const ImageActivityEditor: React.FC<Props> = ({ data, onChange }) => {
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
          URL de la imagen de ejemplo
        </Label>
        <Input
          placeholder="https://ejemplo.com/imagen.png"
          value={data.example_image_url}
          onChange={e => onChange({ ...data, example_image_url: e.target.value })}
        />
        <p className="text-xs text-muted-foreground mt-1">
          Esta imagen se mostrará como referencia. El estudiante deberá adjuntar un archivo con su respuesta.
        </p>
      </div>
      {data.example_image_url && (
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
      )}
      {!data.example_image_url && (
        <div className="flex items-center gap-2 p-4 rounded-lg bg-muted/30 text-muted-foreground">
          <ImageIcon className="w-5 h-5" />
          <span className="text-sm">Ingresa una URL para ver la vista previa de la imagen</span>
        </div>
      )}
    </div>
  );
};
