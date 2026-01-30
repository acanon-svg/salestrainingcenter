import React, { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Star, Send, Loader2, CheckCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface CourseFeedbackFormProps {
  courseId: string;
  courseTitle: string;
  onSubmit: (data: { rating: number; message: string }) => Promise<void>;
  isSubmitting: boolean;
  hasSubmitted: boolean;
}

export const CourseFeedbackForm: React.FC<CourseFeedbackFormProps> = ({
  courseId,
  courseTitle,
  onSubmit,
  isSubmitting,
  hasSubmitted,
}) => {
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [message, setMessage] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (rating === 0) return;

    await onSubmit({ rating, message });
  };

  if (hasSubmitted) {
    return (
      <Card className="border-success/30 bg-success/5">
        <CardContent className="py-8 text-center">
          <CheckCircle className="w-12 h-12 text-success mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">¡Gracias por tu feedback!</h3>
          <p className="text-sm text-muted-foreground">
            Tu opinión nos ayuda a mejorar los cursos y la experiencia de aprendizaje.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-primary/20 bg-primary/5">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Star className="w-5 h-5 text-addi-yellow" />
          ¿Cómo calificarías este curso?
        </CardTitle>
        <CardDescription>
          Tu opinión sobre "{courseTitle}" nos ayuda a mejorar
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Star Rating */}
          <div className="space-y-2">
            <Label>Calificación</Label>
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  onMouseEnter={() => setHoverRating(star)}
                  onMouseLeave={() => setHoverRating(0)}
                  className="p-1 transition-transform hover:scale-110 focus:outline-none"
                >
                  <Star
                    className={cn(
                      "w-8 h-8 transition-colors",
                      (hoverRating || rating) >= star
                        ? "fill-addi-yellow text-addi-yellow"
                        : "text-muted-foreground"
                    )}
                  />
                </button>
              ))}
            </div>
            {rating > 0 && (
              <p className="text-sm text-muted-foreground">
                {rating === 1 && "Muy malo"}
                {rating === 2 && "Malo"}
                {rating === 3 && "Regular"}
                {rating === 4 && "Bueno"}
                {rating === 5 && "Excelente"}
              </p>
            )}
          </div>

          {/* Comments */}
          <div className="space-y-2">
            <Label htmlFor="feedback-message">Comentarios (opcional)</Label>
            <Textarea
              id="feedback-message"
              placeholder="Cuéntanos qué te pareció el curso, qué mejorarías o qué te gustó más..."
              rows={3}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
            />
          </div>

          {/* Submit Button */}
          <Button 
            type="submit" 
            className="w-full gap-2"
            disabled={rating === 0 || isSubmitting}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Enviando...
              </>
            ) : (
              <>
                <Send className="w-4 h-4" />
                Enviar Feedback
              </>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};
