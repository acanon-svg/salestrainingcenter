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
  time_limit_minutes?: number;
  language: string;
  subtitles_enabled: boolean;
  target_audience: string[];
  tags: string[];
  objectives: string[];
  expires_at: string;
  scheduled_at: string;
  target_teams: string[];
  target_users: string[];
  course_tags?: string[];
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
  question_type?: string;
  points?: number;
  options: any;
}

interface AdditionalResource {
  id: string;
  title: string;
  url: string;
}

interface CreateCoursePayload {
  courseData: CourseData;
  materials: Material[];
  quizQuestions: QuizQuestion[];
  additionalResources?: AdditionalResource[];
  status: "draft" | "published";
}

export const useCreateCourse = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  return useMutation({
    mutationFn: async ({ courseData, materials, quizQuestions, additionalResources, status }: CreateCoursePayload) => {
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
          time_limit_minutes: courseData.time_limit_minutes || 60,
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
        // Map content types to valid enum values
        const mapContentType = (type: string): "video" | "documento" | "link" | "quiz" | "encuesta" => {
          if (type === "google_embed") return "documento";
          if (["video", "documento", "link", "quiz", "encuesta"].includes(type)) {
            return type as "video" | "documento" | "link" | "quiz" | "encuesta";
          }
          return "documento"; // Default fallback
        };

        const materialsToInsert = materials
          .filter(m => m.title && m.content_url)
          .map((material, index) => ({
            course_id: course.id,
            title: material.title,
            type: mapContentType(material.type),
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
          q => {
            if (!q.question) return false;
            const type = q.question_type || "multiple_choice";
            if (["multiple_choice", "true_false"].includes(type)) {
              return Array.isArray(q.options) && q.options.some((o: any) => o.text && o.is_correct);
            }
            // Advanced types are valid if they have content
            return q.options && typeof q.options === "object";
          }
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

          // Create questions with individual points
          const questionsToInsert = validQuestions.map((q, index) => ({
            quiz_id: quiz.id,
            question: q.question,
            question_type: q.question_type || "multiple_choice",
            options: ["multiple_choice", "true_false"].includes(q.question_type || "multiple_choice")
              ? q.options.filter((o: any) => o.text)
              : q.options,
            order_index: index,
            points: q.points || 10,
          }));

          const { error: questionsError } = await supabase
            .from("quiz_questions")
            .insert(questionsToInsert);

          if (questionsError) throw questionsError;
        }
      }

      // 4. Create additional resources if any
      if (additionalResources && additionalResources.length > 0) {
        const resourcesToInsert = additionalResources
          .filter(r => r.title && r.url)
          .map((resource, index) => ({
            course_id: course.id,
            title: resource.title,
            url: resource.url,
            order_index: index,
          }));

        if (resourcesToInsert.length > 0) {
          const { error: resourcesError } = await supabase
            .from("course_resources")
            .insert(resourcesToInsert);

        if (resourcesError) throw resourcesError;
        }
      }

      // 5. Assign course tags if any
      if (courseData.course_tags && courseData.course_tags.length > 0) {
        const tagAssignments = courseData.course_tags.map((tagId) => ({
          course_id: course.id,
          tag_id: tagId,
        }));

        const { error: tagError } = await (supabase as any)
          .from("course_tag_assignments")
          .insert(tagAssignments);

        if (tagError) {
          console.warn("Error assigning course tags:", tagError);
          // Don't throw - tags are optional
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
    onSuccess: (data) => {
      // Invalidate all course-related queries to ensure all users see updates
      queryClient.invalidateQueries({ queryKey: ["courses"] });
      queryClient.invalidateQueries({ queryKey: ["my-courses"] });
      queryClient.invalidateQueries({ queryKey: ["course", data.id] });
      queryClient.invalidateQueries({ queryKey: ["course-materials", data.id] });
      queryClient.invalidateQueries({ queryKey: ["course-quizzes", data.id] });
      queryClient.invalidateQueries({ queryKey: ["course-resources", data.id] });
      queryClient.invalidateQueries({ queryKey: ["enrollments"] });
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
