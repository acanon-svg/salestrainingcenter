import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Loader2, BookOpen, Search, GraduationCap } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

interface RecommendCourseDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  executiveEmail: string;
  executiveName: string;
}

export const RecommendCourseDialog: React.FC<RecommendCourseDialogProps> = ({
  open,
  onOpenChange,
  executiveEmail,
  executiveName,
}) => {
  const { profile } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [selectedCourseId, setSelectedCourseId] = useState<string | null>(null);
  const [message, setMessage] = useState("");

  // Fetch published courses
  const { data: courses = [], isLoading: loadingCourses } = useQuery({
    queryKey: ["published-courses-for-recommend"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("courses")
        .select("id, title, description, dimension, difficulty, points")
        .eq("status", "published")
        .order("title");
      if (error) throw error;
      return data;
    },
    enabled: open,
  });

  const filteredCourses = courses.filter(
    (c) =>
      c.title.toLowerCase().includes(search.toLowerCase()) ||
      (c.description && c.description.toLowerCase().includes(search.toLowerCase()))
  );

  const selectedCourse = courses.find((c) => c.id === selectedCourseId);

  const recommendMutation = useMutation({
    mutationFn: async () => {
      if (!selectedCourseId || !profile) throw new Error("Faltan datos");

      // Find the student's user_id from their email
      const { data: studentProfile, error: profileError } = await supabase
        .from("profiles")
        .select("user_id")
        .eq("email", executiveEmail)
        .maybeSingle();

      if (profileError) throw profileError;
      if (!studentProfile) throw new Error("No se encontró el perfil del estudiante");

      const studentUserId = studentProfile.user_id;

      // Check if already enrolled
      const { data: existingEnrollment } = await supabase
        .from("course_enrollments")
        .select("id")
        .eq("user_id", studentUserId)
        .eq("course_id", selectedCourseId)
        .maybeSingle();

      // Create enrollment if not exists
      if (!existingEnrollment) {
        const { error: enrollError } = await supabase
          .from("course_enrollments")
          .insert({
            user_id: studentUserId,
            course_id: selectedCourseId,
            status: "enrolled",
            progress_percentage: 0,
          });
        if (enrollError) throw enrollError;
      }

      // Send notification
      const courseName = selectedCourse?.title || "un curso";
      const leaderName = profile.full_name || profile.email;
      const notifMessage = message
        ? `${leaderName} te ha recomendado el curso "${courseName}" para fortalecer tus habilidades. Mensaje: ${message}`
        : `${leaderName} te ha recomendado el curso "${courseName}" para fortalecer tus habilidades.`;

      const { error: notifError } = await supabase
        .from("notifications")
        .insert({
          user_id: studentUserId,
          title: "📚 Curso recomendado por tu líder",
          message: notifMessage,
          type: "course_recommendation",
          related_id: selectedCourseId,
        });
      if (notifError) throw notifError;
    },
    onSuccess: () => {
      toast({
        title: "¡Curso recomendado!",
        description: `Se ha asignado el curso a ${executiveName} y se le ha notificado.`,
      });
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
      onOpenChange(false);
      setSelectedCourseId(null);
      setMessage("");
      setSearch("");
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "No se pudo recomendar el curso",
        variant: "destructive",
      });
    },
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[85vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <GraduationCap className="h-5 w-5 text-primary" />
            Recomendar Curso
          </DialogTitle>
          <DialogDescription>
            Selecciona un curso para recomendar a <strong>{executiveName}</strong>. Se le
            notificará y quedará inscrito automáticamente.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 flex-1 overflow-hidden flex flex-col">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar curso..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>

          {/* Course list */}
          <div className="flex-1 overflow-y-auto space-y-2 min-h-0 max-h-[280px] pr-1">
            {loadingCourses ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              </div>
            ) : filteredCourses.length === 0 ? (
              <p className="text-center text-muted-foreground py-4 text-sm">
                No se encontraron cursos.
              </p>
            ) : (
              filteredCourses.map((course) => (
                <div
                  key={course.id}
                  className={`p-3 border rounded-lg cursor-pointer transition-all ${
                    selectedCourseId === course.id
                      ? "ring-2 ring-primary bg-primary/5"
                      : "hover:bg-accent/50"
                  }`}
                  onClick={() => setSelectedCourseId(course.id)}
                >
                  <div className="flex items-start gap-2">
                    <BookOpen className="h-4 w-4 mt-0.5 text-primary shrink-0" />
                    <div className="min-w-0">
                      <p className="font-medium text-sm truncate">{course.title}</p>
                      {course.description && (
                        <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">
                          {course.description}
                        </p>
                      )}
                      <div className="flex gap-1 mt-1">
                        <Badge variant="outline" className="text-[10px] px-1 py-0">
                          {course.dimension}
                        </Badge>
                        <Badge variant="outline" className="text-[10px] px-1 py-0">
                          {course.difficulty}
                        </Badge>
                        <Badge variant="outline" className="text-[10px] px-1 py-0">
                          {course.points} pts
                        </Badge>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Optional message */}
          <Textarea
            placeholder="Mensaje adicional para el estudiante (opcional)"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            rows={2}
            className="resize-none"
          />
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button
            onClick={() => recommendMutation.mutate()}
            disabled={!selectedCourseId || recommendMutation.isPending}
          >
            {recommendMutation.isPending ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <GraduationCap className="h-4 w-4 mr-2" />
            )}
            Recomendar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
