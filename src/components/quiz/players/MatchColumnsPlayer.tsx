import React, { useState, useMemo } from "react";
import { MatchColumnsData } from "../types";

interface Props {
  data: MatchColumnsData;
  answer: Record<string, string>; // pair_id -> selected right text
  onChange: (answer: Record<string, string>) => void;
  showResults?: boolean;
  resultDetails?: Record<string, boolean>;
}

export const MatchColumnsPlayer: React.FC<Props> = ({ data, answer, onChange, showResults, resultDetails }) => {
  const [draggedRight, setDraggedRight] = useState<string | null>(null);

  // Shuffle right column once
  const shuffledRights = useMemo(() => {
    return [...data.pairs.map(p => p.right)].sort(() => Math.random() - 0.5);
  }, [data.pairs]);

  const usedRights = Object.values(answer);
  const availableRights = shuffledRights.filter(r => !usedRights.includes(r));

  const handleDrop = (pairId: string) => {
    if (draggedRight) {
      onChange({ ...answer, [pairId]: draggedRight });
      setDraggedRight(null);
    }
  };

  const handleRemove = (pairId: string) => {
    if (showResults) return;
    const newAnswer = { ...answer };
    delete newAnswer[pairId];
    onChange(newAnswer);
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        {/* Left column (drop targets) */}
        <div className="space-y-2">
          <p className="text-xs font-medium text-muted-foreground mb-1">Columna A</p>
          {data.pairs.map(pair => {
            const matched = answer[pair.id];
            const isCorrect = resultDetails?.[pair.id];

            return (
              <div
                key={pair.id}
                onDragOver={e => e.preventDefault()}
                onDrop={() => handleDrop(pair.id)}
                className="p-3 rounded-lg border bg-card min-h-[60px]"
              >
                <p className="text-sm font-medium mb-1">{pair.left}</p>
                {matched ? (
                  <div
                    onClick={() => handleRemove(pair.id)}
                    className={`px-2 py-1 rounded text-xs cursor-pointer inline-block ${
                      showResults
                        ? isCorrect
                          ? "bg-success/10 border border-success text-success"
                          : "bg-destructive/10 border border-destructive text-destructive"
                        : "bg-primary/10 border border-primary/30"
                    }`}
                  >
                    → {matched}
                    {showResults && !isCorrect && (
                      <span className="ml-1">(Correcto: {pair.right})</span>
                    )}
                  </div>
                ) : (
                  <div className="px-2 py-1 rounded border-2 border-dashed border-muted-foreground/30 text-xs text-muted-foreground inline-block">
                    Arrastra aquí
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Right column (draggable items) */}
        <div className="space-y-2">
          <p className="text-xs font-medium text-muted-foreground mb-1">Columna B</p>
          {availableRights.map((right, i) => (
            <div
              key={`${right}-${i}`}
              draggable={!showResults}
              onDragStart={() => setDraggedRight(right)}
              className="p-3 rounded-lg border bg-primary/5 border-primary/20 cursor-grab active:cursor-grabbing select-none text-sm"
            >
              {right}
            </div>
          ))}
          {availableRights.length === 0 && !showResults && (
            <p className="text-xs text-muted-foreground italic p-3">Todas las ideas han sido asignadas</p>
          )}
        </div>
      </div>
    </div>
  );
};
