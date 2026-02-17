import React, { useRef } from "react";
import { Button } from "@/components/ui/button";
import { ImageActivityData } from "../types";
import { Upload, FileCheck, ImageIcon, Download } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
interface ImageActivityAnswer {
  file_name?: string;
  file_url?: string;
  submitted?: boolean;
}

interface Props {
  data: ImageActivityData;
  answer: ImageActivityAnswer;
  onChange: (answer: ImageActivityAnswer) => void;
  showResults?: boolean;
}

export const ImageActivityPlayer: React.FC<Props> = ({ data, answer, onChange, showResults }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const fileUrl = URL.createObjectURL(file);
    onChange({
      file_name: file.name,
      file_url: fileUrl,
      submitted: true,
    });
  };

  const handleDownloadImage = async () => {
    if (!data.example_image_url) return;
    try {
      const response = await fetch(data.example_image_url);
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      const ext = data.example_image_url.split(".").pop()?.split("?")[0] || "png";
      a.download = `imagen-actividad.${ext}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch {
      toast({ title: "Error", description: "No se pudo descargar la imagen.", variant: "destructive" });
    }
  };

  return (
    <div className="space-y-4">
      {data.instruction && (
        <div className="p-3 rounded-lg bg-muted/30 text-sm">
          <p className="font-medium mb-1">📋 Instrucciones:</p>
          <p className="whitespace-pre-wrap">{data.instruction}</p>
        </div>
      )}

      {data.example_image_url && (
        <div>
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-medium text-muted-foreground flex items-center gap-1">
              <ImageIcon className="w-4 h-4" /> Imagen de ejemplo:
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={handleDownloadImage}
              className="gap-2"
            >
              <Download className="w-4 h-4" />
              Descargar imagen
            </Button>
          </div>
          <div className="rounded-lg border border-border overflow-hidden max-w-lg">
            <img
              src={data.example_image_url}
              alt="Imagen de ejemplo"
              className="w-full h-auto object-contain max-h-80"
            />
          </div>
        </div>
      )}
      <div className="space-y-2">
        <p className="text-sm font-medium text-muted-foreground">Adjunta tu archivo de respuesta:</p>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx"
          className="hidden"
          onChange={handleFileChange}
          disabled={showResults}
        />
        {!answer?.submitted ? (
          <Button
            variant="outline"
            onClick={() => fileInputRef.current?.click()}
            disabled={showResults}
            className="w-full border-dashed border-2 h-20 flex flex-col gap-1"
          >
            <Upload className="w-5 h-5" />
            <span className="text-sm">Haz clic para seleccionar un archivo</span>
          </Button>
        ) : (
          <div className="flex items-center gap-3 p-3 rounded-lg bg-success/10 border border-success/30">
            <FileCheck className="w-5 h-5 text-success shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{answer.file_name}</p>
              <p className="text-xs text-muted-foreground">Archivo adjuntado</p>
            </div>
            {!showResults && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
              >
                Cambiar
              </Button>
            )}
          </div>
        )}
      </div>

      {showResults && (
        <div className="p-3 rounded-lg bg-primary/10 border border-primary/30 text-sm">
          ✅ Archivo enviado. Este tipo de actividad es evaluada manualmente.
        </div>
      )}
    </div>
  );
};
