import React from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Trophy, Medal, Award, TrendingUp, Crown, Star } from "lucide-react";

// Mock data - will be replaced with real data from database
const mockRanking = [
  { id: 1, name: "María García", team: "Ventas Norte", points: 2450, badges: 12, avatar: null },
  { id: 2, name: "Carlos Rodríguez", team: "Ventas Centro", points: 2320, badges: 10, avatar: null },
  { id: 3, name: "Ana Martínez", team: "Ventas Sur", points: 2180, badges: 11, avatar: null },
  { id: 4, name: "Juan López", team: "Ventas Norte", points: 2050, badges: 9, avatar: null },
  { id: 5, name: "Laura Sánchez", team: "Ventas Centro", points: 1980, badges: 8, avatar: null },
  { id: 6, name: "Pedro Hernández", team: "Ventas Sur", points: 1850, badges: 7, avatar: null },
  { id: 7, name: "Sofia Castro", team: "Ventas Norte", points: 1720, badges: 6, avatar: null },
  { id: 8, name: "Diego Vargas", team: "Ventas Centro", points: 1650, badges: 6, avatar: null },
  { id: 9, name: "Valentina Torres", team: "Ventas Sur", points: 1580, badges: 5, avatar: null },
  { id: 10, name: "Andrés Ruiz", team: "Ventas Norte", points: 1520, badges: 5, avatar: null },
];

const Ranking: React.FC = () => {
  const { profile } = useAuth();

  const getPositionIcon = (position: number) => {
    switch (position) {
      case 1:
        return <Crown className="w-6 h-6 text-addi-yellow" />;
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
        return "bg-gradient-to-r from-addi-yellow/20 to-transparent border-addi-yellow/30";
      case 2:
        return "bg-gradient-to-r from-muted/50 to-transparent border-muted-foreground/20";
      case 3:
        return "bg-gradient-to-r from-amber-100/50 to-transparent border-amber-600/20 dark:from-amber-900/20";
      default:
        return "border-border/50";
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  // Find current user in ranking
  const currentUserRanking = mockRanking.find(
    (r) => r.name === profile?.full_name
  );
  const currentPosition = currentUserRanking
    ? mockRanking.indexOf(currentUserRanking) + 1
    : 15;

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
                  <span className="text-2xl font-bold text-primary">#{currentPosition}</span>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Tu posición actual</p>
                  <p className="text-xl font-semibold">{profile?.full_name || "Usuario"}</p>
                  <p className="text-sm text-muted-foreground">{profile?.team || "Equipo"}</p>
                </div>
              </div>
              <div className="text-right">
                <div className="flex items-center gap-2 justify-end">
                  <Star className="w-5 h-5 text-addi-yellow" />
                  <span className="text-2xl font-bold">{profile?.points?.toLocaleString() || 0}</span>
                </div>
                <p className="text-sm text-muted-foreground">puntos</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Top 3 Podium */}
        <div className="grid gap-4 md:grid-cols-3">
          {mockRanking.slice(0, 3).map((user, index) => {
            const position = index + 1;
            return (
              <Card
                key={user.id}
                className={`relative overflow-hidden ${getPositionStyle(position)}`}
              >
                <div className="absolute top-3 right-3">{getPositionIcon(position)}</div>
                <CardContent className="pt-6 text-center">
                  <Avatar className="w-20 h-20 mx-auto mb-4 border-4 border-background shadow-lg">
                    <AvatarImage src={user.avatar || undefined} />
                    <AvatarFallback className="text-xl bg-primary/10 text-primary">
                      {getInitials(user.name)}
                    </AvatarFallback>
                  </Avatar>
                  <h3 className="font-semibold text-lg">{user.name}</h3>
                  <p className="text-sm text-muted-foreground mb-3">{user.team}</p>
                  <div className="flex justify-center gap-4">
                    <div className="text-center">
                      <p className="text-2xl font-bold text-primary">
                        {user.points.toLocaleString()}
                      </p>
                      <p className="text-xs text-muted-foreground">puntos</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold text-addi-yellow">{user.badges}</p>
                      <p className="text-xs text-muted-foreground">insignias</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Full Ranking Table */}
        <Card className="border-border/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-primary" />
              Tabla de Posiciones
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {mockRanking.map((user, index) => {
                const position = index + 1;
                const isCurrentUser = user.name === profile?.full_name;

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
                      <AvatarImage src={user.avatar || undefined} />
                      <AvatarFallback className="text-sm">
                        {getInitials(user.name)}
                      </AvatarFallback>
                    </Avatar>

                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">
                        {user.name}
                        {isCurrentUser && (
                          <Badge variant="secondary" className="ml-2 text-xs">
                            Tú
                          </Badge>
                        )}
                      </p>
                      <p className="text-sm text-muted-foreground">{user.team}</p>
                    </div>

                    <div className="flex items-center gap-4 text-right">
                      <div>
                        <p className="font-semibold">{user.points.toLocaleString()}</p>
                        <p className="text-xs text-muted-foreground">puntos</p>
                      </div>
                      <div className="flex items-center gap-1 text-addi-yellow">
                        <Award className="w-4 h-4" />
                        <span className="font-medium">{user.badges}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default Ranking;
