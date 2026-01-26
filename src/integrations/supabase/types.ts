export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      announcement_views: {
        Row: {
          announcement_id: string
          id: string
          reaction: string | null
          user_id: string
          viewed_at: string
        }
        Insert: {
          announcement_id: string
          id?: string
          reaction?: string | null
          user_id: string
          viewed_at?: string
        }
        Update: {
          announcement_id?: string
          id?: string
          reaction?: string | null
          user_id?: string
          viewed_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "announcement_views_announcement_id_fkey"
            columns: ["announcement_id"]
            isOneToOne: false
            referencedRelation: "announcements"
            referencedColumns: ["id"]
          },
        ]
      }
      announcements: {
        Row: {
          content: string | null
          created_at: string
          created_by: string | null
          expires_at: string | null
          id: string
          image_url: string | null
          points_for_viewing: number | null
          starts_at: string
          target_teams: string[] | null
          title: string
          type: string
          video_url: string | null
        }
        Insert: {
          content?: string | null
          created_at?: string
          created_by?: string | null
          expires_at?: string | null
          id?: string
          image_url?: string | null
          points_for_viewing?: number | null
          starts_at?: string
          target_teams?: string[] | null
          title: string
          type?: string
          video_url?: string | null
        }
        Update: {
          content?: string | null
          created_at?: string
          created_by?: string | null
          expires_at?: string | null
          id?: string
          image_url?: string | null
          points_for_viewing?: number | null
          starts_at?: string
          target_teams?: string[] | null
          title?: string
          type?: string
          video_url?: string | null
        }
        Relationships: []
      }
      app_settings: {
        Row: {
          description: string | null
          id: string
          key: string
          updated_at: string
          updated_by: string | null
          value: Json
        }
        Insert: {
          description?: string | null
          id?: string
          key: string
          updated_at?: string
          updated_by?: string | null
          value?: Json
        }
        Update: {
          description?: string | null
          id?: string
          key?: string
          updated_at?: string
          updated_by?: string | null
          value?: Json
        }
        Relationships: []
      }
      badges: {
        Row: {
          created_at: string
          created_by: string | null
          criteria_type: string
          criteria_value: number | null
          description: string | null
          icon_emoji: string | null
          icon_url: string | null
          id: string
          name: string
          points_reward: number
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          criteria_type: string
          criteria_value?: number | null
          description?: string | null
          icon_emoji?: string | null
          icon_url?: string | null
          id?: string
          name: string
          points_reward?: number
        }
        Update: {
          created_at?: string
          created_by?: string | null
          criteria_type?: string
          criteria_value?: number | null
          description?: string | null
          icon_emoji?: string | null
          icon_url?: string | null
          id?: string
          name?: string
          points_reward?: number
        }
        Relationships: []
      }
      chatbot_config: {
        Row: {
          avatar_url: string | null
          bot_name: string
          enabled: boolean
          id: string
          primary_color: string | null
          system_prompt: string
          updated_at: string
          updated_by: string | null
          welcome_message: string
        }
        Insert: {
          avatar_url?: string | null
          bot_name?: string
          enabled?: boolean
          id?: string
          primary_color?: string | null
          system_prompt?: string
          updated_at?: string
          updated_by?: string | null
          welcome_message?: string
        }
        Update: {
          avatar_url?: string | null
          bot_name?: string
          enabled?: boolean
          id?: string
          primary_color?: string | null
          system_prompt?: string
          updated_at?: string
          updated_by?: string | null
          welcome_message?: string
        }
        Relationships: []
      }
      chatbot_team_data: {
        Row: {
          created_at: string
          data_content: Json
          data_name: string
          description: string | null
          id: string
          updated_at: string
          uploaded_by: string | null
        }
        Insert: {
          created_at?: string
          data_content: Json
          data_name: string
          description?: string | null
          id?: string
          updated_at?: string
          uploaded_by?: string | null
        }
        Update: {
          created_at?: string
          data_content?: Json
          data_name?: string
          description?: string | null
          id?: string
          updated_at?: string
          uploaded_by?: string | null
        }
        Relationships: []
      }
      course_enrollments: {
        Row: {
          completed_at: string | null
          course_id: string
          created_at: string
          id: string
          points_earned: number | null
          progress_percentage: number
          score: number | null
          started_at: string | null
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          completed_at?: string | null
          course_id: string
          created_at?: string
          id?: string
          points_earned?: number | null
          progress_percentage?: number
          score?: number | null
          started_at?: string | null
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          completed_at?: string | null
          course_id?: string
          created_at?: string
          id?: string
          points_earned?: number | null
          progress_percentage?: number
          score?: number | null
          started_at?: string | null
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "course_enrollments_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
        ]
      }
      course_materials: {
        Row: {
          content_text: string | null
          content_url: string | null
          course_id: string
          created_at: string
          duration_minutes: number | null
          id: string
          is_required: boolean
          order_index: number
          title: string
          type: Database["public"]["Enums"]["content_type"]
        }
        Insert: {
          content_text?: string | null
          content_url?: string | null
          course_id: string
          created_at?: string
          duration_minutes?: number | null
          id?: string
          is_required?: boolean
          order_index?: number
          title: string
          type: Database["public"]["Enums"]["content_type"]
        }
        Update: {
          content_text?: string | null
          content_url?: string | null
          course_id?: string
          created_at?: string
          duration_minutes?: number | null
          id?: string
          is_required?: boolean
          order_index?: number
          title?: string
          type?: Database["public"]["Enums"]["content_type"]
        }
        Relationships: [
          {
            foreignKeyName: "course_materials_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
        ]
      }
      courses: {
        Row: {
          cover_image_url: string | null
          created_at: string
          created_by: string | null
          description: string | null
          difficulty: Database["public"]["Enums"]["difficulty_level"]
          dimension: Database["public"]["Enums"]["training_dimension"]
          estimated_duration_minutes: number | null
          expires_at: string | null
          id: string
          language: string
          objectives: string[] | null
          points: number
          process_id: string | null
          published_at: string | null
          status: Database["public"]["Enums"]["course_status"]
          subtitles_enabled: boolean
          tags: string[] | null
          target_audience: string[] | null
          title: string
          updated_at: string
        }
        Insert: {
          cover_image_url?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          difficulty?: Database["public"]["Enums"]["difficulty_level"]
          dimension?: Database["public"]["Enums"]["training_dimension"]
          estimated_duration_minutes?: number | null
          expires_at?: string | null
          id?: string
          language?: string
          objectives?: string[] | null
          points?: number
          process_id?: string | null
          published_at?: string | null
          status?: Database["public"]["Enums"]["course_status"]
          subtitles_enabled?: boolean
          tags?: string[] | null
          target_audience?: string[] | null
          title: string
          updated_at?: string
        }
        Update: {
          cover_image_url?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          difficulty?: Database["public"]["Enums"]["difficulty_level"]
          dimension?: Database["public"]["Enums"]["training_dimension"]
          estimated_duration_minutes?: number | null
          expires_at?: string | null
          id?: string
          language?: string
          objectives?: string[] | null
          points?: number
          process_id?: string | null
          published_at?: string | null
          status?: Database["public"]["Enums"]["course_status"]
          subtitles_enabled?: boolean
          tags?: string[] | null
          target_audience?: string[] | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "courses_process_id_fkey"
            columns: ["process_id"]
            isOneToOne: false
            referencedRelation: "processes"
            referencedColumns: ["id"]
          },
        ]
      }
      feedback: {
        Row: {
          course_id: string | null
          created_at: string
          id: string
          message: string
          points_awarded: number | null
          recipient_id: string | null
          responded_at: string | null
          response: string | null
          sender_id: string
          status: string
          subject: string
          updated_at: string
        }
        Insert: {
          course_id?: string | null
          created_at?: string
          id?: string
          message: string
          points_awarded?: number | null
          recipient_id?: string | null
          responded_at?: string | null
          response?: string | null
          sender_id: string
          status?: string
          subject: string
          updated_at?: string
        }
        Update: {
          course_id?: string | null
          created_at?: string
          id?: string
          message?: string
          points_awarded?: number | null
          recipient_id?: string | null
          responded_at?: string | null
          response?: string | null
          sender_id?: string
          status?: string
          subject?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "feedback_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
        ]
      }
      field_accompaniments: {
        Row: {
          accompaniment_date: string
          action_plan: string | null
          created_at: string
          evaluator_email: string | null
          evaluator_name: string
          executive_email: string | null
          executive_name: string
          general_comments: string | null
          google_sheets_row_id: string | null
          id: string
          improvement_opportunities: string | null
          overall_score: number | null
          product_knowledge_score: number | null
          regional: string
          sales_technique_score: number | null
          soft_skills_score: number | null
          strengths: string | null
          synced_at: string | null
          team: string | null
          tools_usage_score: number | null
        }
        Insert: {
          accompaniment_date: string
          action_plan?: string | null
          created_at?: string
          evaluator_email?: string | null
          evaluator_name: string
          executive_email?: string | null
          executive_name: string
          general_comments?: string | null
          google_sheets_row_id?: string | null
          id?: string
          improvement_opportunities?: string | null
          overall_score?: number | null
          product_knowledge_score?: number | null
          regional: string
          sales_technique_score?: number | null
          soft_skills_score?: number | null
          strengths?: string | null
          synced_at?: string | null
          team?: string | null
          tools_usage_score?: number | null
        }
        Update: {
          accompaniment_date?: string
          action_plan?: string | null
          created_at?: string
          evaluator_email?: string | null
          evaluator_name?: string
          executive_email?: string | null
          executive_name?: string
          general_comments?: string | null
          google_sheets_row_id?: string | null
          id?: string
          improvement_opportunities?: string | null
          overall_score?: number | null
          product_knowledge_score?: number | null
          regional?: string
          sales_technique_score?: number | null
          soft_skills_score?: number | null
          strengths?: string | null
          synced_at?: string | null
          team?: string | null
          tools_usage_score?: number | null
        }
        Relationships: []
      }
      leader_regions: {
        Row: {
          assigned_by: string | null
          created_at: string
          id: string
          regional: string
          updated_at: string
          user_id: string
        }
        Insert: {
          assigned_by?: string | null
          created_at?: string
          id?: string
          regional: string
          updated_at?: string
          user_id: string
        }
        Update: {
          assigned_by?: string | null
          created_at?: string
          id?: string
          regional?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      material_feedback: {
        Row: {
          created_at: string
          id: string
          is_useful: boolean
          material_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_useful: boolean
          material_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_useful?: boolean
          material_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "material_feedback_material_id_fkey"
            columns: ["material_id"]
            isOneToOne: false
            referencedRelation: "training_materials"
            referencedColumns: ["id"]
          },
        ]
      }
      material_progress: {
        Row: {
          completed: boolean
          completed_at: string | null
          created_at: string
          id: string
          material_id: string
          user_id: string
        }
        Insert: {
          completed?: boolean
          completed_at?: string | null
          created_at?: string
          id?: string
          material_id: string
          user_id: string
        }
        Update: {
          completed?: boolean
          completed_at?: string | null
          created_at?: string
          id?: string
          material_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "material_progress_material_id_fkey"
            columns: ["material_id"]
            isOneToOne: false
            referencedRelation: "course_materials"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          created_at: string
          id: string
          is_read: boolean
          message: string
          related_id: string | null
          title: string
          type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_read?: boolean
          message: string
          related_id?: string | null
          title: string
          type?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_read?: boolean
          message?: string
          related_id?: string | null
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      processes: {
        Row: {
          created_at: string
          created_by: string | null
          description: string | null
          id: string
          name: string
          order_index: number
          parent_id: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          name: string
          order_index?: number
          parent_id?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          name?: string
          order_index?: number
          parent_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "processes_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "processes"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          badges_count: number
          company_role: string | null
          created_at: string
          email: string
          full_name: string | null
          id: string
          last_login: string | null
          points: number
          regional: string | null
          team: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          badges_count?: number
          company_role?: string | null
          created_at?: string
          email: string
          full_name?: string | null
          id?: string
          last_login?: string | null
          points?: number
          regional?: string | null
          team?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          badges_count?: number
          company_role?: string | null
          created_at?: string
          email?: string
          full_name?: string | null
          id?: string
          last_login?: string | null
          points?: number
          regional?: string | null
          team?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      quiz_attempts: {
        Row: {
          answers: Json | null
          completed_at: string
          created_at: string
          id: string
          passed: boolean
          quiz_id: string
          score: number
          started_at: string
          user_id: string
        }
        Insert: {
          answers?: Json | null
          completed_at?: string
          created_at?: string
          id?: string
          passed: boolean
          quiz_id: string
          score: number
          started_at: string
          user_id: string
        }
        Update: {
          answers?: Json | null
          completed_at?: string
          created_at?: string
          id?: string
          passed?: boolean
          quiz_id?: string
          score?: number
          started_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "quiz_attempts_quiz_id_fkey"
            columns: ["quiz_id"]
            isOneToOne: false
            referencedRelation: "quizzes"
            referencedColumns: ["id"]
          },
        ]
      }
      quiz_questions: {
        Row: {
          created_at: string
          id: string
          options: Json | null
          order_index: number
          points: number
          question: string
          question_type: string
          quiz_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          options?: Json | null
          order_index?: number
          points?: number
          question: string
          question_type?: string
          quiz_id: string
        }
        Update: {
          created_at?: string
          id?: string
          options?: Json | null
          order_index?: number
          points?: number
          question?: string
          question_type?: string
          quiz_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "quiz_questions_quiz_id_fkey"
            columns: ["quiz_id"]
            isOneToOne: false
            referencedRelation: "quizzes"
            referencedColumns: ["id"]
          },
        ]
      }
      quizzes: {
        Row: {
          course_id: string
          created_at: string
          description: string | null
          id: string
          max_attempts: number | null
          order_index: number
          passing_score: number
          time_limit_minutes: number | null
          title: string
        }
        Insert: {
          course_id: string
          created_at?: string
          description?: string | null
          id?: string
          max_attempts?: number | null
          order_index?: number
          passing_score?: number
          time_limit_minutes?: number | null
          title: string
        }
        Update: {
          course_id?: string
          created_at?: string
          description?: string | null
          id?: string
          max_attempts?: number | null
          order_index?: number
          passing_score?: number
          time_limit_minutes?: number | null
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "quizzes_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
        ]
      }
      sheets_sync_log: {
        Row: {
          completed_at: string | null
          error_message: string | null
          id: string
          rows_synced: number | null
          started_at: string
          status: string | null
          sync_type: string
        }
        Insert: {
          completed_at?: string | null
          error_message?: string | null
          id?: string
          rows_synced?: number | null
          started_at?: string
          status?: string | null
          sync_type: string
        }
        Update: {
          completed_at?: string | null
          error_message?: string | null
          id?: string
          rows_synced?: number | null
          started_at?: string
          status?: string | null
          sync_type?: string
        }
        Relationships: []
      }
      training_materials: {
        Row: {
          content_text: string | null
          content_url: string | null
          created_at: string
          created_by: string | null
          description: string | null
          id: string
          is_published: boolean | null
          order_index: number | null
          target_teams: string[] | null
          title: string
          type: string
          updated_at: string
        }
        Insert: {
          content_text?: string | null
          content_url?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          is_published?: boolean | null
          order_index?: number | null
          target_teams?: string[] | null
          title: string
          type: string
          updated_at?: string
        }
        Update: {
          content_text?: string | null
          content_url?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          is_published?: boolean | null
          order_index?: number | null
          target_teams?: string[] | null
          title?: string
          type?: string
          updated_at?: string
        }
        Relationships: []
      }
      user_badges: {
        Row: {
          badge_id: string
          earned_at: string
          id: string
          user_id: string
        }
        Insert: {
          badge_id: string
          earned_at?: string
          id?: string
          user_id: string
        }
        Update: {
          badge_id?: string
          earned_at?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_badges_badge_id_fkey"
            columns: ["badge_id"]
            isOneToOne: false
            referencedRelation: "badges"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      quiz_attempts_safe: {
        Row: {
          answers: Json | null
          completed_at: string | null
          created_at: string | null
          id: string | null
          passed: boolean | null
          quiz_id: string | null
          score: number | null
          started_at: string | null
          user_id: string | null
        }
        Insert: {
          answers?: never
          completed_at?: string | null
          created_at?: string | null
          id?: string | null
          passed?: boolean | null
          quiz_id?: string | null
          score?: number | null
          started_at?: string | null
          user_id?: string | null
        }
        Update: {
          answers?: never
          completed_at?: string | null
          created_at?: string | null
          id?: string | null
          passed?: boolean | null
          quiz_id?: string | null
          score?: number | null
          started_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "quiz_attempts_quiz_id_fkey"
            columns: ["quiz_id"]
            isOneToOne: false
            referencedRelation: "quizzes"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_own_quiz_attempt: {
        Args: { attempt_user_id: string }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "student" | "creator" | "admin" | "lider" | "analista"
      content_type: "video" | "documento" | "link" | "quiz" | "encuesta"
      course_status: "draft" | "published" | "archived"
      difficulty_level: "basico" | "medio" | "avanzado"
      training_dimension: "onboarding" | "refuerzo" | "taller" | "entrenamiento"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["student", "creator", "admin", "lider", "analista"],
      content_type: ["video", "documento", "link", "quiz", "encuesta"],
      course_status: ["draft", "published", "archived"],
      difficulty_level: ["basico", "medio", "avanzado"],
      training_dimension: ["onboarding", "refuerzo", "taller", "entrenamiento"],
    },
  },
} as const
