import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Json } from "@/integrations/supabase/types";

export interface TeamDataEntry {
  id: string;
  data_name: string;
  data_content: Record<string, unknown>;
  description: string | null;
  uploaded_by: string | null;
  created_at: string;
  updated_at: string;
}

export const useChatbotTeamData = () => {
  const [teamData, setTeamData] = useState<TeamDataEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  const fetchTeamData = async () => {
    try {
      const { data, error } = await supabase
        .from("chatbot_team_data")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setTeamData(data as TeamDataEntry[]);
    } catch (error) {
      console.error("Error fetching team data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const addTeamData = async (
    dataName: string,
    dataContent: Record<string, unknown>,
    description?: string
  ) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      const { data, error } = await supabase
        .from("chatbot_team_data")
        .insert([{
          data_name: dataName,
          data_content: dataContent as unknown as Json,
          description: description || null,
          uploaded_by: user?.id || null,
        }])
        .select()
        .single();

      if (error) throw error;

      setTeamData((prev) => [data as TeamDataEntry, ...prev]);
      
      toast({
        title: "Datos agregados",
        description: "Los datos del equipo han sido guardados correctamente.",
      });

      return true;
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Error desconocido";
      toast({
        title: "Error",
        description: message,
        variant: "destructive",
      });
      return false;
    }
  };

  const updateTeamData = async (
    id: string,
    dataName: string,
    dataContent: Record<string, unknown>,
    description?: string
  ) => {
    try {
      const { error } = await supabase
        .from("chatbot_team_data")
        .update({
          data_name: dataName,
          data_content: dataContent as unknown as Json,
          description: description || null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", id);

      if (error) throw error;

      setTeamData((prev) =>
        prev.map((item) =>
          item.id === id
            ? { ...item, data_name: dataName, data_content: dataContent, description: description || null }
            : item
        )
      );

      toast({
        title: "Datos actualizados",
        description: "Los datos del equipo han sido actualizados.",
      });

      return true;
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Error desconocido";
      toast({
        title: "Error",
        description: message,
        variant: "destructive",
      });
      return false;
    }
  };

  const deleteTeamData = async (id: string) => {
    try {
      const { error } = await supabase
        .from("chatbot_team_data")
        .delete()
        .eq("id", id);

      if (error) throw error;

      setTeamData((prev) => prev.filter((item) => item.id !== id));

      toast({
        title: "Datos eliminados",
        description: "Los datos han sido eliminados correctamente.",
      });

      return true;
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Error desconocido";
      toast({
        title: "Error",
        description: message,
        variant: "destructive",
      });
      return false;
    }
  };

  useEffect(() => {
    fetchTeamData();
  }, []);

  return {
    teamData,
    isLoading,
    addTeamData,
    updateTeamData,
    deleteTeamData,
    refetch: fetchTeamData,
  };
};
