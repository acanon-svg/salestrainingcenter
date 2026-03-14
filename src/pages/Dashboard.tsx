import React from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import {
  BookOpen,
  Trophy,
  Award,
  Clock,
  Star,
  Calendar,
  AlertCircle,
} from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import addiTrainingLogo from "@/assets/addi-training-logo.svg";
import { LevelBadge } from "@/components/gamification/LevelBadge";
import { LevelCard } from "@/components/gamification/LevelCard";
import { getLevelProgress, getPointsToNextLevel } from "@/lib/userLevel";
import { AnnouncementBanner } from "@/components/announcements/AnnouncementBanner";
import { useAutoPublishScheduledCourses } from "@/hooks/useScheduledCourses";
import {
  useDashboardStats,
  useRecentCourses,
  usePendingCourses,
  useUserBadgesForDashboard,
} from "@/hooks/useDashboardStats";
import { useRankingCompetitor } from "@/hooks/useRanking";
import { Link } from "react-router-dom";
import AIDashboardInsights from "@/components/AIDashboardInsights";

const Dashboard: React.FC = () => {
  const { user, profile, roles } = useAuth();
  
  // Auto-publish scheduled courses when dashboard loads
  useAutoPublishScheduledCourses();

  // Real data from hooks
  const { data: stats, isLoading: statsLoading } = useDashboardStats();
  const { data: recentCourses, isLoading: recentLoading } = useRecentCourses(5);
  const { data: pendingCourses, isLoading: pendingLoading } = usePendingCourses(5);
  const { data: badges, isLoading: badgesLoading } = useUserBadgesForDashboard();
  const { data: competitor } = useRankingCompetitor(user?.id);

  const roleLabels: Record<string, string> = {
    student: "Estudiante",
    creator: "Creador",
    admin: "Administrador",
    lider: "Líder",
    analista: "Reporting & Data",
    qa: "Líder de Calidad",
  };

  return (
    <DashboardLayout>
      <div className="space-y-8 animate-fade-in">
        {/* Header with Logo */}
        <div className="flex items-center justify-between">
          <div className="flex flex-col gap-2">
            <h1 className="text-3xl font-bold text-foreground">
              ¡Hola, {profile?.full_name?.split(" ")[0] || "Usuario"}! 👋
            </h1>
            <p className="text-muted-foreground">
              {profile?.last_login
                ? `Último acceso: ${format(new Date(profile.last_login), "d 'de' MMMM, HH:mm", { locale: es })}`
                : "Bienvenido a Training Center"}
              <span className="ml-2 text-muted-foreground/50 text-sm italic">— by Alexandra Cañon</span>
            </p>
          </div>
          <img 
            src={addiTrainingLogo} 
            alt="Addi Training Center" 
            className="h-12 w-auto hidden md:block"
          />
        </div>

        {/* Announcements Banner */}
        <AnnouncementBanner />

        {/* Stats Grid */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card className="border-border/50 hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Cursos Completados
              </CardTitle>
              <BookOpen className="h-5 w-5 text-primary" />
            </CardHeader>
            <CardContent>
              {statsLoading ? (
                <Skeleton className="h-8 w-16" />
              ) : (
                <>
                  <div className="text-3xl font-bold">{stats?.completedCourses || 0}</div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {stats?.inProgressCourses || 0} en progreso
                  </p>
                </>
              )}
            </CardContent>
          </Card>

          <Card className="border-border/50 hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Calificación Promedio
              </CardTitle>
              <Star className="h-5 w-5 text-warning" />
            </CardHeader>
            <CardContent>
              {statsLoading ? (
                <Skeleton className="h-8 w-16" />
              ) : (
                <>
                  <div className="text-3xl font-bold">{stats?.averageScore || 0}%</div>
                  <Progress value={stats?.averageScore || 0} className="mt-2 h-2" />
                </>
              )}
            </CardContent>
          </Card>

          <Card className="border-border/50 hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Puntos Acumulados
              </CardTitle>
              <LevelBadge points={stats?.totalPoints || 0} size="sm" />
            </CardHeader>
            <CardContent>
              {statsLoading ? (
                <Skeleton className="h-8 w-20" />
              ) : (
                <>
                  <div className="text-3xl font-bold">{(stats?.totalPoints || 0).toLocaleString()}</div>
                  <div className="mt-2 space-y-1">
                    <Progress value={getLevelProgress(stats?.totalPoints || 0)} className="h-2" />
                    <p className="text-xs text-muted-foreground">
                      {getPointsToNextLevel(stats?.totalPoints || 0) 
                        ? `${getPointsToNextLevel(stats?.totalPoints || 0)?.toLocaleString()} pts para subir de nivel`
                        : "¡Nivel máximo!"}
                    </p>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          <Card className="border-border/50 hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Posición en Ranking
              </CardTitle>
              <Trophy className="h-5 w-5 text-primary" />
            </CardHeader>
            <CardContent>
              {statsLoading ? (
                <Skeleton className="h-8 w-16" />
              ) : (
                <>
                  <div className="text-3xl font-bold">
                    {stats?.rankingPosition ? `#${stats.rankingPosition}` : "-"}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    de {stats?.totalUsers || 0} usuarios
                  </p>
                  {competitor && competitor.pointsAhead > 0 && (
                    <p className="text-xs text-primary font-medium mt-2 animate-pulse">
                      🔥 ¡A {competitor.pointsAhead} pts de {competitor.name}!
                    </p>
                  )}
                  {stats?.rankingPosition === 1 && (
                    <p className="text-xs text-primary font-medium mt-2">
                      👑 ¡Eres el #1!
                    </p>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          {/* Recent Courses */}
          <Card className="border-border/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-primary" />
                Cursos Recientes
              </CardTitle>
              <CardDescription>Tu progreso en los últimos cursos</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {recentLoading ? (
                <div className="space-y-3">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="space-y-2">
                      <Skeleton className="h-4 w-3/4" />
                      <Skeleton className="h-2 w-full" />
                    </div>
                  ))}
                </div>
              ) : recentCourses && recentCourses.length > 0 ? (
                recentCourses.map((course) => (
                  <Link 
                    key={course.id} 
                    to={`/courses/${course.id}`}
                    className="block space-y-2 hover:bg-muted/50 rounded-lg p-2 -mx-2 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-sm">{course.name}</span>
                      {course.score !== null ? (
                        <Badge variant="secondary" className="bg-success/10 text-success">
                          {course.score}%
                        </Badge>
                      ) : (
                        <Badge variant="outline">{course.progress}%</Badge>
                      )}
                    </div>
                    <Progress value={course.progress} className="h-2" />
                  </Link>
                ))
              ) : (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <BookOpen className="h-10 w-10 text-muted-foreground/50 mb-2" />
                  <p className="text-sm text-muted-foreground">
                    No tienes cursos activos aún
                  </p>
                  <Link 
                    to="/courses" 
                    className="text-sm text-primary hover:underline mt-2"
                  >
                    Explorar cursos disponibles
                  </Link>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Pending Courses */}
          <Card className="border-border/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-primary" />
                Cursos Pendientes
              </CardTitle>
              <CardDescription>Cursos que aún no has completado</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {pendingLoading ? (
                <div className="space-y-3">
                  {[1, 2].map((i) => (
                    <Skeleton key={i} className="h-12 w-full" />
                  ))}
                </div>
              ) : pendingCourses && pendingCourses.length > 0 ? (
                pendingCourses.map((course) => {
                  const isExpiringSoon = course.expiresAt && 
                    new Date(course.expiresAt).getTime() - Date.now() < 7 * 24 * 60 * 60 * 1000;
                  
                  return (
                    <Link
                      key={course.id}
                      to={`/courses/${course.id}`}
                      className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-2 h-2 rounded-full ${
                            isExpiringSoon ? "bg-destructive" : 
                            course.progress > 0 ? "bg-warning" : "bg-muted-foreground"
                          }`}
                        />
                        <div>
                          <span className="font-medium text-sm block">{course.name}</span>
                          {course.progress > 0 && (
                            <span className="text-xs text-muted-foreground">
                              {course.progress}% completado
                            </span>
                          )}
                        </div>
                      </div>
                      {course.expiresAt && (
                        <span className={`text-xs ${isExpiringSoon ? "text-destructive" : "text-muted-foreground"}`}>
                          Vence: {format(new Date(course.expiresAt), "d MMM", { locale: es })}
                        </span>
                      )}
                    </Link>
                  );
                })
              ) : (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <AlertCircle className="h-10 w-10 text-muted-foreground/50 mb-2" />
                  <p className="text-sm text-muted-foreground">
                    ¡Estás al día! No tienes cursos pendientes
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* AI Dashboard Insights */}
        <AIDashboardInsights />

        {/* Level and Badges Row */}
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Level Card */}
          <LevelCard points={stats?.totalPoints || 0} />

          {/* Badges Section */}
          <Card className="border-border/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Award className="h-5 w-5 text-primary" />
                Mis Insignias
              </CardTitle>
              <CardDescription>
                {badgesLoading ? (
                  <Skeleton className="h-4 w-40" />
                ) : badges && badges.length > 0 ? (
                  `Has obtenido ${badges.filter((b) => b.earned).length} de ${badges.length} insignias`
                ) : (
                  "Aún no hay insignias disponibles"
                )}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {badgesLoading ? (
                <div className="flex flex-wrap gap-4">
                  {[1, 2, 3, 4].map((i) => (
                    <Skeleton key={i} className="h-20 w-20 rounded-xl" />
                  ))}
                </div>
              ) : badges && badges.length > 0 ? (
                <div className="flex flex-wrap gap-4">
                  {badges.slice(0, 8).map((badge) => (
                    <div
                      key={badge.id}
                      className={`flex flex-col items-center gap-2 p-4 rounded-xl border transition-all ${
                        badge.earned
                          ? "border-primary/20 bg-primary/5"
                          : "border-border opacity-40 grayscale"
                      }`}
                    >
                      <span className="text-3xl">{badge.icon || "🏅"}</span>
                      <span className="text-xs font-medium text-center max-w-[80px] truncate">
                        {badge.name}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <Award className="h-10 w-10 text-muted-foreground/50 mb-2" />
                  <p className="text-sm text-muted-foreground">
                    Las insignias se irán desbloqueando a medida que completes cursos
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Role indicators */}
        {roles.length > 0 && (
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm text-muted-foreground">Tus roles:</span>
            {roles.map((role) => (
              <Badge key={role} variant="secondary" className="capitalize">
                {roleLabels[role] || role}
              </Badge>
            ))}
          </div>
        )}

        {/* Footer con créditos */}
        <footer className="mt-12 pt-6 border-t border-border/30">
          <p className="text-center text-xs text-muted-foreground/60">
            © {new Date().getFullYear()} Addi Training Center · Todos los derechos reservados · Creado por Alexandra Cañon
          </p>
        </footer>
      </div>
    </DashboardLayout>
  );
};

export default Dashboard;
