import React from "react";
import { Textarea } from "@/components/ui/textarea";
import { OpenAnswerData } from "../types";

interface Props {
  data: OpenAnswerData;
  answer: string;
  onChange: (answer: string) => void;
  showResults?: boolean;
}

export const OpenAnswerPlayer: React.FC<Props> = ({ data, answer, onChange, showResults }) => {
  const charCount = (answer || "").length;
  const meetsMin = !data.min_length || charCount >= data.min_length;

  return (
    <div className="space-y-3">
      {data.instruction && (
        <div className="p-3 rounded-lg bg-muted/30 text-sm">
          <p className="font-medium mb-1">📋 Instrucciones:</p>
          <p className="whitespace-pre-wrap">{data.instruction}</p>
        </div>
      )}
      <Textarea
        placeholder="Escribe tu respuesta aquí..."
        value={answer || ""}
        onChange={e => onChange(e.target.value)}
        disabled={showResults}
        rows={5}
        className={showResults ? "opacity-70" : ""}
      />
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span>{charCount} caracteres</span>
        {data.min_length ? (
          <span className={meetsMin ? "text-success" : "text-destructive"}>
            Mínimo: {data.min_length} caracteres
          </span>
        ) : null}
      </div>
      {showResults && (
        <div className="p-3 rounded-lg bg-primary/10 border border-primary/30 text-sm">
          ✅ Respuesta enviada. Este tipo de actividad es evaluada manualmente.
        </div>
      )}
    </div>
  );
};
