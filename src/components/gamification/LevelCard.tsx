import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { getUserLevel, getNextLevel, getLevelProgress, getPointsToNextLevel, LEVELS } from "@/lib/userLevel";
import { TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";

interface LevelCardProps {
  points: number;
  className?: string;
}

export const LevelCard: React.FC<LevelCardProps> = ({ points, className }) => {
  const currentLevel = getUserLevel(points);
  const nextLevel = getNextLevel(points);
  const progress = getLevelProgress(points);
  const pointsToNext = getPointsToNextLevel(points);
  const currentLevelIndex = LEVELS.findIndex(l => l.name === currentLevel.name);

  return (
    <Card className={cn("border-border/50", className)}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-primary" />
          Mi Nivel
        </CardTitle>
        <CardDescription>Tu progreso de aprendizaje</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Current Level Display */}
        <div className="flex items-center justify-center">
          <div
            className={cn(
              "flex flex-col items-center gap-2 p-6 rounded-2xl",
              currentLevel.bgColor
            )}
          >
            <span className="text-5xl">{currentLevel.emoji}</span>
            <span className={cn("text-xl font-bold", currentLevel.color)}>
              {currentLevel.name}
            </span>
            <span className="text-sm text-muted-foreground">
              {points.toLocaleString()} puntos
            </span>
          </div>
        </div>

        {/* Progress to Next Level */}
        {nextLevel ? (
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Progreso al siguiente nivel</span>
              <span className="font-medium">{progress}%</span>
            </div>
            <Progress value={progress} className="h-3" />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>
                {currentLevel.emoji} {currentLevel.name}
              </span>
              <span>
                {nextLevel.emoji} {nextLevel.name} ({pointsToNext?.toLocaleString()} pts)
              </span>
            </div>
          </div>
        ) : (
          <div className="text-center p-4 rounded-lg bg-gradient-to-r from-purple-100 to-amber-100">
            <p className="text-sm font-medium text-purple-700">
              🎉 ¡Felicitaciones! Has alcanzado el nivel máximo
            </p>
          </div>
        )}

        {/* Level Roadmap */}
        <div className="space-y-2">
          <p className="text-sm font-medium text-muted-foreground">Niveles</p>
          <div className="flex justify-between items-center gap-1">
            {LEVELS.map((level, index) => (
              <div
                key={level.name}
                className={cn(
                  "flex-1 flex flex-col items-center gap-1 p-2 rounded-lg transition-all",
                  index <= currentLevelIndex
                    ? level.bgColor
                    : "bg-muted/30 opacity-50"
                )}
              >
                <span className="text-lg">{level.emoji}</span>
                <span className={cn(
                  "text-[10px] font-medium text-center",
                  index <= currentLevelIndex ? level.color : "text-muted-foreground"
                )}>
                  {level.name}
                </span>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
