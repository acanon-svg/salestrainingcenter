import React from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ImagePuzzleData } from "../types";

interface Props {
  data: ImagePuzzleData;
  onChange: (data: ImagePuzzleData) => void;
}

export const ImagePuzzleEditor: React.FC<Props> = ({ data, onChange }) => {
  return (
    <div className="space-y-4">
      <div>
        <Label className="text-sm">URL de la imagen</Label>
        <Input
          placeholder="https://ejemplo.com/imagen.jpg"
          value={data.image_url}
          onChange={e => onChange({ ...data, image_url: e.target.value })}
          className="mt-1"
        />
        <p className="text-xs text-muted-foreground mt-1">
          Pega la URL de la imagen que se convertirá en rompecabezas
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label className="text-sm">Columnas</Label>
          <Select
            value={String(data.grid_cols)}
            onValueChange={v => onChange({ ...data, grid_cols: parseInt(v) })}
          >
            <SelectTrigger className="mt-1">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="2">2</SelectItem>
              <SelectItem value="3">3</SelectItem>
              <SelectItem value="4">4</SelectItem>
              <SelectItem value="5">5</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label className="text-sm">Filas</Label>
          <Select
            value={String(data.grid_rows)}
            onValueChange={v => onChange({ ...data, grid_rows: parseInt(v) })}
          >
            <SelectTrigger className="mt-1">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="2">2</SelectItem>
              <SelectItem value="3">3</SelectItem>
              <SelectItem value="4">4</SelectItem>
              <SelectItem value="5">5</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {data.image_url && (
        <div>
          <Label className="text-sm">Vista previa</Label>
          <div className="mt-2 border rounded-lg overflow-hidden max-w-sm">
            <img
              src={data.image_url}
              alt="Preview"
              className="w-full h-auto"
              onError={e => (e.currentTarget.style.display = "none")}
            />
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Se dividirá en {data.grid_cols * data.grid_rows} piezas ({data.grid_cols}×{data.grid_rows})
          </p>
        </div>
      )}
    </div>
  );
};
