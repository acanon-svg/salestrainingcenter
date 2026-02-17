import React from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { OpenAnswerData } from "../types";

interface Props {
  data: OpenAnswerData;
  onChange: (data: OpenAnswerData) => void;
}

export const OpenAnswerEditor: React.FC<Props> = ({ data, onChange }) => {
  return (
    <div className="space-y-4">
      <div>
        <Label className="text-sm font-medium text-muted-foreground mb-2 block">
          Instrucción para el estudiante
        </Label>
        <Textarea
          placeholder="Describe la actividad que el estudiante debe realizar..."
          value={data.instruction}
          onChange={e => onChange({ ...data, instruction: e.target.value })}
          rows={3}
        />
      </div>
      <div>
        <Label className="text-sm font-medium text-muted-foreground mb-2 block">
          Longitud mínima de respuesta (caracteres)
        </Label>
        <Input
          type="number"
          min={0}
          max={5000}
          value={data.min_length || 0}
          onChange={e => onChange({ ...data, min_length: parseInt(e.target.value) || 0 })}
          className="w-32"
        />
        <p className="text-xs text-muted-foreground mt-1">
          0 = sin mínimo. La respuesta será evaluada manualmente.
        </p>
      </div>
    </div>
  );
};
