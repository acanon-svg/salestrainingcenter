import React, { useState, useMemo, useCallback } from "react";
import { ImagePuzzleData } from "../types";

interface Props {
  data: ImagePuzzleData;
  answer: number[]; // array of piece indices at each position
  onChange: (answer: number[]) => void;
  showResults?: boolean;
  resultDetails?: Record<string, boolean>;
}

export const ImagePuzzlePlayer: React.FC<Props> = ({ data, answer, onChange, showResults, resultDetails }) => {
  const totalPieces = data.grid_cols * data.grid_rows;
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

  // Initialize shuffled pieces if answer is empty
  const pieces = useMemo(() => {
    if (answer && answer.length === totalPieces) return answer;
    // Create shuffled array
    const arr = Array.from({ length: totalPieces }, (_, i) => i);
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    // Set initial shuffled state
    setTimeout(() => onChange(arr), 0);
    return arr;
  }, [totalPieces]);

  const handleDragStart = (posIndex: number) => {
    if (showResults) return;
    setDraggedIndex(posIndex);
  };

  const handleDrop = (targetIndex: number) => {
    if (draggedIndex === null || draggedIndex === targetIndex) return;
    const newPieces = [...(answer.length === totalPieces ? answer : pieces)];
    [newPieces[draggedIndex], newPieces[targetIndex]] = [newPieces[targetIndex], newPieces[draggedIndex]];
    onChange(newPieces);
    setDraggedIndex(null);
  };

  const currentPieces = answer.length === totalPieces ? answer : pieces;
  const pieceWidth = 100 / data.grid_cols;
  const pieceHeight = 100 / data.grid_rows;

  return (
    <div className="space-y-3">
      <p className="text-xs text-muted-foreground">
        Arrastra las piezas para armar la imagen ({data.grid_cols}×{data.grid_rows})
      </p>

      <div className="flex gap-4 flex-col md:flex-row">
        {/* Puzzle grid */}
        <div
          className="grid border-2 border-border rounded-lg overflow-hidden flex-1 aspect-square max-w-md"
          style={{
            gridTemplateColumns: `repeat(${data.grid_cols}, 1fr)`,
            gridTemplateRows: `repeat(${data.grid_rows}, 1fr)`,
          }}
        >
          {currentPieces.map((pieceIndex, posIndex) => {
            const col = pieceIndex % data.grid_cols;
            const row = Math.floor(pieceIndex / data.grid_cols);
            const isCorrect = resultDetails?.[String(posIndex)];
            let borderStyle = "border border-border/50";
            if (showResults) {
              borderStyle = isCorrect
                ? "border-2 border-success"
                : "border-2 border-destructive";
            }

            const pieceType = (data as any).piece_type || "rectangular";
            const clipPath = pieceType === "hexagonal"
              ? "polygon(25% 0%, 75% 0%, 100% 50%, 75% 100%, 25% 100%, 0% 50%)"
              : pieceType === "circular"
              ? "circle(45% at 50% 50%)"
              : pieceType === "triangular"
              ? ((posIndex % 2 === 0) ? "polygon(0% 100%, 50% 0%, 100% 100%)" : "polygon(0% 0%, 100% 0%, 50% 100%)")
              : undefined;

            const borderRadius = pieceType === "jigsaw" ? "6px" : pieceType === "circular" ? "50%" : undefined;

            return (
              <div
                key={posIndex}
                draggable={!showResults}
                onDragStart={() => handleDragStart(posIndex)}
                onDragOver={e => e.preventDefault()}
                onDrop={() => handleDrop(posIndex)}
                className={`${borderStyle} cursor-grab active:cursor-grabbing relative overflow-hidden`}
                style={{
                  borderRadius,
                }}
              >
                <div
                  className="absolute inset-0"
                  style={{
                    backgroundImage: `url(${data.image_url})`,
                    backgroundSize: `${data.grid_cols * 100}% ${data.grid_rows * 100}%`,
                    backgroundPosition: `${col * (100 / (data.grid_cols - 1 || 1))}% ${row * (100 / (data.grid_rows - 1 || 1))}%`,
                    clipPath,
                  }}
                />
                {showResults && !isCorrect && (
                  <div className="absolute inset-0 bg-destructive/20 flex items-center justify-center">
                    <span className="text-destructive font-bold text-lg">✗</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Reference image */}
        <div className="shrink-0">
          <p className="text-xs text-muted-foreground mb-1">Imagen de referencia:</p>
          <img
            src={data.image_url}
            alt="Referencia"
            className="w-32 h-32 object-cover rounded-lg border"
          />
        </div>
      </div>
    </div>
  );
};
