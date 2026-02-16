import React from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Plus, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { FillBlanksData } from "../types";

interface Props {
  data: FillBlanksData;
  onChange: (data: FillBlanksData) => void;
}

export const FillBlanksEditor: React.FC<Props> = ({ data, onChange }) => {
  // Build a preview string from segments and blanks
  const getPreviewText = () => {
    let text = "";
    for (let i = 0; i < data.segments.length; i++) {
      text += data.segments[i];
      if (i < data.blanks.length) {
        text += `[___${i + 1}___]`;
      }
    }
    return text;
  };

  const updateSegment = (index: number, value: string) => {
    const segments = [...data.segments];
    segments[index] = value;
    onChange({ ...data, segments });
  };

  const updateBlank = (index: number, word: string) => {
    const blanks = [...data.blanks];
    blanks[index] = { ...blanks[index], correct_word: word };
    onChange({ ...data, blanks });
  };

  const addBlank = () => {
    const id = `b${Date.now()}`;
    onChange({
      ...data,
      segments: [...data.segments, ""],
      blanks: [...data.blanks, { id, correct_word: "" }],
    });
  };

  const removeBlank = (index: number) => {
    if (data.blanks.length <= 1) return;
    const blanks = data.blanks.filter((_, i) => i !== index);
    const segments = [...data.segments];
    // Merge segment[index] + segment[index+1]
    segments[index] = (segments[index] || "") + (segments[index + 1] || "");
    segments.splice(index + 1, 1);
    onChange({ ...data, blanks, segments });
  };

  const addDistractor = () => {
    onChange({ ...data, distractor_words: [...data.distractor_words, ""] });
  };

  const updateDistractor = (index: number, value: string) => {
    const words = [...data.distractor_words];
    words[index] = value;
    onChange({ ...data, distractor_words: words });
  };

  const removeDistractor = (index: number) => {
    onChange({ ...data, distractor_words: data.distractor_words.filter((_, i) => i !== index) });
  };

  return (
    <div className="space-y-4">
      <div>
        <label className="text-sm font-medium text-muted-foreground mb-2 block">
          Construye la frase con espacios en blanco
        </label>
        <p className="text-xs text-muted-foreground mb-3">
          Cada par de "Texto" + "Palabra correcta" forma la frase. El estudiante arrastrará las palabras a los espacios.
        </p>
        <div className="space-y-2">
          {data.blanks.map((blank, i) => (
            <div key={blank.id} className="flex items-center gap-2 flex-wrap">
              <Input
                placeholder={`Texto antes del espacio ${i + 1}`}
                value={data.segments[i] || ""}
                onChange={e => updateSegment(i, e.target.value)}
                className="flex-1 min-w-[150px]"
              />
              <Badge variant="secondary" className="shrink-0">Espacio {i + 1}</Badge>
              <Input
                placeholder="Palabra correcta"
                value={blank.correct_word}
                onChange={e => updateBlank(i, e.target.value)}
                className="w-40 border-success"
              />
              {data.blanks.length > 1 && (
                <Button variant="ghost" size="icon" onClick={() => removeBlank(i)}>
                  <X className="w-4 h-4" />
                </Button>
              )}
            </div>
          ))}
          {/* Last segment (text after last blank) */}
          <Input
            placeholder="Texto final (después del último espacio)"
            value={data.segments[data.blanks.length] || ""}
            onChange={e => updateSegment(data.blanks.length, e.target.value)}
          />
          <Button variant="outline" size="sm" onClick={addBlank}>
            <Plus className="w-3 h-3 mr-1" /> Agregar espacio en blanco
          </Button>
        </div>
      </div>

      <div>
        <label className="text-sm font-medium text-muted-foreground mb-2 block">
          Vista previa de la frase
        </label>
        <div className="p-3 rounded-lg bg-muted/50 text-sm">
          {getPreviewText() || "La frase aparecerá aquí..."}
        </div>
      </div>

      <div>
        <label className="text-sm font-medium text-muted-foreground mb-2 block">
          Palabras distractoras (opcionales)
        </label>
        <p className="text-xs text-muted-foreground mb-2">
          Palabras adicionales que confundirán al estudiante
        </p>
        <div className="flex flex-wrap gap-2">
          {data.distractor_words.map((word, i) => (
            <div key={i} className="flex items-center gap-1">
              <Input
                placeholder="Distractor"
                value={word}
                onChange={e => updateDistractor(i, e.target.value)}
                className="w-32"
              />
              <Button variant="ghost" size="icon" onClick={() => removeDistractor(i)}>
                <X className="w-3 h-3" />
              </Button>
            </div>
          ))}
          <Button variant="outline" size="sm" onClick={addDistractor}>
            <Plus className="w-3 h-3 mr-1" /> Distractor
          </Button>
        </div>
      </div>
    </div>
  );
};
