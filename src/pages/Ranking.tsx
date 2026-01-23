import React from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { useAuth } from "@/contexts/AuthContext";
import { useRanking } from "@/hooks/useRanking";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { Trophy, Medal, Award, TrendingUp, Crown, Star } from "lucide-react";
import { LevelBadge } from "@/components/gamification/LevelBadge";

const Ranking: React.FC = () => {
  const { profile } = useAuth();
  const { data: ranking, isLoading } = useRanking(50);

  const getPositionIcon = (position: number) => {
    switch (position) {
      case 1:
        return <Crown className="w-6 h-6 text-addi-orange" />;
      case 2:
        return <Medal className="w-6 h-6 text-muted-foreground" />;
      case 3:
        return <Medal className="w-6 h-6 text-amber-600" />;
      default:
        return null;
    }
  };

  const getPositionStyle = (position: number) => {
    switch (position) {
      case 1:
        return "bg-gradient-to-r from-addi-orange/20 to-transparent border-addi-orange/30";
      case 2:
        return "bg-gradient-to-r from-muted/50 to-transparent border-muted-foreground/20";
      case 3:
        return "bg-gradient-to-r from-amber-100/50 to-transparent border-amber-600/20 dark:from-amber-900/20";
      default:
        return "border-border/50";
    }
  };

  const getInitials = (name: string | null) => {
    if (!name) return "??";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  // Find current user in ranking
  const currentUserIndex = ranking?.findIndex((r) => r.user_id === profile?.user_id) ?? -1;
  const currentPosition = currentUserIndex >= 0 ? currentUserIndex + 1 : null;

  return (
    <DashboardLayout>
      <div className="space-y-8 animate-fade-in">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
            <Trophy className="w-8 h-8 text-primary" />
            Ranking
          </h1>
          <p className="text-muted-foreground">
            Clasificación de puntos acumulados por el equipo
          </p>
        </div>

        {/* User Position Card */}
        <Card className="border-primary/30 bg-gradient-to-r from-primary/5 to-transparent">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/10">
                  <span className="text-2xl font-bold text-primary">
                    #{currentPosition || "—"}
                  </span>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Tu posición actual</p>
                  <p className="text-xl font-semibold">{profile?.full_name || "Usuario"}</p>
                  <p className="text-sm text-muted-foreground">{profile?.team || "Sin equipo"}</p>
                </div>
              </div>
              <div className="flex flex-col items-end gap-2">
                <LevelBadge points={profile?.points || 0} size="md" />
                <div className="flex items-center gap-2">
                  <Star className="w-5 h-5 text-addi-orange" />
                  <span className="text-2xl font-bold">{profile?.points?.toLocaleString() || 0}</span>
                </div>
                <p className="text-sm text-muted-foreground">puntos</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Top 3 Podium */}
        {isLoading ? (
          <div className="grid gap-4 md:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <Card key={i}>
                <CardContent className="pt-6 text-center">
                  <Skeleton className="w-20 h-20 rounded-full mx-auto mb-4" />
                  <Skeleton className="h-5 w-32 mx-auto mb-2" />
                  <Skeleton className="h-4 w-24 mx-auto" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : ranking && ranking.length > 0 ? (
          <div className="grid gap-4 md:grid-cols-3">
            {ranking.slice(0, 3).map((user, index) => {
              const position = index + 1;
              return (
                <Card
                  key={user.id}
                  className={`relative overflow-hidden ${getPositionStyle(position)}`}
                >
                  <div className="absolute top-3 right-3">{getPositionIcon(position)}</div>
                  <CardContent className="pt-6 text-center">
                    <Avatar className="w-20 h-20 mx-auto mb-4 border-4 border-background shadow-lg">
                      <AvatarImage src={user.avatar_url || undefined} />
                      <AvatarFallback className="text-xl bg-primary/10 text-primary">
                        {getInitials(user.full_name)}
                      </AvatarFallback>
                    </Avatar>
                    <h3 className="font-semibold text-lg">{user.full_name || "Usuario"}</h3>
                    <p className="text-sm text-muted-foreground mb-2">{user.team || "Sin equipo"}</p>
                    <LevelBadge points={user.points} size="sm" className="mb-3" />
                    <div className="flex justify-center gap-4">
                      <div className="text-center">
                        <p className="text-2xl font-bold text-primary">
                          {user.points.toLocaleString()}
                        </p>
                        <p className="text-xs text-muted-foreground">puntos</p>
                      </div>
                      <div className="text-center">
                        <p className="text-2xl font-bold text-addi-orange">{user.badges_count}</p>
                        <p className="text-xs text-muted-foreground">insignias</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        ) : (
          <Card>
            <CardContent className="py-12 text-center">
              <Trophy className="w-12 h-12 text-muted-foreground/50 mx-auto mb-4" />
              <p className="text-muted-foreground">Aún no hay usuarios en el ranking</p>
            </CardContent>
          </Card>
        )}

        {/* Full Ranking Table */}
        <Card className="border-border/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-primary" />
              Tabla de Posiciones
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-3">
                {[1, 2, 3, 4, 5].map((i) => (
                  <Skeleton key={i} className="h-16 w-full" />
                ))}
              </div>
            ) : ranking && ranking.length > 0 ? (
              <div className="space-y-2">
                {ranking.map((user, index) => {
                  const position = index + 1;
                  const isCurrentUser = user.user_id === profile?.user_id;

                  return (
                    <div
                      key={user.id}
                      className={`flex items-center gap-4 p-3 rounded-lg transition-colors ${
                        isCurrentUser
                          ? "bg-primary/10 border border-primary/30"
                          : "hover:bg-muted/50"
                      }`}
                    >
                      <div className="w-10 text-center">
                        {position <= 3 ? (
                          getPositionIcon(position)
                        ) : (
                          <span className="text-lg font-semibold text-muted-foreground">
                            {position}
                          </span>
                        )}
                      </div>

                      <Avatar className="w-10 h-10">
                        <AvatarImage src={user.avatar_url || undefined} />
                        <AvatarFallback className="text-sm">
                          {getInitials(user.full_name)}
                        </AvatarFallback>
                      </Avatar>

                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">
                          {user.full_name || "Usuario"}
                          {isCurrentUser && (
                            <Badge variant="secondary" className="ml-2 text-xs">
                              Tú
                            </Badge>
                          )}
                        </p>
                        <p className="text-sm text-muted-foreground">{user.team || "Sin equipo"}</p>
                      </div>

                      <div className="flex items-center gap-4 text-right">
                        <LevelBadge points={user.points} size="sm" />
                        <div>
                          <p className="font-semibold">{user.points.toLocaleString()}</p>
                          <p className="text-xs text-muted-foreground">puntos</p>
                        </div>
                        <div className="flex items-center gap-1 text-addi-orange">
                          <Award className="w-4 h-4" />
                          <span className="font-medium">{user.badges_count}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-center text-muted-foreground py-8">No hay datos disponibles</p>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default Ranking;
