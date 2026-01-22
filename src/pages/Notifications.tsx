import React, { useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Bell, BookOpen, Award, MessageSquare, CheckCircle, Clock, Trash2 } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";

// Mock notifications data
const mockNotifications = [
  {
    id: "1",
    title: "Nuevo curso disponible",
    message: "El curso 'Técnicas Avanzadas de Ventas' ya está disponible para ti.",
    type: "course",
    is_read: false,
    created_at: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
  },
  {
    id: "2",
    title: "¡Nueva insignia obtenida!",
    message: "Has desbloqueado la insignia 'Perfeccionista'. ¡Sigue así!",
    type: "badge",
    is_read: false,
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
  },
  {
    id: "3",
    title: "Curso por vencer",
    message: "El curso 'Compliance 2024' vence en 3 días. No olvides completarlo.",
    type: "course",
    is_read: true,
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
  },
  {
    id: "4",
    title: "Respuesta a tu feedback",
    message: "Tu sugerencia sobre el módulo de ventas ha sido implementada. ¡Gracias!",
    type: "feedback",
    is_read: true,
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString(),
  },
  {
    id: "5",
    title: "Subiste en el ranking",
    message: "¡Felicidades! Ahora estás en la posición #12 del ranking general.",
    type: "info",
    is_read: true,
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 72).toISOString(),
  },
];

const Notifications: React.FC = () => {
  const [notifications, setNotifications] = useState(mockNotifications);

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "course":
        return <BookOpen className="w-5 h-5 text-primary" />;
      case "badge":
        return <Award className="w-5 h-5 text-addi-yellow" />;
      case "feedback":
        return <MessageSquare className="w-5 h-5 text-success" />;
      default:
        return <Bell className="w-5 h-5 text-muted-foreground" />;
    }
  };

  const markAsRead = (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
    );
  };

  const markAllAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
  };

  const deleteNotification = (id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  const unreadNotifications = notifications.filter((n) => !n.is_read);
  const readNotifications = notifications.filter((n) => n.is_read);

  return (
    <DashboardLayout>
      <div className="space-y-8 animate-fade-in">
        {/* Header */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
              <Bell className="w-8 h-8 text-primary" />
              Notificaciones
            </h1>
            <p className="text-muted-foreground">
              Mantente al día con las novedades
            </p>
          </div>

          <div className="flex items-center gap-3">
            {unreadCount > 0 && (
              <Badge variant="destructive" className="gap-1">
                {unreadCount} sin leer
              </Badge>
            )}
            <Button variant="outline" onClick={markAllAsRead} disabled={unreadCount === 0}>
              <CheckCircle className="w-4 h-4 mr-2" />
              Marcar todo como leído
            </Button>
          </div>
        </div>

        {/* Notifications Tabs */}
        <Tabs defaultValue="all" className="w-full">
          <TabsList>
            <TabsTrigger value="all" className="gap-2">
              Todas
              <Badge variant="secondary" className="ml-1">
                {notifications.length}
              </Badge>
            </TabsTrigger>
            <TabsTrigger value="unread" className="gap-2">
              Sin leer
              {unreadCount > 0 && (
                <Badge variant="destructive" className="ml-1">
                  {unreadCount}
                </Badge>
              )}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="mt-6">
            <NotificationsList
              notifications={notifications}
              onMarkAsRead={markAsRead}
              onDelete={deleteNotification}
              getTypeIcon={getTypeIcon}
            />
          </TabsContent>

          <TabsContent value="unread" className="mt-6">
            {unreadNotifications.length > 0 ? (
              <NotificationsList
                notifications={unreadNotifications}
                onMarkAsRead={markAsRead}
                onDelete={deleteNotification}
                getTypeIcon={getTypeIcon}
              />
            ) : (
              <Card className="border-dashed">
                <CardContent className="flex flex-col items-center justify-center py-16">
                  <CheckCircle className="w-12 h-12 text-success mb-4" />
                  <h3 className="font-semibold text-lg">¡Todo al día!</h3>
                  <p className="text-muted-foreground text-sm">
                    No tienes notificaciones sin leer
                  </p>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
};

interface NotificationsListProps {
  notifications: typeof mockNotifications;
  onMarkAsRead: (id: string) => void;
  onDelete: (id: string) => void;
  getTypeIcon: (type: string) => React.ReactNode;
}

const NotificationsList: React.FC<NotificationsListProps> = ({
  notifications,
  onMarkAsRead,
  onDelete,
  getTypeIcon,
}) => {
  return (
    <div className="space-y-3">
      {notifications.map((notification) => (
        <Card
          key={notification.id}
          className={`transition-all ${
            notification.is_read
              ? "border-border/50 bg-background"
              : "border-primary/30 bg-primary/5"
          }`}
        >
          <CardContent className="p-4">
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 mt-1">{getTypeIcon(notification.type)}</div>

              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h3 className="font-medium">{notification.title}</h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      {notification.message}
                    </p>
                  </div>
                  <span className="text-xs text-muted-foreground flex-shrink-0 flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {formatDistanceToNow(new Date(notification.created_at), {
                      addSuffix: true,
                      locale: es,
                    })}
                  </span>
                </div>

                <div className="flex items-center gap-2 mt-3">
                  {!notification.is_read && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onMarkAsRead(notification.id)}
                    >
                      <CheckCircle className="w-4 h-4 mr-1" />
                      Marcar como leído
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-destructive hover:text-destructive"
                    onClick={() => onDelete(notification.id)}
                  >
                    <Trash2 className="w-4 h-4 mr-1" />
                    Eliminar
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default Notifications;
