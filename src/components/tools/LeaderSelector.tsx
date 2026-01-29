import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { SupabaseClient } from "@supabase/supabase-js";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Checkbox } from "@/components/ui/checkbox";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Crown, Search, X, Loader2 } from "lucide-react";

const getSupabaseClient = () => supabase as unknown as SupabaseClient;

interface Leader {
  user_id: string;
  full_name: string | null;
  email: string;
  avatar_url: string | null;
  regional: string | null;
}

interface LeaderSelectorProps {
  selectedLeaders: string[];
  onLeadersChange: (leaders: string[]) => void;
  label?: string;
}

export const LeaderSelector: React.FC<LeaderSelectorProps> = ({
  selectedLeaders,
  onLeadersChange,
  label = "Líderes con acceso",
}) => {
  const [searchQuery, setSearchQuery] = useState("");

  // Fetch leaders with role 'lider'
  const { data: leaders = [], isLoading } = useQuery({
    queryKey: ["leaders-for-selector"],
    queryFn: async () => {
      const client = getSupabaseClient();
      
      // Get user_ids with lider role
      const { data: leaderRoles, error: rolesError } = await client
        .from("user_roles")
        .select("user_id")
        .eq("role", "lider");

      if (rolesError) throw rolesError;

      if (!leaderRoles || leaderRoles.length === 0) return [];

      const leaderUserIds = leaderRoles.map((r: any) => r.user_id);

      // Get profiles for those leaders
      const { data: profiles, error: profilesError } = await client
        .from("profiles")
        .select("user_id, full_name, email, avatar_url, regional")
        .in("user_id", leaderUserIds)
        .order("full_name");

      if (profilesError) throw profilesError;

      return profiles as Leader[];
    },
  });

  const filteredLeaders = leaders.filter((leader) => {
    const query = searchQuery.toLowerCase();
    return (
      leader.full_name?.toLowerCase().includes(query) ||
      leader.email.toLowerCase().includes(query) ||
      leader.regional?.toLowerCase().includes(query)
    );
  });

  const handleToggleLeader = (userId: string) => {
    if (selectedLeaders.includes(userId)) {
      onLeadersChange(selectedLeaders.filter((id) => id !== userId));
    } else {
      onLeadersChange([...selectedLeaders, userId]);
    }
  };

  const handleRemoveLeader = (userId: string) => {
    onLeadersChange(selectedLeaders.filter((id) => id !== userId));
  };

  const getInitials = (name: string | null) => {
    if (!name) return "L";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const selectedLeaderProfiles = leaders.filter((l) =>
    selectedLeaders.includes(l.user_id)
  );

  return (
    <div className="space-y-3">
      <Label className="flex items-center gap-2">
        <Crown className="h-4 w-4 text-muted-foreground" />
        {label}
      </Label>

      {/* Selected Leaders */}
      {selectedLeaderProfiles.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {selectedLeaderProfiles.map((leader) => (
            <Badge key={leader.user_id} variant="secondary" className="gap-1 pr-1">
              <span className="truncate max-w-[150px]">
                {leader.full_name || leader.email}
              </span>
              <Button
                variant="ghost"
                size="icon"
                className="h-4 w-4 hover:bg-transparent"
                onClick={() => handleRemoveLeader(leader.user_id)}
              >
                <X className="h-3 w-3" />
              </Button>
            </Badge>
          ))}
        </div>
      )}

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Buscar líder..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* Leaders List */}
      <ScrollArea className="h-[200px] border rounded-md p-2">
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-5 w-5 animate-spin text-primary" />
          </div>
        ) : filteredLeaders.length > 0 ? (
          <div className="space-y-1">
            {filteredLeaders.map((leader) => (
              <div
                key={leader.user_id}
                className="flex items-center gap-3 p-2 rounded-md hover:bg-muted/50 cursor-pointer"
                onClick={() => handleToggleLeader(leader.user_id)}
              >
                <Checkbox
                  checked={selectedLeaders.includes(leader.user_id)}
                  onCheckedChange={() => handleToggleLeader(leader.user_id)}
                />
                <Avatar className="h-7 w-7">
                  <AvatarImage src={leader.avatar_url || undefined} />
                  <AvatarFallback className="text-xs bg-primary/10 text-primary">
                    {getInitials(leader.full_name)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">
                    {leader.full_name || "Sin nombre"}
                  </p>
                  <p className="text-xs text-muted-foreground truncate">
                    {leader.email}
                    {leader.regional && ` • ${leader.regional}`}
                  </p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <Crown className="h-8 w-8 text-muted-foreground/50 mb-2" />
            <p className="text-sm text-muted-foreground">
              {searchQuery ? "No se encontraron líderes" : "No hay líderes disponibles"}
            </p>
          </div>
        )}
      </ScrollArea>
    </div>
  );
};
