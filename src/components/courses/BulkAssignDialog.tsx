import React, { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
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
import { ScrollArea } from "@/components/ui/scroll-area";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Search, User, X, Loader2 } from "lucide-react";
import { useBulkAssignCourses } from "@/hooks/useBulkCourseActions";

interface BulkAssignDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  courseIds: string[];
  onComplete: () => void;
}

interface UserWithCourseCount {
  user_id: string;
  full_name: string | null;
  email: string;
  team: string | null;
  active_courses: number;
}

export const BulkAssignDialog: React.FC<BulkAssignDialogProps> = ({
  open,
  onOpenChange,
  courseIds,
  onComplete,
}) => {
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const bulkAssign = useBulkAssignCourses();

  const { data: users = [], isLoading } = useQuery({
    queryKey: ["users-with-course-count"],
    queryFn: async () => {
      const { data: profiles, error } = await supabase
        .from("profiles")
        .select("user_id, full_name, email, team")
        .order("full_name");
      if (error) throw error;

      // Get active enrollment counts
      const { data: enrollments } = await supabase
        .from("course_enrollments")
        .select("user_id, status");

      const countMap: Record<string, number> = {};
      enrollments?.forEach((e) => {
        if (e.status !== "completed") {
          countMap[e.user_id] = (countMap[e.user_id] || 0) + 1;
        }
      });

      return (profiles || []).map((p) => ({
        ...p,
        active_courses: countMap[p.user_id] || 0,
      })) as UserWithCourseCount[];
    },
    enabled: open,
  });

  const filteredUsers = useMemo(() => {
    if (!searchTerm) return users;
    const term = searchTerm.toLowerCase();
    return users.filter(
      (u) =>
        u.full_name?.toLowerCase().includes(term) ||
        u.email.toLowerCase().includes(term) ||
        u.team?.toLowerCase().includes(term)
    );
  }, [users, searchTerm]);

  const toggleUser = (userId: string) => {
    setSelectedUsers((prev) =>
      prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId]
    );
  };

  const handleAssign = async () => {
    if (!user?.id) return;
    await bulkAssign.mutateAsync({
      courseIds,
      userIds: selectedUsers,
      assignedBy: user.id,
    });
    setSelectedUsers([]);
    setSearchTerm("");
    onComplete();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Asignar usuarios a {courseIds.length} curso(s)</DialogTitle>
          <DialogDescription>
            Selecciona los usuarios. La asignación se agrega sin reemplazar cursos existentes.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          {selectedUsers.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {selectedUsers.map((uid) => {
                const u = users.find((x) => x.user_id === uid);
                return (
                  <Badge key={uid} variant="secondary" className="gap-1 pr-1">
                    <User className="h-3 w-3" />
                    {u?.full_name || u?.email || uid}
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-4 w-4 p-0 hover:bg-transparent"
                      onClick={() => toggleUser(uid)}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </Badge>
                );
              })}
            </div>
          )}

          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Buscar por nombre, email o equipo..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>

          <ScrollArea className="h-64 rounded-md border">
            <div className="p-2 space-y-1">
              {isLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                </div>
              ) : filteredUsers.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No se encontraron usuarios
                </p>
              ) : (
                filteredUsers.map((u) => (
                  <div
                    key={u.user_id}
                    className="flex items-center gap-3 p-2 rounded-md hover:bg-muted cursor-pointer"
                    onClick={() => toggleUser(u.user_id)}
                  >
                    <Checkbox
                      checked={selectedUsers.includes(u.user_id)}
                      onCheckedChange={() => toggleUser(u.user_id)}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">
                        {u.full_name || "Sin nombre"}
                      </p>
                      <p className="text-xs text-muted-foreground truncate">
                        {u.email}
                        {u.team && ` • ${u.team}`}
                      </p>
                    </div>
                    <Badge variant="outline" className="text-xs shrink-0">
                      {u.active_courses} curso{u.active_courses !== 1 ? "s" : ""} activo{u.active_courses !== 1 ? "s" : ""}
                    </Badge>
                  </div>
                ))
              )}
            </div>
          </ScrollArea>

          <p className="text-xs text-muted-foreground">
            {selectedUsers.length} usuario(s) seleccionado(s)
          </p>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button
            onClick={handleAssign}
            disabled={selectedUsers.length === 0 || bulkAssign.isPending}
          >
            {bulkAssign.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : null}
            Asignar {selectedUsers.length > 0 ? `(${selectedUsers.length})` : ""}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
