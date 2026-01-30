import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useAvailableTeams } from "@/hooks/useCourseTargeting";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Megaphone,
  Plus,
  Edit,
  Trash2,
  Video,
  Calendar,
  Users,
  Trophy,
  Eye,
  X,
  Loader2,
  Link2,
} from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { AnnouncementImageUpload } from "./AnnouncementImageUpload";

interface Announcement {
  id: string;
  title: string;
  content: string | null;
  image_url: string | null;
  video_url: string | null;
  type: string;
  target_teams: string[] | null;
  points_for_viewing: number | null;
  starts_at: string;
  expires_at: string | null;
  created_by: string | null;
  created_at: string;
  course_link: string | null;
}

interface AnnouncementFormData {
  title: string;
  content: string;
  image_url: string;
  video_url: string;
  type: string;
  target_teams: string[];
  points_for_viewing: number;
  starts_at: string;
  expires_at: string;
  course_link: string;
}

const defaultFormData: AnnouncementFormData = {
  title: "",
  content: "",
  image_url: "",
  video_url: "",
  type: "banner",
  target_teams: [],
  points_for_viewing: 0,
  starts_at: new Date().toISOString().slice(0, 16),
  expires_at: "",
  course_link: "",
};

export const AnnouncementManager: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isOpen, setIsOpen] = useState(false);
  const [editingAnnouncement, setEditingAnnouncement] = useState<Announcement | null>(null);
  const [formData, setFormData] = useState<AnnouncementFormData>(defaultFormData);

  const { data: availableTeams = [], isLoading: teamsLoading } = useAvailableTeams();

  // Fetch all announcements (for management)
  const { data: announcements = [], isLoading } = useQuery({
    queryKey: ["all-announcements"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("announcements")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as Announcement[];
    },
  });

  // Fetch view counts for each announcement
  const { data: viewCounts = {} } = useQuery({
    queryKey: ["announcement-view-counts"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("announcement_views")
        .select("announcement_id");

      if (error) throw error;

      const counts: Record<string, number> = {};
      data.forEach((view) => {
        counts[view.announcement_id] = (counts[view.announcement_id] || 0) + 1;
      });
      return counts;
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: AnnouncementFormData) => {
      const { error } = await supabase.from("announcements").insert({
        title: data.title,
        content: data.content || null,
        image_url: data.image_url || null,
        video_url: data.video_url || null,
        type: data.type,
        target_teams: data.target_teams.length > 0 ? data.target_teams : null,
        points_for_viewing: data.points_for_viewing || 0,
        starts_at: data.starts_at,
        expires_at: data.expires_at || null,
        created_by: user?.id,
        course_link: data.course_link || null,
      });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["all-announcements"] });
      queryClient.invalidateQueries({ queryKey: ["announcements"] });
      toast({ title: "Anuncio creado", description: "El anuncio se ha publicado correctamente." });
      handleCloseDialog();
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: AnnouncementFormData }) => {
      const { error } = await supabase
        .from("announcements")
        .update({
          title: data.title,
          content: data.content || null,
          image_url: data.image_url || null,
          video_url: data.video_url || null,
          type: data.type,
          target_teams: data.target_teams.length > 0 ? data.target_teams : null,
          points_for_viewing: data.points_for_viewing || 0,
          starts_at: data.starts_at,
          expires_at: data.expires_at || null,
          course_link: data.course_link || null,
        })
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["all-announcements"] });
      queryClient.invalidateQueries({ queryKey: ["announcements"] });
      toast({ title: "Anuncio actualizado", description: "Los cambios se han guardado." });
      handleCloseDialog();
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("announcements").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["all-announcements"] });
      queryClient.invalidateQueries({ queryKey: ["announcements"] });
      toast({ title: "Anuncio eliminado", description: "El anuncio ha sido eliminado." });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const handleOpenCreate = () => {
    setEditingAnnouncement(null);
    setFormData(defaultFormData);
    setIsOpen(true);
  };

  const handleOpenEdit = (announcement: Announcement) => {
    setEditingAnnouncement(announcement);
    setFormData({
      title: announcement.title,
      content: announcement.content || "",
      image_url: announcement.image_url || "",
      video_url: announcement.video_url || "",
      type: announcement.type,
      target_teams: announcement.target_teams || [],
      points_for_viewing: announcement.points_for_viewing || 0,
      starts_at: announcement.starts_at.slice(0, 16),
      expires_at: announcement.expires_at?.slice(0, 16) || "",
      course_link: announcement.course_link || "",
    });
    setIsOpen(true);
  };

  const handleCloseDialog = () => {
    setIsOpen(false);
    setEditingAnnouncement(null);
    setFormData(defaultFormData);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title) {
      toast({ title: "Error", description: "El título es requerido", variant: "destructive" });
      return;
    }

    if (editingAnnouncement) {
      updateMutation.mutate({ id: editingAnnouncement.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const handleToggleTeam = (team: string) => {
    setFormData((prev) => ({
      ...prev,
      target_teams: prev.target_teams.includes(team)
        ? prev.target_teams.filter((t) => t !== team)
        : [...prev.target_teams, team],
    }));
  };

  const isActive = (announcement: Announcement) => {
    const now = new Date();
    const startsAt = new Date(announcement.starts_at);
    const expiresAt = announcement.expires_at ? new Date(announcement.expires_at) : null;
    return startsAt <= now && (!expiresAt || expiresAt > now);
  };

  const isPending = createMutation.isPending || updateMutation.isPending;

  return (
    <Card className="border-border/50">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Megaphone className="h-5 w-5 text-primary" />
              Gestión de Anuncios
            </CardTitle>
            <CardDescription>
              Crea y administra banners y comunicaciones para el equipo
            </CardDescription>
          </div>
          <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
              <Button onClick={handleOpenCreate}>
                <Plus className="h-4 w-4 mr-2" />
                Nuevo Anuncio
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>
                  {editingAnnouncement ? "Editar Anuncio" : "Crear Nuevo Anuncio"}
                </DialogTitle>
                <DialogDescription>
                  {editingAnnouncement
                    ? "Modifica los detalles del anuncio"
                    : "Crea un nuevo banner o comunicación para el dashboard"}
                </DialogDescription>
              </DialogHeader>

              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Title */}
                <div className="space-y-2">
                  <Label htmlFor="title">Título *</Label>
                  <Input
                    id="title"
                    placeholder="Título del anuncio"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  />
                </div>

                {/* Content */}
                <div className="space-y-2">
                  <Label htmlFor="content">Contenido</Label>
                  <Textarea
                    id="content"
                    placeholder="Descripción o mensaje del anuncio..."
                    rows={3}
                    value={formData.content}
                    onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                  />
                </div>

                {/* Image Upload */}
                <AnnouncementImageUpload
                  currentImageUrl={formData.image_url}
                  onImageChange={(url) => setFormData({ ...formData, image_url: url })}
                />

                {/* Video URL */}
                <div className="space-y-2">
                  <Label htmlFor="video_url" className="flex items-center gap-2">
                    <Video className="h-4 w-4" />
                    URL de Video (opcional)
                  </Label>
                  <Input
                    id="video_url"
                    placeholder="https://youtube.com/..."
                    value={formData.video_url}
                    onChange={(e) => setFormData({ ...formData, video_url: e.target.value })}
                  />
                </div>

                {/* Course Link */}
                <div className="space-y-2">
                  <Label htmlFor="course_link" className="flex items-center gap-2">
                    <Link2 className="h-4 w-4" />
                    Link del Curso
                  </Label>
                  <Input
                    id="course_link"
                    placeholder="https://salestrainingcenter.lovable.app/courses/..."
                    value={formData.course_link}
                    onChange={(e) => setFormData({ ...formData, course_link: e.target.value })}
                  />
                  <p className="text-xs text-muted-foreground">
                    Pega el link universal del curso. Al hacer clic en el anuncio, el usuario será redirigido a este curso.
                  </p>
                </div>

                {/* Dates */}
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="starts_at" className="flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      Fecha de Inicio *
                    </Label>
                    <Input
                      id="starts_at"
                      type="datetime-local"
                      value={formData.starts_at}
                      onChange={(e) => setFormData({ ...formData, starts_at: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="expires_at" className="flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      Fecha de Expiración
                    </Label>
                    <Input
                      id="expires_at"
                      type="datetime-local"
                      value={formData.expires_at}
                      onChange={(e) => setFormData({ ...formData, expires_at: e.target.value })}
                    />
                  </div>
                </div>

                {/* Points */}
                <div className="space-y-2">
                  <Label htmlFor="points" className="flex items-center gap-2">
                    <Trophy className="h-4 w-4" />
                    Puntos por Visualización
                  </Label>
                  <Input
                    id="points"
                    type="number"
                    min="0"
                    value={formData.points_for_viewing}
                    onChange={(e) =>
                      setFormData({ ...formData, points_for_viewing: parseInt(e.target.value) || 0 })
                    }
                  />
                  <p className="text-xs text-muted-foreground">
                    Puntos que el usuario recibirá al ver este anuncio
                  </p>
                </div>

                {/* Target Teams */}
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    Equipos Destinatarios
                  </Label>
                  <p className="text-xs text-muted-foreground mb-2">
                    Deja vacío para mostrar a todos los equipos
                  </p>
                  {formData.target_teams.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-2">
                      {formData.target_teams.map((team) => (
                        <Badge key={team} variant="secondary" className="gap-1">
                          {team}
                          <button type="button" onClick={() => handleToggleTeam(team)}>
                            <X className="h-3 w-3" />
                          </button>
                        </Badge>
                      ))}
                    </div>
                  )}
                  <ScrollArea className="h-32 border rounded-md p-2">
                    {teamsLoading ? (
                      <Skeleton className="h-20 w-full" />
                    ) : (
                      <div className="space-y-2">
                        {availableTeams.map((team) => (
                          <div key={team} className="flex items-center gap-2">
                            <Checkbox
                              id={`team-${team}`}
                              checked={formData.target_teams.includes(team)}
                              onCheckedChange={() => handleToggleTeam(team)}
                            />
                            <label htmlFor={`team-${team}`} className="text-sm cursor-pointer">
                              {team}
                            </label>
                          </div>
                        ))}
                      </div>
                    )}
                  </ScrollArea>
                </div>

                {/* Actions */}
                <div className="flex justify-end gap-3">
                  <Button type="button" variant="outline" onClick={handleCloseDialog}>
                    Cancelar
                  </Button>
                  <Button type="submit" disabled={isPending}>
                    {isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                    {editingAnnouncement ? "Guardar Cambios" : "Crear Anuncio"}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-24 w-full" />
            ))}
          </div>
        ) : announcements.length === 0 ? (
          <div className="text-center py-12">
            <Megaphone className="h-12 w-12 text-muted-foreground/50 mx-auto mb-4" />
            <p className="text-muted-foreground">No hay anuncios creados</p>
            <p className="text-sm text-muted-foreground">
              Crea tu primer anuncio para comunicar novedades al equipo
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {announcements.map((announcement) => (
              <div
                key={announcement.id}
                className="flex items-start justify-between p-4 border rounded-lg bg-muted/30"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="font-medium">{announcement.title}</h4>
                    {isActive(announcement) ? (
                      <Badge variant="default" className="text-xs">Activo</Badge>
                    ) : new Date(announcement.starts_at) > new Date() ? (
                      <Badge variant="secondary" className="text-xs">Programado</Badge>
                    ) : (
                      <Badge variant="outline" className="text-xs">Expirado</Badge>
                    )}
                    {announcement.course_link && (
                      <Badge variant="outline" className="text-xs gap-1">
                        <Link2 className="h-3 w-3" />
                        Con link
                      </Badge>
                    )}
                  </div>
                  {announcement.content && (
                    <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
                      {announcement.content}
                    </p>
                  )}
                  <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {format(new Date(announcement.starts_at), "d MMM yyyy", { locale: es })}
                    </span>
                    {announcement.expires_at && (
                      <span>
                        → {format(new Date(announcement.expires_at), "d MMM yyyy", { locale: es })}
                      </span>
                    )}
                    <span className="flex items-center gap-1">
                      <Eye className="h-3 w-3" />
                      {viewCounts[announcement.id] || 0} vistas
                    </span>
                    {announcement.target_teams && announcement.target_teams.length > 0 && (
                      <span className="flex items-center gap-1">
                        <Users className="h-3 w-3" />
                        {announcement.target_teams.length} equipos
                      </span>
                    )}
                    {(announcement.points_for_viewing || 0) > 0 && (
                      <span className="flex items-center gap-1">
                        <Trophy className="h-3 w-3" />
                        +{announcement.points_for_viewing} pts
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2 ml-4">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleOpenEdit(announcement)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="ghost" size="icon" className="text-destructive">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>¿Eliminar anuncio?</AlertDialogTitle>
                        <AlertDialogDescription>
                          Esta acción no se puede deshacer. El anuncio "{announcement.title}" será
                          eliminado permanentemente.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => deleteMutation.mutate(announcement.id)}
                          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                          Eliminar
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
