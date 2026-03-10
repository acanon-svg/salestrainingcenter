import React from "react";
import { useTeamRanking, useRanking } from "@/hooks/useRanking";
import { useAuth } from "@/contexts/AuthContext";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Trophy, Medal, Award } from "lucide-react";
import { cn } from "@/lib/utils";

const POSITION_ICONS = [Trophy, Medal, Award];
const POSITION_COLORS = [
  "text-warning",
  "text-muted-foreground",
  "text-warning/60",
];

export const CourseLeaderboard: React.FC = () => {
  const { profile } = useAuth();
  const team = profile?.team;

  const { data: teamRanking, isLoading: teamLoading } = useTeamRanking(team || "");
  const { data: globalRanking, isLoading: globalLoading } = useRanking(5);

  const ranking = team && teamRanking && teamRanking.length > 0 ? teamRanking : globalRanking;
  const isLoading = team ? teamLoading : globalLoading;
  const title = team ? `Top de ${team}` : "Top General";
  const top5 = ranking?.slice(0, 5) || [];

  if (isLoading || top5.length === 0) return null;

  const currentUserId = profile?.user_id;

  return (
    <Card className="border-primary/20">
      <CardHeader className="pb-3 pt-4 px-4">
        <CardTitle className="text-sm font-semibold flex items-center gap-2">
          <Trophy className="h-4 w-4 text-warning" />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="px-4 pb-4 pt-0 space-y-2">
        {top5.map((user, i) => {
          const Icon = POSITION_ICONS[i] || null;
          const isCurrentUser = user.user_id === currentUserId;
          const initials = (user.full_name || "?")
            .split(" ")
            .map((n) => n[0])
            .join("")
            .slice(0, 2)
            .toUpperCase();

          return (
            <div
              key={user.id}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 transition-colors",
                isCurrentUser
                  ? "bg-primary/10 ring-1 ring-primary/30"
                  : "hover:bg-muted/50"
              )}
            >
              <span className="w-5 text-center text-xs font-bold text-muted-foreground">
                {Icon ? (
                  <Icon className={cn("h-4 w-4 mx-auto", POSITION_COLORS[i])} />
                ) : (
                  i + 1
                )}
              </span>

              <Avatar className="h-7 w-7">
                <AvatarImage src={user.avatar_url || undefined} />
                <AvatarFallback className="text-[10px] bg-muted">
                  {initials}
                </AvatarFallback>
              </Avatar>

              <span
                className={cn(
                  "flex-1 text-sm truncate",
                  isCurrentUser && "font-semibold"
                )}
              >
                {isCurrentUser ? "Tú" : user.full_name || "Usuario"}
              </span>

              <span className="text-xs font-bold text-primary">
                {user.points.toLocaleString()} pts
              </span>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
};
