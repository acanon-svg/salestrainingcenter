import React from "react";
import { getUserLevel, getNextLevel, getLevelProgress, getPointsToNextLevel } from "@/lib/userLevel";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

interface LevelBadgeProps {
  points: number;
  showProgress?: boolean;
  size?: "sm" | "md" | "lg";
  className?: string;
}

export const LevelBadge: React.FC<LevelBadgeProps> = ({
  points,
  showProgress = false,
  size = "md",
  className,
}) => {
  const currentLevel = getUserLevel(points);
  const nextLevel = getNextLevel(points);
  const progress = getLevelProgress(points);
  const pointsToNext = getPointsToNextLevel(points);

  const sizeClasses = {
    sm: "text-xs px-2 py-0.5",
    md: "text-sm px-3 py-1",
    lg: "text-base px-4 py-1.5",
  };

  return (
    <div className={cn("flex flex-col gap-1", className)}>
      <div
        className={cn(
          "inline-flex items-center gap-1.5 rounded-full font-medium",
          currentLevel.bgColor,
          currentLevel.color,
          sizeClasses[size]
        )}
      >
        <span>{currentLevel.emoji}</span>
        <span>{currentLevel.name}</span>
      </div>
      
      {showProgress && nextLevel && (
        <div className="space-y-1">
          <Progress value={progress} className="h-1.5" />
          <p className="text-xs text-muted-foreground">
            {pointsToNext?.toLocaleString()} pts para {nextLevel.emoji} {nextLevel.name}
          </p>
        </div>
      )}
      
      {showProgress && !nextLevel && (
        <p className="text-xs text-muted-foreground">
          ¡Nivel máximo alcanzado! 🎉
        </p>
      )}
    </div>
  );
};
