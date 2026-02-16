import React, { useState, useMemo } from "react";
import { Badge } from "@/components/ui/badge";
import { MindMapData } from "../types";

interface Props {
  data: MindMapData;
  answer: Record<string, string>;
  onChange: (answer: Record<string, string>) => void;
  showResults?: boolean;
  resultDetails?: Record<string, boolean>;
}

export const MindMapPlayer: React.FC<Props> = ({ data, answer, onChange, showResults, resultDetails }) => {
  const [draggedConcept, setDraggedConcept] = useState<string | null>(null);

  const unplacedConcepts = useMemo(() => {
    return data.concepts.filter(c => !answer[c.id]);
  }, [data.concepts, answer]);

  const getConceptsInGroup = (groupId: string) => {
    return data.concepts.filter(c => answer[c.id] === groupId);
  };

  const handleDragStart = (conceptId: string) => {
    setDraggedConcept(conceptId);
  };

  const handleDrop = (groupId: string) => {
    if (draggedConcept) {
      onChange({ ...answer, [draggedConcept]: groupId });
      setDraggedConcept(null);
    }
  };

  const handleRemoveFromGroup = (conceptId: string) => {
    if (showResults) return;
    const newAnswer = { ...answer };
    delete newAnswer[conceptId];
    onChange(newAnswer);
  };

  return (
    <div className="space-y-4">
      {/* Unplaced concepts pool */}
      <div className="p-3 rounded-lg bg-muted/50 min-h-[60px]">
        <p className="text-xs text-muted-foreground mb-2">Arrastra los conceptos a su grupo correcto:</p>
        <div className="flex flex-wrap gap-2">
          {unplacedConcepts.map(concept => (
            <div
              key={concept.id}
              draggable={!showResults}
              onDragStart={() => handleDragStart(concept.id)}
              className="px-3 py-1.5 bg-primary/10 border border-primary/30 rounded-md text-sm cursor-grab active:cursor-grabbing select-none"
            >
              {concept.text}
            </div>
          ))}
          {unplacedConcepts.length === 0 && !showResults && (
            <p className="text-xs text-muted-foreground italic">Todos los conceptos han sido clasificados</p>
          )}
        </div>
      </div>

      {/* Group drop zones */}
      <div className="grid gap-3 md:grid-cols-2">
        {data.groups.map(group => (
          <div
            key={group.id}
            onDragOver={e => e.preventDefault()}
            onDrop={() => handleDrop(group.id)}
            className="p-3 rounded-lg border-2 border-dashed border-border min-h-[100px] transition-colors hover:border-primary/50"
          >
            <Badge variant="secondary" className="mb-2">{group.label}</Badge>
            <div className="flex flex-wrap gap-2">
              {getConceptsInGroup(group.id).map(concept => {
                const isCorrect = resultDetails?.[concept.id];
                let borderClass = "border-primary/30 bg-primary/10";
                if (showResults) {
                  borderClass = isCorrect
                    ? "border-success bg-success/10 text-success"
                    : "border-destructive bg-destructive/10 text-destructive";
                }
                return (
                  <div
                    key={concept.id}
                    onClick={() => handleRemoveFromGroup(concept.id)}
                    className={`px-3 py-1.5 border rounded-md text-sm cursor-pointer select-none ${borderClass}`}
                  >
                    {concept.text}
                    {showResults && !isCorrect && (
                      <span className="text-xs ml-1">✗</span>
                    )}
                    {showResults && isCorrect && (
                      <span className="text-xs ml-1">✓</span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
