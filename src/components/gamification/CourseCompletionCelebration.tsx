import React, { useEffect, useState } from "react";
import confetti from "canvas-confetti";
import { Award, Star, Trophy } from "lucide-react";
import { cn } from "@/lib/utils";

interface CourseCompletionCelebrationProps {
  show: boolean;
  courseName: string;
  points: number;
  score?: number;
  onClose?: () => void;
}

export const CourseCompletionCelebration: React.FC<CourseCompletionCelebrationProps> = ({
  show,
  courseName,
  points,
  score,
  onClose,
}) => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!show) return;
    setVisible(true);

    // Fire confetti bursts
    const duration = 2500;
    const end = Date.now() + duration;

    const frame = () => {
      confetti({
        particleCount: 3,
        angle: 60,
        spread: 55,
        origin: { x: 0, y: 0.7 },
        colors: ["#1C67D8", "#FF8F43", "#86FEF5"],
      });
      confetti({
        particleCount: 3,
        angle: 120,
        spread: 55,
        origin: { x: 1, y: 0.7 },
        colors: ["#1C67D8", "#FF8F43", "#86FEF5"],
      });
      if (Date.now() < end) requestAnimationFrame(frame);
    };
    frame();

    // Big center burst
    setTimeout(() => {
      confetti({
        particleCount: 80,
        spread: 100,
        origin: { y: 0.6 },
        colors: ["#1C67D8", "#FF8F43", "#86FEF5", "#FFD700"],
      });
    }, 300);
  }, [show]);

  if (!visible) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-background/60 backdrop-blur-sm animate-fade-in"
      onClick={() => { setVisible(false); onClose?.(); }}
    >
      <div
        className="relative flex flex-col items-center gap-4 rounded-2xl border border-primary/30 bg-card p-8 shadow-2xl max-w-sm mx-4 animate-scale-in"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Badge animation */}
        <div className="relative">
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-primary/10 ring-4 ring-primary/30 animate-[bounce_1s_ease-in-out_2]">
            <Award className="h-10 w-10 text-primary" />
          </div>
          <div className="absolute -top-1 -right-1 flex h-7 w-7 items-center justify-center rounded-full bg-warning text-warning-foreground animate-[ping_1s_ease-in-out_1]">
            <Star className="h-4 w-4" />
          </div>
        </div>

        <h2 className="text-xl font-bold text-center">🎉 ¡Felicitaciones!</h2>
        <p className="text-sm text-muted-foreground text-center">
          Has completado el curso
        </p>
        <p className="text-base font-semibold text-primary text-center leading-tight">
          {courseName}
        </p>

        <div className="flex items-center gap-4 mt-2">
          {score != null && (
            <div className="flex flex-col items-center gap-1">
              <span className="text-2xl font-bold text-primary">{score}%</span>
              <span className="text-xs text-muted-foreground">Calificación</span>
            </div>
          )}
          <div className="flex flex-col items-center gap-1">
            <div className="flex items-center gap-1 text-2xl font-bold text-warning">
              <Trophy className="h-5 w-5" />
              {points}
            </div>
            <span className="text-xs text-muted-foreground">Puntos ganados</span>
          </div>
        </div>

        <button
          onClick={() => { setVisible(false); onClose?.(); }}
          className="mt-4 rounded-lg bg-primary px-6 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
        >
          ¡Genial!
        </button>
      </div>
    </div>
  );
};
