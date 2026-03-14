import React, { useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { useAuth } from "@/contexts/AuthContext";
import { useRankingByRoleType, useAvailableTeamsForRanking, RankingUser } from "@/hooks/useRanking";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Trophy, Medal, Award, TrendingUp, Crown, Star, Users, UserCheck,
  Filter, Brain, Sparkles, Lightbulb, Zap, Target,
} from "lucide-react";
import { LevelBadge } from "@/components/gamification/LevelBadge";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface RankingAnalysis {
  leaderInsight: string;
  competitionNote: string;
  risingStars: string[];
  teamTrend: string;
  personalTip: string;
}

const Ranking: React.FC = () => {
  const { profile, hasRole } = useAuth();
  const [activeTab, setActiveTab] = useState<"students" | "leaders">("students");
  const [analysis, setAnalysis] = useState<RankingAnalysis | null>(null);
  const [analyzing, setAnalyzing] = useState(false);

  const canFilterByTeam = hasRole("admin") || hasRole("creator") || hasRole("analista");
  const { data: availableTeams } = useAvailableTeamsForRanking();

  const [teamFilter, setTeamFilter] = useState<string>(() => {
    if (canFilterByTeam) return "all";
    return profile?.team || "all";
  });

  const { data: studentsRanking, isLoading: studentsLoading } = useRankingByRoleType(
    "students_only",
    teamFilter !== "all" ? teamFilter : undefined
  );
  const { data: leadersRanking, isLoading: leadersLoading } = useRankingByRoleType(
    "leaders",
    canFilterByTeam ? teamFilter : undefined
  );

  const studentsByTeam = React.useMemo(() => {
    if (!studentsRanking || teamFilter !== "all") return null;
    const grouped: Record<string, RankingUser[]> = {};
    studentsRanking.forEach((user) => {
      const team = user.team || "Sin equipo";
      if (!grouped[team]) grouped[team] = [];
      grouped[team].push(user);
    });
    Object.values(grouped).forEach((users) =>
      users.sort((a, b) => (b.compositeScore || 0) - (a.compositeScore || 0))
    );
    return grouped;
  }, [studentsRanking, teamFilter]);

  const currentRanking = activeTab === "students" ? studentsRanking : leadersRanking;
  const isLoading = activeTab === "students" ? studentsLoading : leadersLoading;

  const currentUserIndex = currentRanking?.findIndex((r) => r.user_id === profile?.user_id) ?? -1;
  const currentPosition = currentUserIndex >= 0 ? currentUserIndex + 1 : null;

  const maxComposite = currentRanking?.[0]?.compositeScore || 1;

  const analyzeWithAI = async () => {
    const ranking = currentRanking;
    if (!ranking || ranking.length === 0) {
      toast.error("No hay datos de ranking para analizar");
      return;
    }
    setAnalyzing(true);
    try {
      const topUsers = ranking.slice(0, 5).map((u) => ({
        name: u.full_name || "Usuario",
        compositeScore: u.compositeScore || 0,
        completedCourses: u.completedCourses || 0,
        avgQuiz: u.avgQuizScore || 0,
        badges: u.badges_count,
      }));

      const { data, error } = await supabase.functions.invoke("analyze-ranking", {
        body: { topUsers },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      setAnalysis(data);
    } catch (err: any) {
      toast.error(err.message || "Error analizando ranking");
    } finally {
      setAnalyzing(false);
    }
  };

  const getPositionIcon = (position: number) => {
    switch (position) {
      case 1: return <Crown className="w-6 h-6 text-amber-500" />;
      case 2: return <Medal className="w-6 h-6 text-muted-foreground" />;
      case 3: return <Trophy className="w-6 h-6 text-amber-600" />;
      default: return null;
    }
  };

  const getInitials = (name: string | null) => {
    if (!name) return "??";
    return name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
  };

  const renderPodium = (ranking: RankingUser[] | undefined) => {
    if (!ranking || ranking.length === 0) {
      return (
        <Card>
          <CardContent className="py-12 text-center">
            <Trophy className="w-12 h-12 text-muted-foreground/50 mx-auto mb-4" />
            <p className="text-muted-foreground">Aún no hay usuarios en este ranking</p>
          </CardContent>
        </Card>
      );
    }

    const top3 = ranking.slice(0, 3);
    // Display order: 2nd, 1st, 3rd for visual podium
    const podiumOrder = top3.length >= 3
      ? [top3[1], top3[0], top3[2]]
      : top3;
    const heights = top3.length >= 3
      ? ["h-32", "h-40", "h-24"]
      : top3.map(() => "h-32");
    const positions = top3.length >= 3 ? [2, 1, 3] : top3.map((_, i) => i + 1);

    return (
      <div className="flex items-end justify-center gap-3 md:gap-6 py-6">
        {podiumOrder.map((user, i) => {
          const pos = positions[i];
          const borderColor = pos === 1
            ? "border-amber-500 ring-amber-500/20"
            : pos === 2
              ? "border-muted-foreground/50 ring-muted-foreground/10"
              : "border-amber-600 ring-amber-600/20";

          return (
            <div key={user.id} className="flex flex-col items-center gap-2">
              <div className="relative">
                {pos === 1 && (
                  <Crown className="absolute -top-5 left-1/2 -translate-x-1/2 w-8 h-8 text-amber-500 drop-shadow" />
                )}
                <Avatar className={`w-16 h-16 md:w-20 md:h-20 border-4 ring-4 ${borderColor} shadow-lg`}>
                  <AvatarImage src={user.avatar_url || undefined} />
                  <AvatarFallback className="text-lg bg-primary/10 text-primary">
                    {getInitials(user.full_name)}
                  </AvatarFallback>
                </Avatar>
              </div>
              <h3 className="font-semibold text-sm md:text-base text-center max-w-[100px] truncate">
                {user.full_name || "Usuario"}
              </h3>
              <p className="text-xs text-muted-foreground">{user.team || "Sin equipo"}</p>
              <LevelBadge points={user.points} size="sm" />
              <div className="text-center">
                <span className="text-lg font-bold text-primary">{user.compositeScore?.toLocaleString()}</span>
                <p className="text-[10px] text-muted-foreground">puntos compuestos</p>
              </div>
              <div className={`w-20 md:w-28 ${heights[i]} rounded-t-xl flex items-center justify-center ${
                pos === 1
                  ? "bg-gradient-to-t from-amber-500/30 to-amber-500/10"
                  : pos === 2
                    ? "bg-gradient-to-t from-muted/60 to-muted/20"
                    : "bg-gradient-to-t from-amber-600/20 to-amber-600/5"
              }`}>
                <span className="text-3xl font-bold text-muted-foreground/70">#{pos}</span>
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  const renderRankingTable = (ranking: RankingUser[] | undefined) => {
    if (!ranking || ranking.length === 0) {
      return <p className="text-center text-muted-foreground py-8">No hay datos disponibles</p>;
    }

    return (
      <div className="space-y-2">
        {ranking.map((user, index) => {
          const position = index + 1;
          const isCurrentUser = user.user_id === profile?.user_id;
          const progressPercent = maxComposite > 0
            ? Math.round(((user.compositeScore || 0) / maxComposite) * 100)
            : 0;

          return (
            <div
              key={user.id}
              className={`flex items-center gap-3 md:gap-4 p-3 rounded-lg transition-colors ${
                isCurrentUser
                  ? "bg-primary/10 border-2 border-primary/30 shadow-sm"
                  : "hover:bg-muted/50"
              }`}
            >
              <div className="w-8 text-center shrink-0">
                {position <= 3 ? (
                  getPositionIcon(position)
                ) : (
                  <span className="text-base font-semibold text-muted-foreground">{position}</span>
                )}
              </div>

              <Avatar className="w-9 h-9 shrink-0">
                <AvatarImage src={user.avatar_url || undefined} />
                <AvatarFallback className="text-xs">{getInitials(user.full_name)}</AvatarFallback>
              </Avatar>

              <div className="flex-1 min-w-0 space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-sm truncate">
                    {user.full_name || "Usuario"}
                  </span>
                  {isCurrentUser && (
                    <Badge variant="secondary" className="text-[10px] px-1.5 py-0">Tú</Badge>
                  )}
                  <span className="text-xs text-muted-foreground hidden sm:inline">
                    {user.team || "Sin equipo"}
                  </span>
                </div>
                <Progress value={progressPercent} className="h-1.5" />
              </div>

              <div className="flex items-center gap-3 text-right shrink-0">
                <LevelBadge points={user.points} size="sm" />
                <div className="text-right">
                  <p className="font-bold text-sm">{user.compositeScore?.toLocaleString()}</p>
                  <p className="text-[10px] text-muted-foreground">compuesto</p>
                </div>
                <div className="flex items-center gap-1 text-primary">
                  <Award className="w-3.5 h-3.5" />
                  <span className="text-sm font-medium">{user.badges_count}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  const renderAnalysis = () => {
    if (!analysis) return null;

    const cards = [
      { title: "Líder del Ranking", content: analysis.leaderInsight, icon: Crown, color: "bg-amber-500/10 border-amber-500/30 text-amber-700 dark:text-amber-400" },
      { title: "Nota de Competencia", content: analysis.competitionNote, icon: Target, color: "bg-blue-500/10 border-blue-500/30 text-blue-700 dark:text-blue-400" },
      { title: "Tendencia del Equipo", content: analysis.teamTrend, icon: TrendingUp, color: "bg-emerald-500/10 border-emerald-500/30 text-emerald-700 dark:text-emerald-400" },
      { title: "Tip Personal", content: analysis.personalTip, icon: Lightbulb, color: "bg-purple-500/10 border-purple-500/30 text-purple-700 dark:text-purple-400" },
    ];

    return (
      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {cards.map((card, i) => (
            <div key={i} className={`p-4 rounded-xl border ${card.color}`}>
              <div className="flex items-center gap-2 mb-2">
                <card.icon className="h-4 w-4" />
                <span className="font-semibold text-sm">{card.title}</span>
              </div>
              <p className="text-sm">{card.content}</p>
            </div>
          ))}
        </div>

        {analysis.risingStars.length > 0 && (
          <div className="flex items-center gap-2 flex-wrap">
            <Zap className="h-4 w-4 text-amber-500" />
            <span className="text-sm font-medium text-muted-foreground">Estrellas en ascenso:</span>
            {analysis.risingStars.map((name, i) => (
              <Badge key={i} variant="secondary" className="bg-amber-500/10 text-amber-700 dark:text-amber-400">
                ⭐ {name}
              </Badge>
            ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <DashboardLayout>
      <div className="space-y-8 animate-fade-in">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
              <Trophy className="w-8 h-8 text-primary" />
              Ranking
            </h1>
            <p className="text-muted-foreground">
              Clasificación por puntuación compuesta del equipo - by Alexandra Cañon
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <Button
              onClick={analyzeWithAI}
              disabled={analyzing || isLoading}
              variant="outline"
              size="sm"
              className="gap-2"
            >
              <Brain className="h-4 w-4" />
              {analyzing ? "Analizando..." : "Analizar con IA"}
            </Button>

            {canFilterByTeam && (
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4 text-muted-foreground" />
                <Select value={teamFilter} onValueChange={setTeamFilter}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Filtrar por equipo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos los equipos</SelectItem>
                    {availableTeams?.map((team) => (
                      <SelectItem key={team} value={team}>{team}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
        </div>

        {/* AI Analysis */}
        {(analysis || analyzing) && (
          <Card className="border-border/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Sparkles className="h-5 w-5 text-primary" />
                Análisis IA del Ranking
              </CardTitle>
              <CardDescription>Insights generados por inteligencia artificial</CardDescription>
            </CardHeader>
            <CardContent>
              {analyzing ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-24 w-full" />)}
                </div>
              ) : (
                renderAnalysis()
              )}
            </CardContent>
          </Card>
        )}

        {/* User Position */}
        {currentPosition && (
          <Card className="border-primary/30 bg-gradient-to-r from-primary/5 to-transparent">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/10">
                    <span className="text-2xl font-bold text-primary">#{currentPosition}</span>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">
                      Tu posición en {activeTab === "students" ? "Estudiantes" : "Líderes"}
                    </p>
                    <p className="text-xl font-semibold">{profile?.full_name || "Usuario"}</p>
                    <p className="text-sm text-muted-foreground">{profile?.team || "Sin equipo"}</p>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <LevelBadge points={profile?.points || 0} size="md" />
                  <div className="flex items-center gap-2">
                    <Star className="w-5 h-5 text-primary" />
                    <span className="text-2xl font-bold">
                      {currentRanking?.[currentUserIndex]?.compositeScore?.toLocaleString() || 0}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground">puntos compuestos</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "students" | "leaders")}>
          <TabsList className="grid w-full max-w-md grid-cols-2">
            <TabsTrigger value="students" className="gap-2">
              <Users className="h-4 w-4" />
              Estudiantes ({studentsRanking?.length || 0})
            </TabsTrigger>
            <TabsTrigger value="leaders" className="gap-2">
              <UserCheck className="h-4 w-4" />
              Líderes ({leadersRanking?.length || 0})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="students" className="space-y-6 mt-6">
            {studentsLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => <Skeleton key={i} className="h-20 w-full" />)}
              </div>
            ) : teamFilter !== "all" ? (
              <>
                {renderPodium(studentsRanking)}
                <Card className="border-border/50">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <TrendingUp className="w-5 h-5 text-primary" />
                      Ranking Completo - {teamFilter}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>{renderRankingTable(studentsRanking)}</CardContent>
                </Card>
              </>
            ) : studentsByTeam ? (
              Object.entries(studentsByTeam)
                .sort(([a], [b]) => a.localeCompare(b))
                .map(([team, users]) => (
                  <Card key={team} className="border-border/50">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Users className="w-5 h-5 text-primary" />
                        {team}
                        <Badge variant="secondary" className="ml-2">{users.length} estudiantes</Badge>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      {renderPodium(users)}
                      <div className="mt-4">{renderRankingTable(users)}</div>
                    </CardContent>
                  </Card>
                ))
            ) : (
              <Card>
                <CardContent className="py-12 text-center">
                  <Trophy className="w-12 h-12 text-muted-foreground/50 mx-auto mb-4" />
                  <p className="text-muted-foreground">No hay datos disponibles</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="leaders" className="space-y-6 mt-6">
            {leadersLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => <Skeleton key={i} className="h-20 w-full" />)}
              </div>
            ) : (
              <>
                {renderPodium(leadersRanking)}
                <Card className="border-border/50">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <TrendingUp className="w-5 h-5 text-primary" />
                      Ranking de Líderes
                      {teamFilter !== "all" && (
                        <Badge variant="secondary" className="ml-2">{teamFilter}</Badge>
                      )}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {renderRankingTable(leadersRanking)}
                  </CardContent>
                </Card>
              </>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
};

export default Ranking;
