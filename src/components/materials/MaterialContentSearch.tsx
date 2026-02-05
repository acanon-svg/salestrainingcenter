import React from "react";
import { Input } from "@/components/ui/input";
import { Search, X } from "lucide-react";
import { Button } from "@/components/ui/button";

interface MaterialContentSearchProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  resultsCount?: number;
}

export const MaterialContentSearch: React.FC<MaterialContentSearchProps> = ({
  value,
  onChange,
  placeholder = "Buscar dentro del material...",
  resultsCount,
}) => {
  return (
    <div className="relative">
      <div className="relative flex items-center">
        <Search className="absolute left-3 h-4 w-4 text-muted-foreground" />
        <Input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="pl-9 pr-20"
        />
        {value && (
          <div className="absolute right-2 flex items-center gap-1">
            {resultsCount !== undefined && (
              <span className="text-xs text-muted-foreground">
                {resultsCount} {resultsCount === 1 ? "resultado" : "resultados"}
              </span>
            )}
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0"
              onClick={() => onChange("")}
            >
              <X className="h-3 w-3" />
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};
