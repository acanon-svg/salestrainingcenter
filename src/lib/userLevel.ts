/**
 * User Level System
 * 
 * Levels are determined by accumulated points:
 * - Principiante: 0 - 499 points
 * - Intermedio: 500 - 1,499 points
 * - Avanzado: 1,500 - 3,999 points
 * - Experto: 4,000+ points
 */

export interface UserLevel {
  name: string;
  emoji: string;
  minPoints: number;
  maxPoints: number | null;
  color: string;
  bgColor: string;
}

export const LEVELS: UserLevel[] = [
  {
    name: "Principiante",
    emoji: "🌱",
    minPoints: 0,
    maxPoints: 499,
    color: "text-slate-600",
    bgColor: "bg-slate-100",
  },
  {
    name: "Intermedio",
    emoji: "🚀",
    minPoints: 500,
    maxPoints: 1499,
    color: "text-blue-600",
    bgColor: "bg-blue-100",
  },
  {
    name: "Avanzado",
    emoji: "⭐",
    minPoints: 1500,
    maxPoints: 3999,
    color: "text-amber-600",
    bgColor: "bg-amber-100",
  },
  {
    name: "Experto",
    emoji: "👑",
    minPoints: 4000,
    maxPoints: null,
    color: "text-purple-600",
    bgColor: "bg-purple-100",
  },
];

/**
 * Get the user's current level based on their points
 */
export function getUserLevel(points: number): UserLevel {
  for (let i = LEVELS.length - 1; i >= 0; i--) {
    if (points >= LEVELS[i].minPoints) {
      return LEVELS[i];
    }
  }
  return LEVELS[0];
}

/**
 * Get the next level for a user, or null if they're at max level
 */
export function getNextLevel(points: number): UserLevel | null {
  const currentLevel = getUserLevel(points);
  const currentIndex = LEVELS.findIndex(l => l.name === currentLevel.name);
  
  if (currentIndex < LEVELS.length - 1) {
    return LEVELS[currentIndex + 1];
  }
  return null;
}

/**
 * Calculate progress percentage towards the next level
 */
export function getLevelProgress(points: number): number {
  const currentLevel = getUserLevel(points);
  const nextLevel = getNextLevel(points);
  
  if (!nextLevel) {
    return 100; // Already at max level
  }
  
  const pointsInCurrentLevel = points - currentLevel.minPoints;
  const pointsNeededForNextLevel = nextLevel.minPoints - currentLevel.minPoints;
  
  return Math.min(100, Math.round((pointsInCurrentLevel / pointsNeededForNextLevel) * 100));
}

/**
 * Get points remaining until next level
 */
export function getPointsToNextLevel(points: number): number | null {
  const nextLevel = getNextLevel(points);
  
  if (!nextLevel) {
    return null; // Already at max level
  }
  
  return nextLevel.minPoints - points;
}
