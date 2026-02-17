import React, { useRef, useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ImagePuzzleData, PuzzlePieceType, puzzlePieceTypeLabels } from "../types";
import { supabase } from "@/integrations/supabase/client";
import { Upload, Loader2, ImageIcon } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Props {
  data: ImagePuzzleData;
  onChange: (data: ImagePuzzleData) => void;
}

export const ImagePuzzleEditor: React.FC<Props> = ({ data, onChange }) => {
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
    if (file.size > 10 * 1024 * 1024) {
      toast({ title: "Error", description: "La imagen debe ser menor a 10MB.", variant: "destructive" });
      return;
    }

    setIsUploading(true);
    try {
      const fileExt = file.name.split(".").pop();
      const fileName = `puzzle-${Date.now()}.${fileExt}`;
      const { error: uploadError } = await supabase.storage
        .from("puzzle-images")
        .upload(fileName, file, { cacheControl: "3600", upsert: true });
      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage.from("puzzle-images").getPublicUrl(fileName);
      onChange({ ...data, image_url: urlData.publicUrl });
      toast({ title: "Imagen subida", description: "La imagen se cargó correctamente." });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Error al subir la imagen";
      toast({ title: "Error", description: message, variant: "destructive" });
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const pieceType = data.piece_type || "rectangular";
  const totalPieces = data.grid_cols * data.grid_rows;

  return (
    <div className="space-y-4">
      {/* Image upload */}
      <div>
        <Label className="text-sm font-medium">Imagen del rompecabezas</Label>
        <div className="flex gap-3 items-start mt-2">
          <div className="flex-1">
            <Input
              placeholder="https://ejemplo.com/imagen.jpg"
              value={data.image_url}
              onChange={e => onChange({ ...data, image_url: e.target.value })}
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
        <p className="text-xs text-muted-foreground mt-1">Sube una imagen de alta resolución (máx 10MB) o pega la URL</p>
      </div>

      {/* Grid and piece type config */}
      <div className="grid grid-cols-3 gap-4">
        <div>
          <Label className="text-sm">Columnas</Label>
          <Select value={String(data.grid_cols)} onValueChange={v => onChange({ ...data, grid_cols: parseInt(v) })}>
            <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
            <SelectContent>
              {[2, 3, 4, 5].map(n => <SelectItem key={n} value={String(n)}>{n}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label className="text-sm">Filas</Label>
          <Select value={String(data.grid_rows)} onValueChange={v => onChange({ ...data, grid_rows: parseInt(v) })}>
            <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
            <SelectContent>
              {[2, 3, 4, 5].map(n => <SelectItem key={n} value={String(n)}>{n}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label className="text-sm">Tipo de piezas</Label>
          <Select value={pieceType} onValueChange={v => onChange({ ...data, piece_type: v as PuzzlePieceType })}>
            <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
            <SelectContent>
              {(Object.keys(puzzlePieceTypeLabels) as PuzzlePieceType[]).map(key => (
                <SelectItem key={key} value={key}>{puzzlePieceTypeLabels[key]}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Puzzle preview */}
      {data.image_url ? (
        <div>
          <Label className="text-sm font-medium">Vista previa del rompecabezas</Label>
          <p className="text-xs text-muted-foreground mb-2">
            {totalPieces} piezas ({data.grid_cols}×{data.grid_rows}) — Tipo: {puzzlePieceTypeLabels[pieceType]}
          </p>
          <div className="max-w-md">
            <PuzzlePreview imageUrl={data.image_url} cols={data.grid_cols} rows={data.grid_rows} pieceType={pieceType} />
          </div>
        </div>
      ) : (
        <div className="flex items-center gap-2 p-4 rounded-lg bg-muted/30 text-muted-foreground">
          <ImageIcon className="w-5 h-5" />
          <span className="text-sm">Sube o pega una imagen para ver la vista previa del rompecabezas</span>
        </div>
      )}
    </div>
  );
};

/* ---- Puzzle Preview Component ---- */
interface PuzzlePreviewProps {
  imageUrl: string;
  cols: number;
  rows: number;
  pieceType: PuzzlePieceType;
}

const PuzzlePreview: React.FC<PuzzlePreviewProps> = ({ imageUrl, cols, rows, pieceType }) => {
  const total = cols * rows;

  const getClipPath = (col: number, row: number): string => {
    switch (pieceType) {
      case "jigsaw": {
        // Simulated jigsaw with rounded bumps
        const insetPct = 8;
        const top = row > 0 ? `polygon(0% 0%, 40% 0%, 45% ${insetPct}%, 50% ${insetPct + 2}%, 55% ${insetPct}%, 60% 0%, 100% 0%, 100% 100%, 0% 100%)` : "";
        // Simplified jigsaw-like clip
        return `inset(1px round 4px)`;
      }
      case "triangular":
        if ((col + row) % 2 === 0) {
          return "polygon(0% 100%, 50% 0%, 100% 100%)";
        }
        return "polygon(0% 0%, 100% 0%, 50% 100%)";
      case "hexagonal":
        return "polygon(25% 0%, 75% 0%, 100% 50%, 75% 100%, 25% 100%, 0% 50%)";
      case "circular":
        return "circle(45% at 50% 50%)";
      case "rectangular":
      default:
        return "none";
    }
  };

  const getBorderRadius = (): string => {
    switch (pieceType) {
      case "jigsaw": return "6px";
      case "circular": return "50%";
      default: return "2px";
    }
  };

  return (
    <div
      className="grid border-2 border-border rounded-lg overflow-hidden aspect-square bg-muted/20"
      style={{
        gridTemplateColumns: `repeat(${cols}, 1fr)`,
        gridTemplateRows: `repeat(${rows}, 1fr)`,
      }}
    >
      {Array.from({ length: total }, (_, i) => {
        const col = i % cols;
        const row = Math.floor(i / cols);
        const clipPath = getClipPath(col, row);

        return (
          <div
            key={i}
            className="relative overflow-hidden border border-border/40"
            style={{ borderRadius: getBorderRadius() }}
          >
            <div
              className="absolute inset-0"
              style={{
                backgroundImage: `url(${imageUrl})`,
                backgroundSize: `${cols * 100}% ${rows * 100}%`,
                backgroundPosition: `${col * (100 / (cols - 1 || 1))}% ${row * (100 / (rows - 1 || 1))}%`,
                clipPath: clipPath !== "none" ? clipPath : undefined,
              }}
            />
            {/* Piece number overlay */}
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-[10px] font-bold text-white/70 drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]">
                {i + 1}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
};
