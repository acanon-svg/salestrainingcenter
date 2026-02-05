import React from "react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { HelpCircle } from "lucide-react";
import { useMaterialFaqs } from "@/hooks/useMaterialFaqs";
import { cn } from "@/lib/utils";

interface FaqDisplayProps {
  materialId: string;
  className?: string;
}

export const FaqDisplay: React.FC<FaqDisplayProps> = ({ materialId, className }) => {
  const { data: faqs, isLoading } = useMaterialFaqs(materialId);

  if (isLoading) {
    return null;
  }

  if (!faqs || faqs.length === 0) {
    return null;
  }

  return (
    <div className={cn("border-t pt-4", className)}>
      <div className="flex items-center gap-2 mb-3">
        <HelpCircle className="h-5 w-5 text-primary" />
        <h3 className="font-semibold">Preguntas Frecuentes</h3>
      </div>
      <Accordion type="single" collapsible className="w-full">
        {faqs.map((faq) => (
          <AccordionItem key={faq.id} value={faq.id}>
            <AccordionTrigger className="text-left text-sm hover:no-underline">
              {faq.question}
            </AccordionTrigger>
            <AccordionContent>
              <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                {faq.answer}
              </p>
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </div>
  );
};
