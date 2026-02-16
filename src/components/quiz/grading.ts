import { QuizQuestionType, MindMapData, FillBlanksData, MatchColumnsData, ImagePuzzleData } from "./types";

export interface GradeResult {
  correct: boolean;
  details: Record<string, boolean>; // item_id -> is_correct
}

export function gradeQuestion(
  questionType: QuizQuestionType,
  options: any,
  answer: any
): GradeResult {
  switch (questionType) {
    case "multiple_choice":
    case "true_false": {
      const correctOption = (options as { text: string; is_correct: boolean }[])?.find(o => o.is_correct);
      const correct = correctOption ? answer === correctOption.text : false;
      return { correct, details: {} };
    }
    case "mind_map": {
      const data = options as MindMapData;
      const userAnswers = (answer || {}) as Record<string, string>;
      const details: Record<string, boolean> = {};
      let allCorrect = true;
      data.concepts.forEach(c => {
        const isCorrect = userAnswers[c.id] === c.correct_group_id;
        details[c.id] = isCorrect;
        if (!isCorrect) allCorrect = false;
      });
      return { correct: allCorrect, details };
    }
    case "fill_blanks": {
      const data = options as FillBlanksData;
      const userAnswers = (answer || {}) as Record<string, string>;
      const details: Record<string, boolean> = {};
      let allCorrect = true;
      data.blanks.forEach(b => {
        const isCorrect = userAnswers[b.id]?.toLowerCase().trim() === b.correct_word.toLowerCase().trim();
        details[b.id] = isCorrect;
        if (!isCorrect) allCorrect = false;
      });
      return { correct: allCorrect, details };
    }
    case "match_columns": {
      const data = options as MatchColumnsData;
      const userAnswers = (answer || {}) as Record<string, string>;
      const details: Record<string, boolean> = {};
      let allCorrect = true;
      data.pairs.forEach(p => {
        const isCorrect = userAnswers[p.id] === p.right;
        details[p.id] = isCorrect;
        if (!isCorrect) allCorrect = false;
      });
      return { correct: allCorrect, details };
    }
    case "image_puzzle": {
      const data = options as ImagePuzzleData;
      const totalPieces = data.grid_cols * data.grid_rows;
      const userPositions = (answer || []) as number[];
      const details: Record<string, boolean> = {};
      let allCorrect = true;
      for (let i = 0; i < totalPieces; i++) {
        const isCorrect = userPositions[i] === i;
        details[String(i)] = isCorrect;
        if (!isCorrect) allCorrect = false;
      }
      return { correct: allCorrect, details };
    }
    default:
      return { correct: false, details: {} };
  }
}
