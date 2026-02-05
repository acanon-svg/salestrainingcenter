import React, { useState, useMemo } from "react";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Search, FileText, BookOpen, HelpCircle, X } from "lucide-react";
import { useGlossaryTerms } from "@/hooks/useGlossary";
import { useAllFaqs } from "@/hooks/useMaterialFaqs";
import { TrainingMaterial } from "@/hooks/useTrainingMaterials";
import { cn } from "@/lib/utils";

interface EnhancedSearchProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  materials: TrainingMaterial[] | undefined;
  onViewMaterial: (material: TrainingMaterial) => void;
  placeholder?: string;
}

export const EnhancedSearch: React.FC<EnhancedSearchProps> = ({
  searchQuery,
  onSearchChange,
  materials,
  onViewMaterial,
  placeholder = "Buscar materiales, glosario y preguntas frecuentes...",
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const { data: glossaryTerms } = useGlossaryTerms();
  const { data: allFaqs } = useAllFaqs();

  // Search results combining materials, glossary, and FAQs
  const searchResults = useMemo(() => {
    if (!searchQuery || searchQuery.length < 2) {
      return { materials: [], glossary: [], faqs: [] };
    }

    const query = searchQuery.toLowerCase();

    // Filter materials
    const matchingMaterials = materials?.filter((m) => {
      return (
        m.title.toLowerCase().includes(query) ||
        m.description?.toLowerCase().includes(query) ||
        m.keywords?.some((k) => k.toLowerCase().includes(query))
      );
    }).slice(0, 5) || [];

    // Filter glossary terms
    const matchingGlossary = glossaryTerms?.filter((term) => {
      return (
        term.term.toLowerCase().includes(query) ||
        term.definition.toLowerCase().includes(query)
      );
    }).slice(0, 5) || [];

    // Filter FAQs
    const matchingFaqs = allFaqs?.filter((faq) => {
      return (
        faq.question.toLowerCase().includes(query) ||
        faq.answer.toLowerCase().includes(query)
      );
    }).slice(0, 5) || [];

    return {
      materials: matchingMaterials,
      glossary: matchingGlossary,
      faqs: matchingFaqs,
    };
  }, [searchQuery, materials, glossaryTerms, allFaqs]);

  const hasResults = 
    searchResults.materials.length > 0 ||
    searchResults.glossary.length > 0 ||
    searchResults.faqs.length > 0;

  const showDropdown = isFocused && searchQuery.length >= 2 && hasResults;

  return (
    <div className="relative flex-1">
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
      <Input
        placeholder={placeholder}
        value={searchQuery}
        onChange={(e) => onSearchChange(e.target.value)}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setTimeout(() => setIsFocused(false), 200)}
        className="pl-9 pr-9"
      />
      {searchQuery && (
        <button
          onClick={() => onSearchChange("")}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
        >
          <X className="h-4 w-4" />
        </button>
      )}

      {/* Search results dropdown */}
      {showDropdown && (
        <Card className="absolute top-full left-0 right-0 mt-1 z-50 max-h-96 overflow-y-auto shadow-lg">
          <CardContent className="p-2 space-y-3">
            {/* Materials section */}
            {searchResults.materials.length > 0 && (
              <div>
                <div className="flex items-center gap-2 px-2 py-1 text-xs font-semibold text-muted-foreground uppercase">
                  <FileText className="h-3 w-3" />
                  Materiales
                </div>
                {searchResults.materials.map((material) => (
                  <button
                    key={material.id}
                    onClick={() => {
                      onViewMaterial(material);
                      onSearchChange("");
                    }}
                    className="w-full text-left px-3 py-2 rounded-md hover:bg-accent transition-colors"
                  >
                    <div className="font-medium text-sm">{material.title}</div>
                    {material.description && (
                      <div className="text-xs text-muted-foreground line-clamp-1">
                        {material.description}
                      </div>
                    )}
                    <div className="flex gap-1 mt-1">
                      <Badge variant="outline" className="text-[10px]">
                        {material.type}
                      </Badge>
                    </div>
                  </button>
                ))}
              </div>
            )}

            {/* Glossary section */}
            {searchResults.glossary.length > 0 && (
              <div>
                <div className="flex items-center gap-2 px-2 py-1 text-xs font-semibold text-muted-foreground uppercase">
                  <BookOpen className="h-3 w-3" />
                  Glosario
                </div>
                {searchResults.glossary.map((term) => (
                  <div
                    key={term.id}
                    className="px-3 py-2 rounded-md bg-muted/30"
                  >
                    <div className="font-medium text-sm">{term.term}</div>
                    <div className="text-xs text-muted-foreground line-clamp-2">
                      {term.definition}
                    </div>
                    {term.example && (
                      <div className="text-xs text-primary italic mt-1">
                        Ejemplo: {term.example}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* FAQs section */}
            {searchResults.faqs.length > 0 && (
              <div>
                <div className="flex items-center gap-2 px-2 py-1 text-xs font-semibold text-muted-foreground uppercase">
                  <HelpCircle className="h-3 w-3" />
                  Preguntas Frecuentes
                </div>
                {searchResults.faqs.map((faq) => (
                  <div
                    key={faq.id}
                    className="px-3 py-2 rounded-md hover:bg-accent transition-colors"
                  >
                    <div className="font-medium text-sm">{faq.question}</div>
                    <div className="text-xs text-muted-foreground line-clamp-2">
                      {faq.answer}
                    </div>
                    {faq.material && (
                      <button
                        onClick={() => {
                          const material = materials?.find(m => m.id === faq.material?.id);
                          if (material) {
                            onViewMaterial(material);
                            onSearchChange("");
                          }
                        }}
                        className="text-xs text-primary mt-1 hover:underline"
                      >
                        Ver material: {faq.material.title}
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};
