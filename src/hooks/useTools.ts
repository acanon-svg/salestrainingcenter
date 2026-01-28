import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export interface Tool {
  id: string;
  name: string;
  description: string | null;
  type: string;
  is_active: boolean;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  target_teams: string[] | null;
}

export interface CalculatorVariable {
  id: string;
  tool_id: string;
  name: string;
  label: string;
  description: string | null;
  variable_type: string;
  default_value: number;
  min_value: number | null;
  max_value: number | null;
  weight: number;
  visible_to_students: boolean;
  visible_to_leaders: boolean;
  order_index: number;
  created_at: string;
}

export interface CalculatorFormula {
  id: string;
  tool_id: string;
  name: string;
  label: string;
  description: string | null;
  formula: string;
  result_type: string;
  visible_to_students: boolean;
  visible_to_leaders: boolean;
  order_index: number;
  created_at: string;
}

export const useTools = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: tools, isLoading } = useQuery({
    queryKey: ["tools"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("tools")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as Tool[];
    },
  });

  const createTool = useMutation({
    mutationFn: async (tool: { name: string; description?: string | null; type?: string; is_active?: boolean; target_teams?: string[] | null }) => {
      const { data, error } = await supabase
        .from("tools")
        .insert([tool])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tools"] });
      toast({ title: "Herramienta creada correctamente" });
    },
    onError: (error) => {
      toast({
        title: "Error al crear herramienta",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const updateTool = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Tool> & { id: string }) => {
      const { data, error } = await supabase
        .from("tools")
        .update(updates)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tools"] });
      toast({ title: "Herramienta actualizada correctamente" });
    },
    onError: (error) => {
      toast({
        title: "Error al actualizar herramienta",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const deleteTool = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("tools").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tools"] });
      toast({ title: "Herramienta eliminada correctamente" });
    },
    onError: (error) => {
      toast({
        title: "Error al eliminar herramienta",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  return {
    tools,
    isLoading,
    createTool,
    updateTool,
    deleteTool,
  };
};

export const useCalculatorVariables = (toolId: string | null) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: variables, isLoading } = useQuery({
    queryKey: ["calculator-variables", toolId],
    queryFn: async () => {
      if (!toolId) return [];
      const { data, error } = await supabase
        .from("calculator_variables")
        .select("*")
        .eq("tool_id", toolId)
        .order("order_index", { ascending: true });

      if (error) throw error;
      return data as CalculatorVariable[];
    },
    enabled: !!toolId,
  });

  const createVariable = useMutation({
    mutationFn: async (variable: { tool_id: string; name: string; label: string; description?: string | null; variable_type?: string; default_value?: number; min_value?: number | null; max_value?: number | null; weight?: number; visible_to_students?: boolean; visible_to_leaders?: boolean; order_index?: number }) => {
      const { data, error } = await supabase
        .from("calculator_variables")
        .insert([variable])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["calculator-variables", toolId] });
      toast({ title: "Variable creada correctamente" });
    },
    onError: (error) => {
      toast({
        title: "Error al crear variable",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const updateVariable = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<CalculatorVariable> & { id: string }) => {
      const { data, error } = await supabase
        .from("calculator_variables")
        .update(updates)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["calculator-variables", toolId] });
      toast({ title: "Variable actualizada correctamente" });
    },
    onError: (error) => {
      toast({
        title: "Error al actualizar variable",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const deleteVariable = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("calculator_variables").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["calculator-variables", toolId] });
      toast({ title: "Variable eliminada correctamente" });
    },
    onError: (error) => {
      toast({
        title: "Error al eliminar variable",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  return {
    variables,
    isLoading,
    createVariable,
    updateVariable,
    deleteVariable,
  };
};

export const useCalculatorFormulas = (toolId: string | null) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: formulas, isLoading } = useQuery({
    queryKey: ["calculator-formulas", toolId],
    queryFn: async () => {
      if (!toolId) return [];
      const { data, error } = await supabase
        .from("calculator_formulas")
        .select("*")
        .eq("tool_id", toolId)
        .order("order_index", { ascending: true });

      if (error) throw error;
      return data as CalculatorFormula[];
    },
    enabled: !!toolId,
  });

  const createFormula = useMutation({
    mutationFn: async (formula: { tool_id: string; name: string; label: string; formula: string; description?: string | null; result_type?: string; visible_to_students?: boolean; visible_to_leaders?: boolean; order_index?: number }) => {
      const { data, error } = await supabase
        .from("calculator_formulas")
        .insert([formula])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["calculator-formulas", toolId] });
      toast({ title: "Fórmula creada correctamente" });
    },
    onError: (error) => {
      toast({
        title: "Error al crear fórmula",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const updateFormula = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<CalculatorFormula> & { id: string }) => {
      const { data, error } = await supabase
        .from("calculator_formulas")
        .update(updates)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["calculator-formulas", toolId] });
      toast({ title: "Fórmula actualizada correctamente" });
    },
    onError: (error) => {
      toast({
        title: "Error al actualizar fórmula",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const deleteFormula = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("calculator_formulas").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["calculator-formulas", toolId] });
      toast({ title: "Fórmula eliminada correctamente" });
    },
    onError: (error) => {
      toast({
        title: "Error al eliminar fórmula",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  return {
    formulas,
    isLoading,
    createFormula,
    updateFormula,
    deleteFormula,
  };
};
