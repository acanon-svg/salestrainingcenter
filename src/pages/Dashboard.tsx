import React from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  BookOpen,
  Trophy,
  Award,
  Clock,
  TrendingUp,
  Star,
  Calendar,
} from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";

const Dashboard: React.FC = () => {
  const { profile, roles } = useAuth();

  // Mock data - will be replaced with real data from the database
  const stats = {
    completedCourses: 12,
    averageScore: 85,
    totalPoints: profile?.points || 0,
    badgesCount: profile?.badges_count || 0,
    pendingCourses: 3,
    rankingPosition: 15,
    totalTeamMembers: 120,
  };

  const recentCourses = [
    { id: 1, name: "Onboarding Ventas", progress: 100, score: 92, completedAt: new Date() },
    { id: 2, name: "Técnicas de Negociación", progress: 75, score: null, completedAt: null },
    { id: 3, name: "Manejo de Objeciones", progress: 30, score: null, completedAt: null },
  ];

  const pendingCourses = [
    { id: 4, name: "Actualización de Producto", dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), priority: "high" },
    { id: 5, name: "Compliance 2024", dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), priority: "medium" },
  ];

  const badges = [
    { id: 1, name: "Primer Curso", icon: "🎓", earned: true },
    { id: 2, name: "Racha de 5", icon: "🔥", earned: true },
    { id: 3, name: "Perfeccionista", icon: "⭐", earned: false },
    { id: 4, name: "Velocista", icon: "⚡", earned: true },
  ];

  return (
    <DashboardLayout>
      <div className="space-y-8 animate-fade-in">
        {/* Header */}
        <div className="flex flex-col gap-2">
          <h1 className="text-3xl font-bold text-foreground">
            ¡Hola, {profile?.full_name?.split(" ")[0] || "Usuario"}! 👋
          </h1>
          <p className="text-muted-foreground">
            {profile?.last_login
              ? `Último acceso: ${format(new Date(profile.last_login), "d 'de' MMMM, HH:mm", { locale: es })}`
              : "Bienvenido a Training Center"}
          </p>
        </div>

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
              <div className="text-3xl font-bold">{stats.completedCourses}</div>
              <p className="text-xs text-muted-foreground mt-1">
                +3 este mes
              </p>
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
              <div className="text-3xl font-bold">{stats.averageScore}%</div>
              <Progress value={stats.averageScore} className="mt-2 h-2" />
            </CardContent>
          </Card>

          <Card className="border-border/50 hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Puntos Acumulados
              </CardTitle>
              <TrendingUp className="h-5 w-5 text-success" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stats.totalPoints.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground mt-1">
                Nivel: Avanzado
              </p>
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
              <div className="text-3xl font-bold">#{stats.rankingPosition}</div>
              <p className="text-xs text-muted-foreground mt-1">
                de {stats.totalTeamMembers} miembros
              </p>
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
              {recentCourses.map((course) => (
                <div key={course.id} className="space-y-2">
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
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Pending Courses */}
          <Card className="border-border/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-primary" />
                Cursos Pendientes
              </CardTitle>
              <CardDescription>No olvides completarlos a tiempo</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {pendingCourses.map((course) => (
                <div
                  key={course.id}
                  className="flex items-center justify-between p-3 rounded-lg bg-muted/50"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-2 h-2 rounded-full ${
                        course.priority === "high" ? "bg-destructive" : "bg-warning"
                      }`}
                    />
                    <span className="font-medium text-sm">{course.name}</span>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    Vence: {format(course.dueDate, "d MMM", { locale: es })}
                  </span>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Badges Section */}
        <Card className="border-border/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Award className="h-5 w-5 text-primary" />
              Mis Insignias
            </CardTitle>
            <CardDescription>
              Has obtenido {badges.filter((b) => b.earned).length} de {badges.length} insignias
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-4">
              {badges.map((badge) => (
                <div
                  key={badge.id}
                  className={`flex flex-col items-center gap-2 p-4 rounded-xl border transition-all ${
                    badge.earned
                      ? "border-primary/20 bg-primary/5"
                      : "border-border opacity-40 grayscale"
                  }`}
                >
                  <span className="text-3xl">{badge.icon}</span>
                  <span className="text-xs font-medium text-center">{badge.name}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Role indicators */}
        {roles.length > 0 && (
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Tus roles:</span>
            {roles.map((role) => (
              <Badge key={role} variant="secondary" className="capitalize">
                {role === "student" ? "Estudiante" : role === "creator" ? "Creador" : "Administrador"}
              </Badge>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default Dashboard;
