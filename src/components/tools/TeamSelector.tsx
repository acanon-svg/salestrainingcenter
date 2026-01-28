import React from "react";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Users } from "lucide-react";
import { useAvailableTeams } from "@/hooks/useCourseTargeting";

interface TeamSelectorProps {
  selectedTeams: string[];
  onTeamsChange: (teams: string[]) => void;
}

export const TeamSelector: React.FC<TeamSelectorProps> = ({
  selectedTeams,
  onTeamsChange,
}) => {
  const { data: teams, isLoading } = useAvailableTeams();

  const handleTeamToggle = (team: string) => {
    if (selectedTeams.includes(team)) {
      onTeamsChange(selectedTeams.filter((t) => t !== team));
    } else {
      onTeamsChange([...selectedTeams, team]);
    }
  };

  const handleSelectAll = () => {
    if (teams) {
      if (selectedTeams.length === teams.length) {
        onTeamsChange([]);
      } else {
        onTeamsChange([...teams]);
      }
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-2">
        <Label>Equipos con acceso</Label>
        <div className="text-sm text-muted-foreground">Cargando equipos...</div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <Label className="flex items-center gap-2">
          <Users className="h-4 w-4" />
          Equipos con acceso
        </Label>
        {selectedTeams.length === 0 ? (
          <Badge variant="secondary">Todos los equipos</Badge>
        ) : (
          <Badge variant="outline">{selectedTeams.length} seleccionados</Badge>
        )}
      </div>
      
      <p className="text-xs text-muted-foreground">
        Si no seleccionas ningún equipo, la herramienta estará disponible para todos.
      </p>

      <div className="border rounded-lg p-3 max-h-48 overflow-y-auto space-y-2">
        {teams && teams.length > 0 ? (
          <>
            <div className="flex items-center space-x-2 pb-2 border-b">
              <Checkbox
                id="select-all-teams"
                checked={teams.length > 0 && selectedTeams.length === teams.length}
                onCheckedChange={handleSelectAll}
              />
              <label
                htmlFor="select-all-teams"
                className="text-sm font-medium cursor-pointer"
              >
                {selectedTeams.length === teams.length ? "Deseleccionar todos" : "Seleccionar todos"}
              </label>
            </div>
            {teams.map((team) => (
              <div key={team} className="flex items-center space-x-2">
                <Checkbox
                  id={`team-${team}`}
                  checked={selectedTeams.includes(team)}
                  onCheckedChange={() => handleTeamToggle(team)}
                />
                <label
                  htmlFor={`team-${team}`}
                  className="text-sm cursor-pointer"
                >
                  {team}
                </label>
              </div>
            ))}
          </>
        ) : (
          <div className="text-sm text-muted-foreground text-center py-2">
            No hay equipos configurados en el sistema.
          </div>
        )}
      </div>
    </div>
  );
};
