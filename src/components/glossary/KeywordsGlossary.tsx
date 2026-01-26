import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useGlossaryTermsByKeywords, GlossaryTerm } from "@/hooks/useGlossary";
import { BookOpen, Loader2 } from "lucide-react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Button } from "@/components/ui/button";
import { ChevronDown, ChevronUp } from "lucide-react";

interface KeywordsGlossaryProps {
  keywords: string[] | null | undefined;
  tags?: string[] | null | undefined;
  className?: string;
}

export const KeywordsGlossary: React.FC<KeywordsGlossaryProps> = ({
  keywords,
  tags,
  className = "",
}) => {
  const [isOpen, setIsOpen] = React.useState(true);
  
  // Combine keywords and tags for matching
  const allTerms = React.useMemo(() => {
    const combined: string[] = [];
    if (keywords) combined.push(...keywords);
    if (tags) combined.push(...tags);
    return combined;
  }, [keywords, tags]);

  const { data: glossaryTerms, isLoading } = useGlossaryTermsByKeywords(allTerms);

  // Don't render anything if no keywords/tags or no matching terms
  if (!allTerms.length || (!isLoading && (!glossaryTerms || glossaryTerms.length === 0))) {
    return null;
  }

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <Card className={`border-primary/20 bg-primary/5 ${className}`}>
        <CardHeader className="py-3">
          <CollapsibleTrigger asChild>
            <Button variant="ghost" className="w-full justify-between p-0 h-auto hover:bg-transparent">
              <CardTitle className="flex items-center gap-2 text-base">
                <BookOpen className="h-4 w-4 text-primary" />
                Glosario de Términos
              </CardTitle>
              {isOpen ? (
                <ChevronUp className="h-4 w-4 text-muted-foreground" />
              ) : (
                <ChevronDown className="h-4 w-4 text-muted-foreground" />
              )}
            </Button>
          </CollapsibleTrigger>
        </CardHeader>
        <CollapsibleContent>
          <CardContent className="pt-0 space-y-3">
            {isLoading ? (
              <div className="flex items-center justify-center py-4">
                <Loader2 className="h-5 w-5 animate-spin text-primary" />
              </div>
            ) : (
              glossaryTerms?.map((term) => (
                <GlossaryTermItem key={term.id} term={term} />
              ))
            )}
          </CardContent>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  );
};

interface GlossaryTermItemProps {
  term: GlossaryTerm;
}

const GlossaryTermItem: React.FC<GlossaryTermItemProps> = ({ term }) => {
  return (
    <div className="p-3 rounded-lg bg-card border">
      <div className="flex items-start gap-2">
        <Badge variant="default" className="shrink-0 mt-0.5">
          {term.term}
        </Badge>
        <div className="flex-1 min-w-0">
          <p className="text-sm text-muted-foreground">{term.definition}</p>
          {term.example && (
            <p className="text-xs mt-1 italic text-muted-foreground/70">
              Ejemplo: {term.example}
            </p>
          )}
          {term.related_terms && term.related_terms.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              <span className="text-xs text-muted-foreground">Ver también:</span>
              {term.related_terms.map((rt) => (
                <Badge key={rt} variant="outline" className="text-xs py-0">
                  {rt}
                </Badge>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
