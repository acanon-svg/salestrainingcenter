import React from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Plus, X } from "lucide-react";
import { MatchColumnsData } from "../types";

interface Props {
  data: MatchColumnsData;
  onChange: (data: MatchColumnsData) => void;
}

export const MatchColumnsEditor: React.FC<Props> = ({ data, onChange }) => {
  const addPair = () => {
    const id = `p${Date.now()}`;
    onChange({ ...data, pairs: [...data.pairs, { id, left: "", right: "" }] });
  };

  const updatePair = (index: number, field: "left" | "right", value: string) => {
    const pairs = [...data.pairs];
    pairs[index] = { ...pairs[index], [field]: value };
    onChange({ ...data, pairs });
  };

  const removePair = (index: number) => {
    if (data.pairs.length <= 2) return;
    onChange({ ...data, pairs: data.pairs.filter((_, i) => i !== index) });
  };

  return (
    <div className="space-y-4">
      <label className="text-sm font-medium text-muted-foreground mb-2 block">
        Pares de ideas (Columna A ↔ Columna B)
      </label>
      <p className="text-xs text-muted-foreground">
        El estudiante deberá conectar cada idea de la columna A con su par correcto en la columna B
      </p>
      <div className="space-y-2">
        <div className="grid grid-cols-[1fr_1fr_40px] gap-2 text-xs font-medium text-muted-foreground">
          <span>Columna A</span>
          <span>Columna B</span>
          <span />
        </div>
        {data.pairs.map((pair, i) => (
          <div key={pair.id} className="grid grid-cols-[1fr_1fr_40px] gap-2">
            <Input
              placeholder={`Idea A-${i + 1}`}
              value={pair.left}
              onChange={e => updatePair(i, "left", e.target.value)}
            />
            <Input
              placeholder={`Idea B-${i + 1}`}
              value={pair.right}
              onChange={e => updatePair(i, "right", e.target.value)}
              className="border-success"
            />
            {data.pairs.length > 2 && (
              <Button variant="ghost" size="icon" onClick={() => removePair(i)}>
                <X className="w-4 h-4" />
              </Button>
            )}
          </div>
        ))}
        <Button variant="outline" size="sm" onClick={addPair}>
          <Plus className="w-3 h-3 mr-1" /> Agregar par
        </Button>
      </div>
    </div>
  );
};
