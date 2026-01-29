import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Checkbox } from "@/components/ui/checkbox";
import { useLeaderHierarchy } from "@/hooks/useLeaderHierarchy";
import { Users, UserPlus, Trash2, Loader2, ChevronRight, Crown } from "lucide-react";

interface LeaderHierarchyManagerProps {
  onClose?: () => void;
}

export const LeaderHierarchyManager: React.FC<LeaderHierarchyManagerProps> = ({ onClose }) => {
  const {
    allLeaders,
    loadingLeaders,
    hierarchies,
    loadingHierarchies,
    addSubordinate,
    removeSubordinate,
  } = useLeaderHierarchy();

  const [selectedSupervisor, setSelectedSupervisor] = useState<string>("");
  const [selectedSubordinates, setSelectedSubordinates] = useState<string[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const getInitials = (name: string | null) => {
    if (!name) return "U";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  // Get subordinates for each supervisor
  const getSubordinatesForSupervisor = (supervisorId: string) => {
    return hierarchies?.filter((h) => h.supervisor_id === supervisorId) || [];
  };

  // Get leaders who can be assigned as subordinates (not already assigned to this supervisor)
  const getAvailableSubordinates = (supervisorId: string) => {
    const currentSubordinates = getSubordinatesForSupervisor(supervisorId).map(
      (h) => h.subordinate_id
    );
    return allLeaders?.filter(
      (l) => l.user_id !== supervisorId && !currentSubordinates.includes(l.user_id)
    );
  };

  // Get unique supervisors from hierarchies
  const supervisorsWithSubordinates = React.useMemo(() => {
    if (!hierarchies || !allLeaders) return [];
    
    const supervisorIds = [...new Set(hierarchies.map((h) => h.supervisor_id))];
    return supervisorIds.map((id) => {
      const leader = allLeaders.find((l) => l.user_id === id);
      const subordinates = getSubordinatesForSupervisor(id);
      return {
        ...leader,
        user_id: id,
        subordinates: subordinates.map((s) => ({
          ...s,
          profile: allLeaders.find((l) => l.user_id === s.subordinate_id),
        })),
      };
    });
  }, [hierarchies, allLeaders]);

  const toggleSubordinate = (userId: string) => {
    setSelectedSubordinates((prev) =>
      prev.includes(userId)
        ? prev.filter((id) => id !== userId)
        : [...prev, userId]
    );
  };

  const handleAddSubordinates = async () => {
    if (!selectedSupervisor || selectedSubordinates.length === 0) return;

    setIsSubmitting(true);
    try {
      for (const subordinateId of selectedSubordinates) {
        await addSubordinate.mutateAsync({
          supervisorId: selectedSupervisor,
          subordinateId,
        });
      }
      setSelectedSubordinates([]);
      setDialogOpen(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRemoveSubordinate = async (hierarchyId: string) => {
    await removeSubordinate.mutateAsync(hierarchyId);
  };

  if (loadingLeaders || loadingHierarchies) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Crown className="h-5 w-5 text-primary" />
                Jerarquía de Líderes
              </CardTitle>
              <CardDescription>
                Configura qué líderes supervisan a otros líderes
              </CardDescription>
            </div>
            <Button onClick={() => setDialogOpen(true)}>
              <UserPlus className="h-4 w-4 mr-2" />
              Asignar Subordinado
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {supervisorsWithSubordinates.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No hay jerarquías configuradas</p>
              <p className="text-sm">Asigna líderes subordinados a otros líderes</p>
            </div>
          ) : (
            <ScrollArea className="max-h-[400px]">
              <div className="space-y-4">
                {supervisorsWithSubordinates.map((supervisor) => (
                  <Card key={supervisor.user_id} className="bg-muted/30">
                    <CardContent className="pt-4">
                      <div className="flex items-center gap-3 mb-3">
                        <Avatar>
                          <AvatarFallback className="bg-primary text-primary-foreground">
                            {getInitials(supervisor.full_name ?? null)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="font-medium">
                              {supervisor.full_name || supervisor.email}
                            </span>
                            <Badge variant="default" className="text-xs">
                              <Crown className="h-3 w-3 mr-1" />
                              Supervisor
                            </Badge>
                          </div>
                          <p className="text-xs text-muted-foreground">
                            {supervisor.regional} • {supervisor.team}
                          </p>
                        </div>
                      </div>

                      <div className="ml-8 border-l-2 border-primary/30 pl-4 space-y-2">
                        {supervisor.subordinates.map((sub) => (
                          <div
                            key={sub.id}
                            className="flex items-center justify-between bg-background rounded-lg p-2"
                          >
                            <div className="flex items-center gap-2">
                              <ChevronRight className="h-4 w-4 text-muted-foreground" />
                              <Avatar className="h-8 w-8">
                                <AvatarFallback className="text-xs">
                                  {getInitials(sub.profile?.full_name ?? null)}
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                <span className="text-sm font-medium">
                                  {sub.profile?.full_name || sub.profile?.email || "Líder"}
                                </span>
                                <p className="text-xs text-muted-foreground">
                                  {sub.profile?.regional} • {sub.profile?.team}
                                </p>
                              </div>
                            </div>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleRemoveSubordinate(sub.id)}
                              disabled={removeSubordinate.isPending}
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </ScrollArea>
          )}
        </CardContent>
      </Card>

      {/* All Leaders without subordinates */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Todos los Líderes</CardTitle>
          <CardDescription>
            Lista de usuarios con rol de líder
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {allLeaders?.map((leader) => {
              const isSupervising = hierarchies?.some(
                (h) => h.supervisor_id === leader.user_id
              );
              const isSubordinate = hierarchies?.some(
                (h) => h.subordinate_id === leader.user_id
              );

              return (
                <div
                  key={leader.user_id}
                  className="flex items-center gap-2 p-2 rounded-lg bg-muted/30"
                >
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="text-xs">
                      {getInitials(leader.full_name)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">
                      {leader.full_name || leader.email}
                    </p>
                    <p className="text-xs text-muted-foreground truncate">
                      {leader.team}
                    </p>
                  </div>
                  <div className="flex gap-1">
                    {isSupervising && (
                      <Badge variant="default" className="text-xs">
                        <Crown className="h-3 w-3" />
                      </Badge>
                    )}
                    {isSubordinate && (
                      <Badge variant="secondary" className="text-xs">
                        Sub
                      </Badge>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Add Subordinates Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <UserPlus className="h-5 w-5" />
              Asignar Líderes Subordinados
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Líder Supervisor (Manager)</label>
              <Select value={selectedSupervisor} onValueChange={(v) => {
                setSelectedSupervisor(v);
                setSelectedSubordinates([]);
              }}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona un supervisor" />
                </SelectTrigger>
                <SelectContent>
                  {allLeaders?.map((leader) => (
                    <SelectItem key={leader.user_id} value={leader.user_id}>
                      <div className="flex items-center gap-2">
                        <span>{leader.full_name || leader.email}</span>
                        <span className="text-muted-foreground text-xs">
                          ({leader.team})
                        </span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">
                Líderes Subordinados 
                {selectedSubordinates.length > 0 && (
                  <Badge variant="secondary" className="ml-2">
                    {selectedSubordinates.length} seleccionados
                  </Badge>
                )}
              </label>
              
              {!selectedSupervisor ? (
                <p className="text-sm text-muted-foreground py-2">
                  Primero selecciona un supervisor
                </p>
              ) : getAvailableSubordinates(selectedSupervisor)?.length === 0 ? (
                <p className="text-sm text-muted-foreground py-2">
                  No hay más líderes disponibles para asignar
                </p>
              ) : (
                <ScrollArea className="h-[200px] border rounded-md p-2">
                  <div className="space-y-2">
                    {getAvailableSubordinates(selectedSupervisor)?.map((leader) => (
                      <div
                        key={leader.user_id}
                        className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 cursor-pointer"
                        onClick={() => toggleSubordinate(leader.user_id)}
                      >
                        <Checkbox
                          checked={selectedSubordinates.includes(leader.user_id)}
                          onCheckedChange={() => toggleSubordinate(leader.user_id)}
                        />
                        <Avatar className="h-8 w-8">
                          <AvatarFallback className="text-xs">
                            {getInitials(leader.full_name)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">
                            {leader.full_name || leader.email}
                          </p>
                          <p className="text-xs text-muted-foreground truncate">
                            {leader.regional} • {leader.team}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancelar
            </Button>
            <Button
              onClick={handleAddSubordinates}
              disabled={!selectedSupervisor || selectedSubordinates.length === 0 || isSubmitting}
            >
              {isSubmitting && (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              )}
              Asignar {selectedSubordinates.length > 0 && `(${selectedSubordinates.length})`}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
