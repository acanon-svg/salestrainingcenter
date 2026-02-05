import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
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
import { Plus, Pencil, Trash2, HelpCircle, Save, X } from "lucide-react";
import {
  useMaterialFaqs,
  useCreateFaq,
  useUpdateFaq,
  useDeleteFaq,
  MaterialFaq,
} from "@/hooks/useMaterialFaqs";

interface FaqManagerProps {
  materialId: string;
}

export const FaqManager: React.FC<FaqManagerProps> = ({ materialId }) => {
  const { data: faqs, isLoading } = useMaterialFaqs(materialId);
  const createFaq = useCreateFaq();
  const updateFaq = useUpdateFaq();
  const deleteFaq = useDeleteFaq();

  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [newQuestion, setNewQuestion] = useState("");
  const [newAnswer, setNewAnswer] = useState("");
  const [editQuestion, setEditQuestion] = useState("");
  const [editAnswer, setEditAnswer] = useState("");

  const handleCreate = async () => {
    if (!newQuestion.trim() || !newAnswer.trim()) return;

    await createFaq.mutateAsync({
      material_id: materialId,
      question: newQuestion.trim(),
      answer: newAnswer.trim(),
      order_index: (faqs?.length || 0) + 1,
    });

    setNewQuestion("");
    setNewAnswer("");
    setIsAdding(false);
  };

  const handleEdit = (faq: MaterialFaq) => {
    setEditingId(faq.id);
    setEditQuestion(faq.question);
    setEditAnswer(faq.answer);
  };

  const handleUpdate = async () => {
    if (!editingId || !editQuestion.trim() || !editAnswer.trim()) return;

    await updateFaq.mutateAsync({
      id: editingId,
      question: editQuestion.trim(),
      answer: editAnswer.trim(),
    });

    setEditingId(null);
    setEditQuestion("");
    setEditAnswer("");
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    await deleteFaq.mutateAsync(deleteId);
    setDeleteId(null);
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <HelpCircle className="h-5 w-5" />
            Preguntas Frecuentes
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Cargando...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <HelpCircle className="h-5 w-5" />
          Preguntas Frecuentes ({faqs?.length || 0})
        </CardTitle>
        {!isAdding && (
          <Button size="sm" onClick={() => setIsAdding(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Añadir
          </Button>
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Add new FAQ form */}
        {isAdding && (
          <div className="border rounded-lg p-4 space-y-3 bg-muted/30">
            <Input
              placeholder="Escribe la pregunta..."
              value={newQuestion}
              onChange={(e) => setNewQuestion(e.target.value)}
            />
            <Textarea
              placeholder="Escribe la respuesta..."
              value={newAnswer}
              onChange={(e) => setNewAnswer(e.target.value)}
              rows={3}
            />
            <div className="flex gap-2">
              <Button
                size="sm"
                onClick={handleCreate}
                disabled={createFaq.isPending}
              >
                <Save className="h-4 w-4 mr-2" />
                Guardar
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  setIsAdding(false);
                  setNewQuestion("");
                  setNewAnswer("");
                }}
              >
                <X className="h-4 w-4 mr-2" />
                Cancelar
              </Button>
            </div>
          </div>
        )}

        {/* FAQ List */}
        {faqs && faqs.length > 0 ? (
          <Accordion type="single" collapsible className="w-full">
            {faqs.map((faq) => (
              <AccordionItem key={faq.id} value={faq.id}>
                {editingId === faq.id ? (
                  <div className="border rounded-lg p-4 space-y-3 my-2">
                    <Input
                      value={editQuestion}
                      onChange={(e) => setEditQuestion(e.target.value)}
                    />
                    <Textarea
                      value={editAnswer}
                      onChange={(e) => setEditAnswer(e.target.value)}
                      rows={3}
                    />
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        onClick={handleUpdate}
                        disabled={updateFaq.isPending}
                      >
                        <Save className="h-4 w-4 mr-2" />
                        Guardar
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setEditingId(null)}
                      >
                        <X className="h-4 w-4 mr-2" />
                        Cancelar
                      </Button>
                    </div>
                  </div>
                ) : (
                  <>
                    <AccordionTrigger className="hover:no-underline">
                      <div className="flex items-center gap-2 text-left">
                        <span>{faq.question}</span>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent>
                      <div className="pt-2 pb-4">
                        <p className="text-muted-foreground whitespace-pre-wrap">
                          {faq.answer}
                        </p>
                        <div className="flex gap-2 mt-4">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleEdit(faq)}
                          >
                            <Pencil className="h-4 w-4 mr-2" />
                            Editar
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => setDeleteId(faq.id)}
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Eliminar
                          </Button>
                        </div>
                      </div>
                    </AccordionContent>
                  </>
                )}
              </AccordionItem>
            ))}
          </Accordion>
        ) : (
          !isAdding && (
            <p className="text-muted-foreground text-center py-4">
              No hay preguntas frecuentes. Añade la primera.
            </p>
          )
        )}

        {/* Delete confirmation dialog */}
        <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>¿Eliminar pregunta?</AlertDialogTitle>
              <AlertDialogDescription>
                Esta acción no se puede deshacer. La pregunta frecuente será
                eliminada permanentemente.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction onClick={handleDelete}>
                Eliminar
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </CardContent>
    </Card>
  );
};
