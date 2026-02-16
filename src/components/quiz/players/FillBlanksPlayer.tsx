import React, { useState, useMemo } from "react";
import { Badge } from "@/components/ui/badge";
import { FillBlanksData } from "../types";

interface Props {
  data: FillBlanksData;
  answer: Record<string, string>;
  onChange: (answer: Record<string, string>) => void;
  showResults?: boolean;
  resultDetails?: Record<string, boolean>;
}

export const FillBlanksPlayer: React.FC<Props> = ({ data, answer, onChange, showResults, resultDetails }) => {
  const [draggedWord, setDraggedWord] = useState<string | null>(null);

  // All available words (correct + distractors), shuffled once
  const allWords = useMemo(() => {
    const words = [
      ...data.blanks.map(b => b.correct_word),
      ...data.distractor_words,
    ].filter(w => w.trim());
    // Shuffle
    return words.sort(() => Math.random() - 0.5);
  }, [data.blanks, data.distractor_words]);

  const usedWords = Object.values(answer);
  const availableWords = allWords.filter(w => {
    const usedCount = usedWords.filter(u => u === w).length;
    const totalCount = allWords.filter(a => a === w).length;
    return usedCount < totalCount;
  });

  const handleDrop = (blankId: string) => {
    if (draggedWord) {
      onChange({ ...answer, [blankId]: draggedWord });
      setDraggedWord(null);
    }
  };

  const handleRemoveWord = (blankId: string) => {
    if (showResults) return;
    const newAnswer = { ...answer };
    delete newAnswer[blankId];
    onChange(newAnswer);
  };

  return (
    <div className="space-y-4">
      {/* Sentence with blanks */}
      <div className="p-4 rounded-lg bg-muted/30 text-base leading-relaxed flex flex-wrap items-center gap-1">
        {data.segments.map((segment, i) => (
          <React.Fragment key={i}>
            <span>{segment}</span>
            {i < data.blanks.length && (() => {
              const blank = data.blanks[i];
              const placedWord = answer[blank.id];
              const isCorrect = resultDetails?.[blank.id];

              if (placedWord) {
                let cls = "px-3 py-1 border-2 rounded-md font-medium cursor-pointer min-w-[80px] text-center";
                if (showResults) {
                  cls += isCorrect
                    ? " border-success bg-success/10 text-success"
                    : " border-destructive bg-destructive/10 text-destructive";
                } else {
                  cls += " border-primary bg-primary/10";
                }
                return (
                  <span
                    key={blank.id}
                    onClick={() => handleRemoveWord(blank.id)}
                    onDragOver={e => e.preventDefault()}
                    onDrop={() => handleDrop(blank.id)}
                    className={cls}
                  >
                    {placedWord}
                    {showResults && !isCorrect && (
                      <span className="text-xs ml-1">({blank.correct_word})</span>
                    )}
                  </span>
                );
              }

              return (
                <span
                  key={blank.id}
                  onDragOver={e => e.preventDefault()}
                  onDrop={() => handleDrop(blank.id)}
                  className="inline-block px-3 py-1 border-2 border-dashed border-muted-foreground/40 rounded-md min-w-[80px] text-center text-muted-foreground text-sm"
                >
                  _{i + 1}_
                </span>
              );
            })()}
          </React.Fragment>
        ))}
      </div>

      {/* Word bank */}
      <div className="p-3 rounded-lg bg-muted/50">
        <p className="text-xs text-muted-foreground mb-2">Arrastra las palabras a los espacios:</p>
        <div className="flex flex-wrap gap-2">
          {availableWords.map((word, i) => (
            <div
              key={`${word}-${i}`}
              draggable={!showResults}
              onDragStart={() => setDraggedWord(word)}
              className="px-3 py-1.5 bg-primary/10 border border-primary/30 rounded-md text-sm cursor-grab active:cursor-grabbing select-none"
            >
              {word}
            </div>
          ))}
          {availableWords.length === 0 && !showResults && (
            <p className="text-xs text-muted-foreground italic">Todas las palabras han sido colocadas</p>
          )}
        </div>
      </div>
    </div>
  );
};
