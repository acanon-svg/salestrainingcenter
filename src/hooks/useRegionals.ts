import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export const useRegionals = () => {
  return useQuery({
    queryKey: ["regionals"],
    queryFn: async () => {
      // Get distinct regionals from profiles
      const { data, error } = await supabase
        .from("profiles")
        .select("regional")
        .not("regional", "is", null);

      if (error) throw error;

      // Extract unique regionals
      const regionals = [...new Set(data.map((p) => p.regional).filter(Boolean))] as string[];
      return regionals.sort();
    },
  });
};
