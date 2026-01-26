import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  useGlossaryTerms,
  useCreateGlossaryTerm,
  useUpdateGlossaryTerm,
  useDeleteGlossaryTerm,
  GlossaryTerm,
} from "@/hooks/useGlossary";
import { Plus, Edit, Trash2, Search, BookOpen, X, Loader2 } from "lucide-react";

interface GlossaryManagerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const GlossaryManager: React.FC<GlossaryManagerProps> = ({
  open,
  onOpenChange,
}) => {
  const { data: terms, isLoading } = useGlossaryTerms();
  const createMutation = useCreateGlossaryTerm();
  const updateMutation = useUpdateGlossaryTerm();
  const deleteMutation = useDeleteGlossaryTerm();

  const [searchQuery, setSearchQuery] = useState("");
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingTerm, setEditingTerm] = useState<GlossaryTerm | null>(null);
  const [deletingTerm, setDeletingTerm] = useState<GlossaryTerm | null>(null);

  // Form state
  const [term, setTerm] = useState("");
  const [definition, setDefinition] = useState("");
  const [example, setExample] = useState("");
  const [relatedTermsInput, setRelatedTermsInput] = useState("");

  const filteredTerms = terms?.filter(
    (t) =>
      t.term.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.definition.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const resetForm = () => {
    setTerm("");
    setDefinition("");
    setExample("");
    setRelatedTermsInput("");
    setEditingTerm(null);
  };

  const openEditForm = (termToEdit: GlossaryTerm) => {
    setEditingTerm(termToEdit);
    setTerm(termToEdit.term);
    setDefinition(termToEdit.definition);
    setExample(termToEdit.example || "");
    setRelatedTermsInput(termToEdit.related_terms?.join(", ") || "");
    setIsFormOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const relatedTerms = relatedTermsInput
      .split(",")
      .map((t) => t.trim())
      .filter((t) => t.length > 0);

    const data = {
      term: term.trim(),
      definition: definition.trim(),
      example: example.trim() || undefined,
      related_terms: relatedTerms.length > 0 ? relatedTerms : undefined,
    };

    if (editingTerm) {
      await updateMutation.mutateAsync({ id: editingTerm.id, ...data });
    } else {
      await createMutation.mutateAsync(data);
    }

    resetForm();
    setIsFormOpen(false);
  };

  const confirmDelete = async () => {
    if (deletingTerm) {
      await deleteMutation.mutateAsync(deletingTerm.id);
      setDeletingTerm(null);
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <BookOpen className="h-5 w-5" />
              Glosario de Términos
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {/* Search and Add */}
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar términos..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
              <Button onClick={() => { resetForm(); setIsFormOpen(true); }}>
                <Plus className="h-4 w-4 mr-2" />
                Nuevo Término
              </Button>
            </div>

            {/* Terms List */}
            <ScrollArea className="h-[400px] pr-4">
              {isLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                </div>
              ) : filteredTerms && filteredTerms.length > 0 ? (
                <div className="space-y-3">
                  {filteredTerms.map((t) => (
                    <div
                      key={t.id}
                      className="p-4 rounded-lg border bg-card hover:shadow-sm transition-shadow"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <h4 className="font-semibold text-lg">{t.term}</h4>
                          <p className="text-muted-foreground mt-1">{t.definition}</p>
                          {t.example && (
                            <p className="text-sm mt-2 italic text-muted-foreground/80">
                              Ejemplo: {t.example}
                            </p>
                          )}
                          {t.related_terms && t.related_terms.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-2">
                              {t.related_terms.map((rt) => (
                                <Badge key={rt} variant="outline" className="text-xs">
                                  {rt}
                                </Badge>
                              ))}
                            </div>
                          )}
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => openEditForm(t)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-destructive hover:text-destructive"
                            onClick={() => setDeletingTerm(t)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <BookOpen className="h-12 w-12 text-muted-foreground mb-2" />
                  <p className="text-muted-foreground">
                    {searchQuery
                      ? "No se encontraron términos"
                      : "No hay términos en el glosario"}
                  </p>
                </div>
              )}
            </ScrollArea>
          </div>
        </DialogContent>
      </Dialog>

      {/* Form Dialog */}
      <Dialog open={isFormOpen} onOpenChange={(open) => { if (!open) resetForm(); setIsFormOpen(open); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingTerm ? "Editar Término" : "Nuevo Término"}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="term">Término *</Label>
              <Input
                id="term"
                value={term}
                onChange={(e) => setTerm(e.target.value)}
                placeholder="Ej: ROI"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="definition">Definición *</Label>
              <Textarea
                id="definition"
                value={definition}
                onChange={(e) => setDefinition(e.target.value)}
                placeholder="Escribe la definición del término..."
                rows={3}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="example">Ejemplo (opcional)</Label>
              <Input
                id="example"
                value={example}
                onChange={(e) => setExample(e.target.value)}
                placeholder="Ej: Si inviertes $100 y ganas $150, tu ROI es 50%"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="relatedTerms">Términos relacionados (separados por coma)</Label>
              <Input
                id="relatedTerms"
                value={relatedTermsInput}
                onChange={(e) => setRelatedTermsInput(e.target.value)}
                placeholder="Ej: Retorno de inversión, Rentabilidad"
              />
            </div>
            <div className="flex justify-end gap-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => { resetForm(); setIsFormOpen(false); }}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={createMutation.isPending || updateMutation.isPending}
              >
                {createMutation.isPending || updateMutation.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : null}
                {editingTerm ? "Actualizar" : "Crear"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deletingTerm} onOpenChange={(open) => !open && setDeletingTerm(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar término?</AlertDialogTitle>
            <AlertDialogDescription>
              Estás a punto de eliminar el término "{deletingTerm?.term}". Esta acción no se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};
