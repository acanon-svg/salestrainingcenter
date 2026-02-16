import React from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { X } from "lucide-react";
import { QuizQuestionState, questionTypeLabels, isAdvancedType } from "./types";
import { MindMapEditor } from "./editors/MindMapEditor";
import { FillBlanksEditor } from "./editors/FillBlanksEditor";
import { MatchColumnsEditor } from "./editors/MatchColumnsEditor";
import { ImagePuzzleEditor } from "./editors/ImagePuzzleEditor";

interface Props {
  question: QuizQuestionState;
  index: number;
  onUpdate: (question: QuizQuestionState) => void;
  onDelete: () => void;
}

export const QuestionEditor: React.FC<Props> = ({ question, index, onUpdate, onDelete }) => {
  const isAdvanced = isAdvancedType(question.question_type);

  return (
    <div className="p-4 rounded-lg border border-border/50 space-y-4">
      <div className="flex items-start gap-4">
        <span className="text-lg font-semibold text-primary">{index + 1}.</span>
        <div className="flex-1 space-y-4">
          <div className="flex gap-2 items-center">
            <Badge variant="outline">{questionTypeLabels[question.question_type]}</Badge>
            <div className="flex items-center gap-2 ml-auto">
              <Label className="text-sm">Puntos:</Label>
              <Input
                type="number"
                min={1}
                max={100}
                className="w-20"
                value={question.points}
                onChange={e =>
                  onUpdate({ ...question, points: Math.min(100, Math.max(1, parseInt(e.target.value) || 1)) })
                }
              />
            </div>
          </div>

          <Input
            placeholder={isAdvanced ? "Instrucción o enunciado de la actividad..." : "Escribe la pregunta..."}
            value={question.question}
            onChange={e => onUpdate({ ...question, question: e.target.value })}
          />

          {/* Standard MC/TF options */}
          {!isAdvanced && (
            <div className="grid gap-2 md:grid-cols-2">
              {(question.options as { text: string; is_correct: boolean }[]).map((opt, oIndex) => (
                <div key={oIndex} className="flex items-center gap-2">
                  <input
                    type="radio"
                    name={`correct-${question.id}`}
                    checked={opt.is_correct}
                    onChange={() => {
                      const newOptions = question.options.map((o: any, i: number) => ({
                        ...o,
                        is_correct: i === oIndex,
                      }));
                      onUpdate({ ...question, options: newOptions });
                    }}
                    className="w-4 h-4"
                  />
                  {question.question_type === "true_false" ? (
                    <span className={`px-3 py-2 rounded border ${opt.is_correct ? "border-success bg-success/10" : "border-border"}`}>
                      {opt.text}
                    </span>
                  ) : (
                    <Input
                      placeholder={`Opción ${oIndex + 1}`}
                      value={opt.text}
                      onChange={e => {
                        const newOptions = [...question.options];
                        newOptions[oIndex] = { ...newOptions[oIndex], text: e.target.value };
                        onUpdate({ ...question, options: newOptions });
                      }}
                      className={opt.is_correct ? "border-success" : ""}
                    />
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Advanced type editors */}
          {question.question_type === "mind_map" && (
            <MindMapEditor
              data={question.options}
              onChange={options => onUpdate({ ...question, options })}
            />
          )}
          {question.question_type === "fill_blanks" && (
            <FillBlanksEditor
              data={question.options}
              onChange={options => onUpdate({ ...question, options })}
            />
          )}
          {question.question_type === "match_columns" && (
            <MatchColumnsEditor
              data={question.options}
              onChange={options => onUpdate({ ...question, options })}
            />
          )}
          {question.question_type === "image_puzzle" && (
            <ImagePuzzleEditor
              data={question.options}
              onChange={options => onUpdate({ ...question, options })}
            />
          )}
        </div>
        <Button variant="ghost" size="icon" onClick={onDelete}>
          <X className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
};
