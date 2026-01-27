import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { TrainingDimension, DifficultyLevel } from "@/lib/types";

interface CourseData {
  title: string;
  description: string;
  cover_image_url: string;
  dimension: TrainingDimension;
  difficulty: DifficultyLevel;
  points: number;
  estimated_duration_minutes: number;
  language: string;
  subtitles_enabled: boolean;
  target_audience: string[];
  tags: string[];
  objectives: string[];
  expires_at: string;
  scheduled_at: string;
  target_teams: string[];
  target_users: string[];
}

interface Material {
  id: string;
  title: string;
  type: string;
  content_url: string;
}

interface QuizQuestion {
  id: string;
  question: string;
  options: { text: string; is_correct: boolean }[];
}

interface CreateCoursePayload {
  courseData: CourseData;
  materials: Material[];
  quizQuestions: QuizQuestion[];
  status: "draft" | "published";
}

export const useCreateCourse = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  return useMutation({
    mutationFn: async ({ courseData, materials, quizQuestions, status }: CreateCoursePayload) => {
      if (!user?.id) throw new Error("Usuario no autenticado");

      // 1. Create the course
      const { data: course, error: courseError } = await supabase
        .from("courses")
        .insert({
          title: courseData.title,
          description: courseData.description || null,
          cover_image_url: courseData.cover_image_url || null,
          dimension: courseData.dimension,
          difficulty: courseData.difficulty,
          points: courseData.points,
          estimated_duration_minutes: courseData.estimated_duration_minutes || null,
          language: courseData.language,
          subtitles_enabled: courseData.subtitles_enabled,
          target_audience: courseData.target_audience.length > 0 ? courseData.target_audience : null,
          tags: courseData.tags.length > 0 ? courseData.tags : null,
          objectives: courseData.objectives.length > 0 ? courseData.objectives : null,
          expires_at: courseData.expires_at || null,
          scheduled_at: courseData.scheduled_at || null,
          target_teams: courseData.target_teams.length > 0 ? courseData.target_teams : null,
          target_users: courseData.target_users.length > 0 ? courseData.target_users : null,
          status: status,
          published_at: status === "published" ? new Date().toISOString() : null,
          created_by: user.id,
        })
        .select()
        .single();

      if (courseError) throw courseError;

      // 2. Create materials if any
      if (materials.length > 0) {
        const materialsToInsert = materials
          .filter(m => m.title && m.content_url)
          .map((material, index) => ({
            course_id: course.id,
            title: material.title,
            type: material.type as "video" | "documento" | "link" | "quiz" | "encuesta",
            content_url: material.content_url,
            order_index: index,
            is_required: true,
          }));

        if (materialsToInsert.length > 0) {
          const { error: materialsError } = await supabase
            .from("course_materials")
            .insert(materialsToInsert);

          if (materialsError) throw materialsError;
        }
      }

      // 3. Create quiz if questions exist
      if (quizQuestions.length > 0) {
        const validQuestions = quizQuestions.filter(
          q => q.question && q.options.some(o => o.text && o.is_correct)
        );

        if (validQuestions.length > 0) {
          // Create quiz
          const { data: quiz, error: quizError } = await supabase
            .from("quizzes")
            .insert({
              course_id: course.id,
              title: `Quiz: ${courseData.title}`,
              description: "Evaluación del curso",
              passing_score: 70,
              order_index: 0,
            })
            .select()
            .single();

          if (quizError) throw quizError;

          // Create questions
          const questionsToInsert = validQuestions.map((q, index) => ({
            quiz_id: quiz.id,
            question: q.question,
            question_type: "multiple_choice",
            options: q.options.filter(o => o.text),
            order_index: index,
            points: 10,
          }));

          const { error: questionsError } = await supabase
            .from("quiz_questions")
            .insert(questionsToInsert);

          if (questionsError) throw questionsError;
        }
      }

      return course;
    },
    onSuccess: (course, variables) => {
      queryClient.invalidateQueries({ queryKey: ["courses"] });
      queryClient.invalidateQueries({ queryKey: ["my-courses"] });
      
      toast({
        title: variables.status === "published" ? "¡Curso publicado!" : "Borrador guardado",
        description: variables.status === "published" 
          ? "El curso ya está disponible para los usuarios."
          : "El curso se ha guardado como borrador.",
      });

      // Navigate to course detail or my courses
      navigate(`/courses/${course.id}`);
    },
    onError: (error: Error) => {
      console.error("Error creating course:", error);
      toast({
        title: "Error",
        description: `No se pudo crear el curso: ${error.message}`,
        variant: "destructive",
      });
    },
  });
};

export const useUpdateCourse = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ 
      courseId, 
      courseData, 
      status 
    }: { 
      courseId: string; 
      courseData: Partial<CourseData>; 
      status?: "draft" | "published" 
    }) => {
      const updates: Record<string, unknown> = { ...courseData };
      
      if (status) {
        updates.status = status;
        if (status === "published") {
          updates.published_at = new Date().toISOString();
        }
      }

      const { data, error } = await supabase
        .from("courses")
        .update(updates)
        .eq("id", courseId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["courses"] });
      queryClient.invalidateQueries({ queryKey: ["my-courses"] });
      toast({
        title: "Curso actualizado",
        description: "Los cambios se han guardado correctamente.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: `No se pudo actualizar el curso: ${error.message}`,
        variant: "destructive",
      });
    },
  });
};
