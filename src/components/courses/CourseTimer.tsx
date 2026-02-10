import React, { useState, useEffect } from "react";
import { Clock, AlertTriangle, Timer } from "lucide-react";
import { cn } from "@/lib/utils";

interface CourseTimerProps {
  timeLimitMinutes: number;
  startedAt: string | null;
  onTimeExpired?: () => void;
  className?: string;
}

export const CourseTimer: React.FC<CourseTimerProps> = ({
  timeLimitMinutes,
  startedAt,
  onTimeExpired,
  className,
}) => {
  const [remainingSeconds, setRemainingSeconds] = useState<number | null>(null);
  const [isExpired, setIsExpired] = useState(false);

  useEffect(() => {
    if (!startedAt || !timeLimitMinutes) {
      setRemainingSeconds(null);
      return;
    }

    const calculateRemaining = () => {
      const startTime = new Date(startedAt).getTime();
      const endTime = startTime + timeLimitMinutes * 60 * 1000;
      const now = Date.now();
      const remaining = Math.max(0, Math.floor((endTime - now) / 1000));
      
      return remaining;
    };

    // Initial calculation
    const initial = calculateRemaining();
    setRemainingSeconds(initial);
    
    if (initial <= 0) {
      setIsExpired(true);
      onTimeExpired?.();
      return;
    }

    // Update every second
    const interval = setInterval(() => {
      const remaining = calculateRemaining();
      setRemainingSeconds(remaining);
      
      if (remaining <= 0 && !isExpired) {
        setIsExpired(true);
        onTimeExpired?.();
        clearInterval(interval);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [startedAt, timeLimitMinutes, onTimeExpired, isExpired]);

  if (remainingSeconds === null) {
    return null;
  }

  const totalSeconds = timeLimitMinutes * 60;
  const percentageRemaining = (remainingSeconds / totalSeconds) * 100;
  
  // Color logic:
  // - Green: first 5 minutes or more than 5 minutes remaining
  // - Yellow: between 5 minutes and last 5 minutes
  // - Red: last 5 minutes
  const fiveMinutesInSeconds = 5 * 60;
  
  let timerColor: "green" | "yellow" | "red";
  if (isExpired) {
    timerColor = "red";
  } else if (remainingSeconds <= fiveMinutesInSeconds) {
    timerColor = "red";
  } else if (remainingSeconds <= totalSeconds - fiveMinutesInSeconds && remainingSeconds > fiveMinutesInSeconds) {
    timerColor = "yellow";
  } else {
    timerColor = "green";
  }

  // Format time as MM:SS or HH:MM:SS if more than an hour
  const formatTime = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hrs > 0) {
      return `${hrs.toString().padStart(2, "0")}:${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
    }
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const colorClasses = {
    green: {
      bg: "bg-success/10",
      border: "border-success/30",
      text: "text-success",
      icon: "text-success",
      progress: "bg-success",
    },
    yellow: {
      bg: "bg-warning/10",
      border: "border-warning/30",
      text: "text-warning",
      icon: "text-warning",
      progress: "bg-warning",
    },
    red: {
      bg: "bg-destructive/10",
      border: "border-destructive/30",
      text: "text-destructive",
      icon: "text-destructive",
      progress: "bg-destructive",
    },
  };

  const colors = colorClasses[timerColor];

  return (
    <div
      className={cn(
        "rounded-lg border p-3 transition-colors",
        colors.bg,
        colors.border,
        className
      )}
    >
      <div className="flex items-center gap-3">
        <div className={cn("p-2 rounded-full", colors.bg)}>
          {isExpired ? (
            <AlertTriangle className={cn("w-5 h-5", colors.icon)} />
          ) : (
            <Timer className={cn("w-5 h-5", colors.icon)} />
          )}
        </div>
        
        <div className="flex-1">
          <div className="flex items-center justify-between mb-1">
            <span className="text-sm font-medium">
              {isExpired ? "Tiempo agotado" : "Tiempo restante"}
            </span>
            <span className={cn("text-lg font-bold tabular-nums", colors.text)}>
              {isExpired ? "00:00" : formatTime(remainingSeconds)}
            </span>
          </div>
          
          {/* Progress bar */}
          <div className="h-2 bg-muted rounded-full overflow-hidden">
            <div
              className={cn("h-full transition-all duration-1000", colors.progress)}
              style={{ width: `${isExpired ? 0 : percentageRemaining}%` }}
            />
          </div>
        </div>
      </div>

      {isExpired && (
        <p className="text-xs text-destructive mt-2">
          El tiempo para completar este curso ha expirado. Ya no puedes continuar con el contenido.
        </p>
      )}

      {timerColor === "red" && !isExpired && (
        <p className="text-xs text-destructive mt-2 flex items-center gap-1">
          <AlertTriangle className="w-3 h-3" />
          ¡Quedan menos de 5 minutos!
        </p>
      )}
    </div>
  );
};

export default CourseTimer;
