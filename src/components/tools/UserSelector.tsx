import React, { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Checkbox } from "@/components/ui/checkbox";
import { X, Search, User } from "lucide-react";

interface UserSelectorProps {
  selectedUsers: string[];
  onUsersChange: (users: string[]) => void;
}

interface UserProfile {
  user_id: string;
  full_name: string | null;
  email: string;
  team: string | null;
  regional: string | null;
}

export const UserSelector: React.FC<UserSelectorProps> = ({
  selectedUsers,
  onUsersChange,
}) => {
  const [searchTerm, setSearchTerm] = useState("");

  const { data: users, isLoading } = useQuery({
    queryKey: ["all-users-for-selector"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("user_id, full_name, email, team, regional")
        .order("full_name");

      if (error) throw error;
      return data as UserProfile[];
    },
  });

  const filteredUsers = useMemo(() => {
    if (!users) return [];
    if (!searchTerm) return users;
    const term = searchTerm.toLowerCase();
    return users.filter(
      (user) =>
        user.full_name?.toLowerCase().includes(term) ||
        user.email.toLowerCase().includes(term) ||
        user.team?.toLowerCase().includes(term)
    );
  }, [users, searchTerm]);

  const selectedUserProfiles = useMemo(() => {
    if (!users) return [];
    return users.filter((u) => selectedUsers.includes(u.user_id));
  }, [users, selectedUsers]);

  const toggleUser = (userId: string) => {
    if (selectedUsers.includes(userId)) {
      onUsersChange(selectedUsers.filter((id) => id !== userId));
    } else {
      onUsersChange([...selectedUsers, userId]);
    }
  };

  const removeUser = (userId: string) => {
    onUsersChange(selectedUsers.filter((id) => id !== userId));
  };

  if (isLoading) {
    return <div className="text-sm text-muted-foreground">Cargando usuarios...</div>;
  }

  return (
    <div className="space-y-3">
      {/* Selected users badges */}
      {selectedUserProfiles.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {selectedUserProfiles.map((user) => (
            <Badge key={user.user_id} variant="secondary" className="gap-1 pr-1">
              <User className="h-3 w-3" />
              {user.full_name || user.email}
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-4 w-4 p-0 hover:bg-transparent"
                onClick={() => removeUser(user.user_id)}
              >
                <X className="h-3 w-3" />
              </Button>
            </Badge>
          ))}
        </div>
      )}

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Buscar usuarios por nombre, email o equipo..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* User list */}
      <ScrollArea className="h-48 rounded-md border">
        <div className="p-2 space-y-1">
          {filteredUsers.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              No se encontraron usuarios
            </p>
          ) : (
            filteredUsers.map((user) => (
              <div
                key={user.user_id}
                className="flex items-center gap-3 p-2 rounded-md hover:bg-muted cursor-pointer"
                onClick={() => toggleUser(user.user_id)}
              >
                <Checkbox
                  checked={selectedUsers.includes(user.user_id)}
                  onCheckedChange={() => toggleUser(user.user_id)}
                />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">
                    {user.full_name || "Sin nombre"}
                  </p>
                  <p className="text-xs text-muted-foreground truncate">
                    {user.email}
                    {user.team && ` • ${user.team}`}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>
      </ScrollArea>

      <p className="text-xs text-muted-foreground">
        {selectedUsers.length} usuario(s) seleccionado(s)
      </p>
    </div>
  );
};
