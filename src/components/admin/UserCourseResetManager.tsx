import React, { useState, useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Checkbox } from "@/components/ui/checkbox";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { 
  UserX, 
  Search, 
  Loader2, 
  RotateCcw, 
  AlertTriangle, 
  BookOpen,
  Trophy,
  Award,
  Check,
  ChevronDown,
  ChevronUp
} from "lucide-react";

interface UserProfile {
  id: string;
  user_id: string;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
  team: string | null;
  points: number;
  badges_count: number;
}

interface Course {
  id: string;
  title: string;
  status: string;
}

interface ResetUserOptions {
  resetEnrollments: boolean;
  resetUserBadges: boolean;
  resetPoints: boolean;
  selectedCourseIds: string[];
}

export const UserCourseResetManager: React.FC = () => {
  const { hasRole } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [users, setUsers] = useState<UserProfile[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [filteredUsers, setFilteredUsers] = useState<UserProfile[]>([]);
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [showCourseSelector, setShowCourseSelector] = useState(false);
  const [options, setOptions] = useState<ResetUserOptions>({
    resetEnrollments: true,
    resetUserBadges: false,
    resetPoints: false,
    selectedCourseIds: [],
  });

  const isCreator = hasRole("creator") || hasRole("admin");

  // Fetch all courses for selection
  const { data: allCourses = [] } = useQuery({
    queryKey: ["all-courses-for-reset"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("courses")
        .select("id, title, status")
        .order("title", { ascending: true });
      
      if (error) throw error;
      return data as Course[];
    },
    enabled: isCreator,
  });

  // Fetch user's enrolled courses when user is selected
  const { data: userEnrollments = [], isLoading: isLoadingEnrollments } = useQuery({
    queryKey: ["user-enrollments-for-reset", selectedUser?.user_id],
    queryFn: async () => {
      if (!selectedUser) return [];
      
      const { data, error } = await supabase
        .from("course_enrollments")
        .select(`
          course_id,
          courses (
            id,
            title,
            status
          )
        `)
        .eq("user_id", selectedUser.user_id);
      
      if (error) throw error;
      return data?.map(e => e.courses).filter(Boolean) as Course[];
    },
    enabled: !!selectedUser && isCreator,
  });

  useEffect(() => {
    if (isCreator) {
      fetchUsers();
    }
  }, [isCreator]);

  useEffect(() => {
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      setFilteredUsers(
        users.filter(
          (user) =>
            user.email.toLowerCase().includes(query) ||
            user.full_name?.toLowerCase().includes(query)
        )
      );
    } else {
      setFilteredUsers([]);
    }
  }, [searchQuery, users]);

  // Reset selected courses when user changes
  useEffect(() => {
    setOptions(prev => ({ ...prev, selectedCourseIds: [] }));
    setShowCourseSelector(false);
  }, [selectedUser]);

  const fetchUsers = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, user_id, email, full_name, avatar_url, team, points, badges_count")
        .order("full_name", { ascending: true });

      if (error) throw error;
      setUsers(data || []);
    } catch (error: any) {
      toast({
        title: "Error",
        description: "No se pudieron cargar los usuarios",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const resetMutation = useMutation({
    mutationFn: async ({ userId, opts }: { userId: string; opts: ResetUserOptions }) => {
      const results: string[] = [];

      if (opts.resetEnrollments) {
        const hasSelectedCourses = opts.selectedCourseIds.length > 0;
        
        if (hasSelectedCourses) {
          // Delete only selected course enrollments
          const { error: enrollmentError } = await supabase
            .from("course_enrollments")
            .delete()
            .eq("user_id", userId)
            .in("course_id", opts.selectedCourseIds);
          if (enrollmentError) throw new Error(`Error al eliminar inscripciones: ${enrollmentError.message}`);
          
          // Get quiz IDs for selected courses to delete attempts
          const { data: quizzes } = await supabase
            .from("quizzes")
            .select("id")
            .in("course_id", opts.selectedCourseIds);
          
          if (quizzes && quizzes.length > 0) {
            const quizIds = quizzes.map(q => q.id);
            const { error: quizError } = await supabase
              .from("quiz_attempts")
              .delete()
              .eq("user_id", userId)
              .in("quiz_id", quizIds);
            if (quizError) throw new Error(`Error al eliminar intentos de quiz: ${quizError.message}`);
          }

          // Get material IDs for selected courses to delete progress
          const { data: materials } = await supabase
            .from("course_materials")
            .select("id")
            .in("course_id", opts.selectedCourseIds);

          if (materials && materials.length > 0) {
            const materialIds = materials.map(m => m.id);
            const { error: progressError } = await supabase
              .from("material_progress")
              .delete()
              .eq("user_id", userId)
              .in("material_id", materialIds);
            if (progressError) throw new Error(`Error al eliminar progreso: ${progressError.message}`);
          }

          results.push(`Progreso eliminado en ${opts.selectedCourseIds.length} curso(s)`);
        } else {
          // Delete all enrollments (original behavior)
          const { error: enrollmentError } = await supabase
            .from("course_enrollments")
            .delete()
            .eq("user_id", userId);
          if (enrollmentError) throw new Error(`Error al eliminar inscripciones: ${enrollmentError.message}`);
          
          const { error: quizError } = await supabase
            .from("quiz_attempts")
            .delete()
            .eq("user_id", userId);
          if (quizError) throw new Error(`Error al eliminar intentos de quiz: ${quizError.message}`);

          const { error: progressError } = await supabase
            .from("material_progress")
            .delete()
            .eq("user_id", userId);
          if (progressError) throw new Error(`Error al eliminar progreso: ${progressError.message}`);

          results.push("Todas las inscripciones y progreso eliminados");
        }
      }

      if (opts.resetUserBadges) {
        const { error } = await supabase
          .from("user_badges")
          .delete()
          .eq("user_id", userId);
        if (error) throw new Error(`Error al eliminar insignias: ${error.message}`);
        
        await supabase
          .from("profiles")
          .update({ badges_count: 0 })
          .eq("user_id", userId);
          
        results.push("Insignias ganadas eliminadas");
      }

      if (opts.resetPoints) {
        const { error } = await supabase
          .from("profiles")
          .update({ points: 0 })
          .eq("user_id", userId);
        if (error) throw new Error(`Error al reiniciar puntos: ${error.message}`);
        results.push("Puntos reiniciados a cero");
      }

      return results;
    },
    onSuccess: (results) => {
      queryClient.invalidateQueries({ queryKey: ["profiles"] });
      queryClient.invalidateQueries({ queryKey: ["enrollments"] });
      queryClient.invalidateQueries({ queryKey: ["quiz-attempts"] });
      queryClient.invalidateQueries({ queryKey: ["material-progress"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-stats"] });
      queryClient.invalidateQueries({ queryKey: ["ranking"] });
      queryClient.invalidateQueries({ queryKey: ["my-badges"] });
      queryClient.invalidateQueries({ queryKey: ["user-badges-dashboard"] });
      queryClient.invalidateQueries({ queryKey: ["user-enrollments-for-reset"] });

      toast({
        title: "Datos reiniciados",
        description: `${selectedUser?.full_name || selectedUser?.email}: ${results.join(". ")}`,
      });
      
      setIsDialogOpen(false);
      setSelectedUser(null);
      setSearchQuery("");
      setOptions({
        resetEnrollments: true,
        resetUserBadges: false,
        resetPoints: false,
        selectedCourseIds: [],
      });
      fetchUsers();
    },
    onError: (error: Error) => {
      toast({
        title: "Error al reiniciar",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const getInitials = (name: string | null) => {
    if (!name) return "U";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const handleSelectUser = (user: UserProfile) => {
    setSelectedUser(user);
    setSearchQuery("");
    setFilteredUsers([]);
  };

  const handleOpenDialog = () => {
    if (selectedUser) {
      setIsDialogOpen(true);
    }
  };

  const handleConfirmReset = () => {
    if (selectedUser) {
      resetMutation.mutate({ userId: selectedUser.user_id, opts: options });
    }
  };

  const handleToggleCourse = (courseId: string) => {
    setOptions(prev => ({
      ...prev,
      selectedCourseIds: prev.selectedCourseIds.includes(courseId)
        ? prev.selectedCourseIds.filter(id => id !== courseId)
        : [...prev.selectedCourseIds, courseId]
    }));
  };

  const handleSelectAllCourses = () => {
    const courseIds = userEnrollments.map(c => c.id);
    setOptions(prev => ({
      ...prev,
      selectedCourseIds: prev.selectedCourseIds.length === courseIds.length ? [] : courseIds
    }));
  };

  if (!isCreator) return null;

  const anySelected = options.resetEnrollments || options.resetUserBadges || options.resetPoints;
  const selectedCoursesCount = options.selectedCourseIds.length;

  return (
    <Card className="border-amber-500/50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-amber-600">
          <UserX className="h-5 w-5" />
          Reiniciar Cursos por Usuario
        </CardTitle>
        <CardDescription>
          Reinicia el progreso de cursos específicos, insignias y puntos de un usuario.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Search and Select User */}
        <div className="space-y-2">
          <Label>Buscar usuario</Label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por nombre o email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          
          {/* Search Results */}
          {filteredUsers.length > 0 && (
            <ScrollArea className="h-48 border rounded-md p-2">
              <div className="space-y-1">
                {filteredUsers.map((user) => (
                  <button
                    key={user.id}
                    onClick={() => handleSelectUser(user)}
                    className="w-full flex items-center gap-3 p-2 rounded-md hover:bg-muted transition-colors text-left"
                  >
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={user.avatar_url || undefined} />
                      <AvatarFallback className="text-xs">
                        {getInitials(user.full_name)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">
                        {user.full_name || "Sin nombre"}
                      </p>
                      <p className="text-xs text-muted-foreground truncate">
                        {user.email}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-xs">
                        {user.points} pts
                      </Badge>
                    </div>
                  </button>
                ))}
              </div>
            </ScrollArea>
          )}
        </div>

        {/* Selected User Display */}
        {selectedUser && (
          <div className="p-3 bg-muted/50 rounded-lg border">
            <div className="flex items-center gap-3">
              <Avatar className="h-10 w-10">
                <AvatarImage src={selectedUser.avatar_url || undefined} />
                <AvatarFallback>
                  {getInitials(selectedUser.full_name)}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <p className="font-medium">{selectedUser.full_name || "Sin nombre"}</p>
                <p className="text-sm text-muted-foreground">{selectedUser.email}</p>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="gap-1">
                  <Trophy className="h-3 w-3" />
                  {selectedUser.points}
                </Badge>
                <Badge variant="secondary" className="gap-1">
                  <Award className="h-3 w-3" />
                  {selectedUser.badges_count}
                </Badge>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelectedUser(null)}
                className="text-muted-foreground"
              >
                ✕
              </Button>
            </div>
          </div>
        )}

        {/* Reset Options */}
        {selectedUser && (
          <div className="space-y-3 pt-2">
            <Label className="text-sm font-medium">Opciones de reinicio</Label>
            
            {/* Enrollments Option */}
            <div className="space-y-2">
              <div className="flex items-start gap-3">
                <Checkbox
                  id="userResetEnrollments"
                  checked={options.resetEnrollments}
                  onCheckedChange={(checked) =>
                    setOptions((prev) => ({ 
                      ...prev, 
                      resetEnrollments: checked as boolean,
                      selectedCourseIds: checked ? prev.selectedCourseIds : []
                    }))
                  }
                />
                <div className="flex-1">
                  <Label htmlFor="userResetEnrollments" className="font-medium cursor-pointer flex items-center gap-2">
                    <BookOpen className="h-4 w-4 text-primary" />
                    Reiniciar cursos y progreso
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    Elimina inscripciones, intentos de quiz y progreso de materiales
                  </p>
                </div>
              </div>

              {/* Course Selector - Only show when resetEnrollments is checked */}
              {options.resetEnrollments && (
                <div className="ml-6 mt-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setShowCourseSelector(!showCourseSelector)}
                    className="w-full justify-between"
                  >
                    <span className="flex items-center gap-2">
                      <BookOpen className="h-4 w-4" />
                      {selectedCoursesCount > 0 
                        ? `${selectedCoursesCount} curso(s) seleccionado(s)`
                        : "Seleccionar cursos específicos (opcional)"}
                    </span>
                    {showCourseSelector ? (
                      <ChevronUp className="h-4 w-4" />
                    ) : (
                      <ChevronDown className="h-4 w-4" />
                    )}
                  </Button>

                  {showCourseSelector && (
                    <div className="mt-2 border rounded-md p-2 bg-background">
                      {isLoadingEnrollments ? (
                        <div className="flex items-center justify-center py-4">
                          <Loader2 className="h-4 w-4 animate-spin" />
                          <span className="ml-2 text-sm text-muted-foreground">Cargando cursos...</span>
                        </div>
                      ) : userEnrollments.length === 0 ? (
                        <p className="text-sm text-muted-foreground text-center py-4">
                          Este usuario no tiene cursos activos
                        </p>
                      ) : (
                        <>
                          <div className="flex items-center justify-between mb-2 pb-2 border-b">
                            <span className="text-xs text-muted-foreground">
                              {userEnrollments.length} curso(s) inscritos
                            </span>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={handleSelectAllCourses}
                              className="text-xs h-7"
                            >
                              {selectedCoursesCount === userEnrollments.length 
                                ? "Deseleccionar todos" 
                                : "Seleccionar todos"}
                            </Button>
                          </div>
                          <ScrollArea className="h-40">
                            <div className="space-y-1">
                              {userEnrollments.map((course) => (
                                <label
                                  key={course.id}
                                  className="flex items-center gap-2 p-2 rounded hover:bg-muted cursor-pointer"
                                >
                                  <Checkbox
                                    checked={options.selectedCourseIds.includes(course.id)}
                                    onCheckedChange={() => handleToggleCourse(course.id)}
                                  />
                                  <span className="text-sm flex-1 truncate">{course.title}</span>
                                  <Badge variant="outline" className="text-xs">
                                    {course.status === "published" ? "Publicado" : course.status}
                                  </Badge>
                                </label>
                              ))}
                            </div>
                          </ScrollArea>
                        </>
                      )}
                      
                      <p className="text-xs text-muted-foreground mt-2 pt-2 border-t">
                        {selectedCoursesCount === 0 
                          ? "⚠️ Sin selección: se reiniciará TODO el progreso del usuario"
                          : `Se reiniciará solo el progreso de los ${selectedCoursesCount} curso(s) seleccionado(s)`}
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="flex items-start gap-3">
              <Checkbox
                id="userResetBadges"
                checked={options.resetUserBadges}
                onCheckedChange={(checked) =>
                  setOptions((prev) => ({ ...prev, resetUserBadges: checked as boolean }))
                }
              />
              <div>
                <Label htmlFor="userResetBadges" className="font-medium cursor-pointer flex items-center gap-2">
                  <Award className="h-4 w-4 text-amber-500" />
                  Eliminar insignias ganadas
                </Label>
                <p className="text-xs text-muted-foreground">
                  Quita todas las insignias obtenidas por este usuario
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Checkbox
                id="userResetPoints"
                checked={options.resetPoints}
                onCheckedChange={(checked) =>
                  setOptions((prev) => ({ ...prev, resetPoints: checked as boolean }))
                }
              />
              <div>
                <Label htmlFor="userResetPoints" className="font-medium cursor-pointer flex items-center gap-2">
                  <Trophy className="h-4 w-4 text-orange-500" />
                  Reiniciar puntos a cero
                </Label>
                <p className="text-xs text-muted-foreground">
                  Pone los puntos acumulados del usuario en cero
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Reset Button */}
        <Button
          variant="destructive"
          disabled={!selectedUser || !anySelected}
          onClick={handleOpenDialog}
          className="w-full"
        >
          <RotateCcw className="mr-2 h-4 w-4" />
          Reiniciar Datos del Usuario
        </Button>

        {/* Confirmation Dialog */}
        <AlertDialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle className="flex items-center gap-2 text-destructive">
                <AlertTriangle className="h-5 w-5" />
                ¿Confirmar reinicio de datos?
              </AlertDialogTitle>
              <AlertDialogDescription className="space-y-3">
                <p>
                  Vas a reiniciar los siguientes datos para{" "}
                  <strong>{selectedUser?.full_name || selectedUser?.email}</strong>:
                </p>
                <ul className="list-disc list-inside text-sm space-y-1">
                  {options.resetEnrollments && (
                    <li>
                      {options.selectedCourseIds.length > 0 
                        ? `Progreso de ${options.selectedCourseIds.length} curso(s) seleccionado(s)`
                        : "TODAS las inscripciones, progreso de cursos e intentos de quiz"}
                    </li>
                  )}
                  {options.resetUserBadges && <li>Insignias ganadas</li>}
                  {options.resetPoints && <li>Puntos acumulados (se pondrán en 0)</li>}
                </ul>
                <p className="font-semibold text-destructive">
                  Esta acción NO se puede deshacer.
                </p>
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleConfirmReset}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                disabled={resetMutation.isPending}
              >
                {resetMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Reiniciando...
                  </>
                ) : (
                  <>
                    <Check className="mr-2 h-4 w-4" />
                    Sí, reiniciar datos
                  </>
                )}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </CardContent>
    </Card>
  );
};
