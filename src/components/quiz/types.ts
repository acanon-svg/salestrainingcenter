export type QuizQuestionType = 
  | "multiple_choice" 
  | "true_false" 
  | "mind_map" 
  | "fill_blanks" 
  | "match_columns" 
  | "image_puzzle";

export interface MindMapData {
  type: "mind_map";
  groups: { id: string; label: string }[];
  concepts: { id: string; text: string; correct_group_id: string }[];
}

export interface FillBlanksData {
  type: "fill_blanks";
  segments: string[]; // Text segments between blanks
  blanks: { id: string; correct_word: string }[];
  distractor_words: string[];
}

export interface MatchColumnsData {
  type: "match_columns";
  pairs: { id: string; left: string; right: string }[];
}

export interface ImagePuzzleData {
  type: "image_puzzle";
  image_url: string;
  grid_cols: number;
  grid_rows: number;
}

export type AdvancedQuizOptions = MindMapData | FillBlanksData | MatchColumnsData | ImagePuzzleData;

export interface QuizQuestionState {
  id: string;
  question: string;
  question_type: QuizQuestionType;
  points: number;
  options: any; // {text, is_correct}[] for MC/TF, or AdvancedQuizOptions for new types
}

export const questionTypeLabels: Record<QuizQuestionType, string> = {
  multiple_choice: "Selección múltiple",
  true_false: "V/F",
  mind_map: "Mapa mental",
  fill_blanks: "Completar frases",
  match_columns: "Unir columnas",
  image_puzzle: "Rompecabezas",
};

export function isAdvancedType(type: QuizQuestionType): boolean {
  return ["mind_map", "fill_blanks", "match_columns", "image_puzzle"].includes(type);
}

export function createDefaultOptions(type: QuizQuestionType): any {
  switch (type) {
    case "true_false":
      return [
        { text: "Verdadero", is_correct: false },
        { text: "Falso", is_correct: false },
      ];
    case "multiple_choice":
      return [
        { text: "", is_correct: false },
        { text: "", is_correct: false },
        { text: "", is_correct: false },
        { text: "", is_correct: false },
      ];
    case "mind_map":
      return {
        type: "mind_map",
        groups: [
          { id: "g1", label: "Grupo 1" },
          { id: "g2", label: "Grupo 2" },
        ],
        concepts: [
          { id: "c1", text: "Concepto 1", correct_group_id: "g1" },
          { id: "c2", text: "Concepto 2", correct_group_id: "g2" },
        ],
      } as MindMapData;
    case "fill_blanks":
      return {
        type: "fill_blanks",
        segments: ["", " ", " "],
        blanks: [
          { id: "b1", correct_word: "" },
          { id: "b2", correct_word: "" },
        ],
        distractor_words: [],
      } as FillBlanksData;
    case "match_columns":
      return {
        type: "match_columns",
        pairs: [
          { id: "p1", left: "", right: "" },
          { id: "p2", left: "", right: "" },
        ],
      } as MatchColumnsData;
    case "image_puzzle":
      return {
        type: "image_puzzle",
        image_url: "",
        grid_cols: 3,
        grid_rows: 3,
      } as ImagePuzzleData;
    default:
      return [];
  }
}
