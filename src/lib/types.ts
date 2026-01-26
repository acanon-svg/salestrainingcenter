import { SupabaseClient } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

// Helper to get untyped supabase client for tables not yet in generated types
export const getSupabaseClient = () => supabase as unknown as SupabaseClient;

// Type definitions for the training app

export type AppRole = "student" | "creator" | "admin" | "lider";
export type TrainingDimension = "onboarding" | "refuerzo" | "taller" | "entrenamiento";
export type DifficultyLevel = "basico" | "medio" | "avanzado";
export type ContentType = "video" | "documento" | "link" | "quiz" | "encuesta";
export type CourseStatus = "draft" | "published" | "archived";

export interface Profile {
  id: string;
  user_id: string;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
  company_role: string | null;
  team: string | null;
  regional: string | null;
  points: number;
  badges_count: number;
  last_login: string | null;
  created_at: string;
  updated_at: string;
}

export interface Process {
  id: string;
  name: string;
  description: string | null;
  parent_id: string | null;
  order_index: number;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface Course {
  id: string;
  title: string;
  description: string | null;
  cover_image_url: string | null;
  process_id: string | null;
  dimension: TrainingDimension;
  difficulty: DifficultyLevel;
  status: CourseStatus;
  points: number;
  estimated_duration_minutes: number | null;
  language: string;
  subtitles_enabled: boolean;
  target_audience: string[] | null;
  tags: string[] | null;
  objectives: string[] | null;
  expires_at: string | null;
  published_at: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  // Joined fields
  process?: Process;
  materials_count?: number;
  enrolled_count?: number;
}

export interface CourseMaterial {
  id: string;
  course_id: string;
  title: string;
  type: ContentType;
  content_url: string | null;
  content_text: string | null;
  order_index: number;
  duration_minutes: number | null;
  is_required: boolean;
  created_at: string;
}

export interface Quiz {
  id: string;
  course_id: string;
  title: string;
  description: string | null;
  passing_score: number;
  max_attempts: number | null;
  time_limit_minutes: number | null;
  order_index: number;
  created_at: string;
  questions?: QuizQuestion[];
}

export interface QuizQuestion {
  id: string;
  quiz_id: string;
  question: string;
  question_type: string;
  options: { text: string; is_correct: boolean }[] | null;
  points: number;
  order_index: number;
  created_at: string;
}

export interface CourseEnrollment {
  id: string;
  user_id: string;
  course_id: string;
  status: string;
  progress_percentage: number;
  started_at: string | null;
  completed_at: string | null;
  score: number | null;
  points_earned: number;
  created_at: string;
  updated_at: string;
  // Joined
  course?: Course;
}

export interface Badge {
  id: string;
  name: string;
  description: string | null;
  icon_url: string | null;
  icon_emoji: string | null;
  criteria_type: string;
  criteria_value: number | null;
  points_reward: number;
  created_by: string | null;
  created_at: string;
}

export interface UserBadge {
  id: string;
  user_id: string;
  badge_id: string;
  earned_at: string;
  badge?: Badge;
}

export interface Notification {
  id: string;
  user_id: string;
  title: string;
  message: string;
  type: string;
  related_id: string | null;
  is_read: boolean;
  created_at: string;
}

export interface Feedback {
  id: string;
  sender_id: string;
  recipient_id: string | null;
  course_id: string | null;
  subject: string;
  message: string;
  status: string;
  response: string | null;
  responded_at: string | null;
  points_awarded: number;
  created_at: string;
  updated_at: string;
  // Joined
  sender?: Profile;
  course?: Course;
}

export interface Announcement {
  id: string;
  title: string;
  content: string | null;
  image_url: string | null;
  video_url: string | null;
  type: string;
  target_teams: string[] | null;
  points_for_viewing: number;
  starts_at: string;
  expires_at: string | null;
  created_by: string | null;
  created_at: string;
}

// Dimension display names
export const dimensionLabels: Record<TrainingDimension, string> = {
  onboarding: "Onboarding",
  refuerzo: "Refuerzo",
  taller: "Taller",
  entrenamiento: "Entrenamiento",
};

// Difficulty display names
export const difficultyLabels: Record<DifficultyLevel, string> = {
  basico: "Básico",
  medio: "Medio",
  avanzado: "Avanzado",
};

// Status display names
export const statusLabels: Record<CourseStatus, string> = {
  draft: "Borrador",
  published: "Publicado",
  archived: "Archivado",
};

// Content type display names
export const contentTypeLabels: Record<ContentType, string> = {
  video: "Video",
  documento: "Documento",
  link: "Enlace",
  quiz: "Quiz",
  encuesta: "Encuesta",
};
