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
          course_link: string | null
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
          course_link?: string | null
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
          course_link?: string | null
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
      calculator_formulas: {
        Row: {
          created_at: string
          description: string | null
          formula: string
          id: string
          label: string
          name: string
          order_index: number | null
          result_type: string
          tool_id: string
          visible_to_leaders: boolean | null
          visible_to_students: boolean | null
        }
        Insert: {
          created_at?: string
          description?: string | null
          formula: string
          id?: string
          label: string
          name: string
          order_index?: number | null
          result_type?: string
          tool_id: string
          visible_to_leaders?: boolean | null
          visible_to_students?: boolean | null
        }
        Update: {
          created_at?: string
          description?: string | null
          formula?: string
          id?: string
          label?: string
          name?: string
          order_index?: number | null
          result_type?: string
          tool_id?: string
          visible_to_leaders?: boolean | null
          visible_to_students?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "calculator_formulas_tool_id_fkey"
            columns: ["tool_id"]
            isOneToOne: false
            referencedRelation: "tools"
            referencedColumns: ["id"]
          },
        ]
      }
      calculator_variables: {
        Row: {
          created_at: string
          default_value: number | null
          description: string | null
          id: string
          label: string
          max_value: number | null
          min_value: number | null
          name: string
          order_index: number | null
          tool_id: string
          variable_type: string
          visible_to_leaders: boolean | null
          visible_to_students: boolean | null
          weight: number | null
        }
        Insert: {
          created_at?: string
          default_value?: number | null
          description?: string | null
          id?: string
          label: string
          max_value?: number | null
          min_value?: number | null
          name: string
          order_index?: number | null
          tool_id: string
          variable_type?: string
          visible_to_leaders?: boolean | null
          visible_to_students?: boolean | null
          weight?: number | null
        }
        Update: {
          created_at?: string
          default_value?: number | null
          description?: string | null
          id?: string
          label?: string
          max_value?: number | null
          min_value?: number | null
          name?: string
          order_index?: number | null
          tool_id?: string
          variable_type?: string
          visible_to_leaders?: boolean | null
          visible_to_students?: boolean | null
          weight?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "calculator_variables_tool_id_fkey"
            columns: ["tool_id"]
            isOneToOne: false
            referencedRelation: "tools"
            referencedColumns: ["id"]
          },
        ]
      }
      category_sections: {
        Row: {
          color: string | null
          created_at: string
          created_by: string | null
          description: string | null
          id: string
          name: string
          order_index: number | null
          updated_at: string
        }
        Insert: {
          color?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          name: string
          order_index?: number | null
          updated_at?: string
        }
        Update: {
          color?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          name?: string
          order_index?: number | null
          updated_at?: string
        }
        Relationships: []
      }
      chatbot_config: {
        Row: {
          auto_generated_prompt: string | null
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
          auto_generated_prompt?: string | null
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
          auto_generated_prompt?: string | null
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
      chatbot_prompt_history: {
        Row: {
          announcements_count: number
          courses_count: number
          created_at: string
          generated_by: string | null
          generated_prompt: string
          glossary_count: number
          id: string
          materials_count: number
          team_data_count: number
        }
        Insert: {
          announcements_count?: number
          courses_count?: number
          created_at?: string
          generated_by?: string | null
          generated_prompt: string
          glossary_count?: number
          id?: string
          materials_count?: number
          team_data_count?: number
        }
        Update: {
          announcements_count?: number
          courses_count?: number
          created_at?: string
          generated_by?: string | null
          generated_prompt?: string
          glossary_count?: number
          id?: string
          materials_count?: number
          team_data_count?: number
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
      commission_accelerators: {
        Row: {
          bonus_percentage: number
          config_id: string
          created_at: string
          description: string | null
          id: string
          min_firmas: number
          order_index: number | null
        }
        Insert: {
          bonus_percentage?: number
          config_id: string
          created_at?: string
          description?: string | null
          id?: string
          min_firmas?: number
          order_index?: number | null
        }
        Update: {
          bonus_percentage?: number
          config_id?: string
          created_at?: string
          description?: string | null
          id?: string
          min_firmas?: number
          order_index?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "commission_accelerators_config_id_fkey"
            columns: ["config_id"]
            isOneToOne: false
            referencedRelation: "commission_calculator_configs"
            referencedColumns: ["id"]
          },
        ]
      }
      commission_calculator_configs: {
        Row: {
          base_comisional: number
          created_at: string
          created_by: string | null
          description: string | null
          id: string
          is_default: boolean | null
          meta_firmas: number
          meta_gmv_usd: number
          meta_originaciones: number
          name: string
          target_teams: string[] | null
          target_users: string[] | null
          tool_id: string
          updated_at: string
        }
        Insert: {
          base_comisional?: number
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          is_default?: boolean | null
          meta_firmas?: number
          meta_gmv_usd?: number
          meta_originaciones?: number
          name?: string
          target_teams?: string[] | null
          target_users?: string[] | null
          tool_id: string
          updated_at?: string
        }
        Update: {
          base_comisional?: number
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          is_default?: boolean | null
          meta_firmas?: number
          meta_gmv_usd?: number
          meta_originaciones?: number
          name?: string
          target_teams?: string[] | null
          target_users?: string[] | null
          tool_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "commission_calculator_configs_tool_id_fkey"
            columns: ["tool_id"]
            isOneToOne: false
            referencedRelation: "tools"
            referencedColumns: ["id"]
          },
        ]
      }
      commission_monthly_configs: {
        Row: {
          base_comisional: number
          config_id: string
          created_at: string
          created_by: string | null
          id: string
          meta_firmas: number
          meta_gmv_m1: number
          meta_gmv_usd: number
          meta_originaciones: number
          meta_originaciones_m1: number
          month: number
          updated_at: string
          year: number
        }
        Insert: {
          base_comisional?: number
          config_id: string
          created_at?: string
          created_by?: string | null
          id?: string
          meta_firmas?: number
          meta_gmv_m1?: number
          meta_gmv_usd?: number
          meta_originaciones?: number
          meta_originaciones_m1?: number
          month: number
          updated_at?: string
          year: number
        }
        Update: {
          base_comisional?: number
          config_id?: string
          created_at?: string
          created_by?: string | null
          id?: string
          meta_firmas?: number
          meta_gmv_m1?: number
          meta_gmv_usd?: number
          meta_originaciones?: number
          meta_originaciones_m1?: number
          month?: number
          updated_at?: string
          year?: number
        }
        Relationships: [
          {
            foreignKeyName: "commission_monthly_configs_config_id_fkey"
            columns: ["config_id"]
            isOneToOne: false
            referencedRelation: "commission_calculator_configs"
            referencedColumns: ["id"]
          },
        ]
      }
      commission_reviews: {
        Row: {
          base_commission: number
          calculated_commission: number
          candado_met: boolean
          created_at: string
          firmas_compliance: number
          firmas_meta: number
          firmas_real: number
          gmv_meta: number
          gmv_real: number
          gmv_weighted: number
          has_mb_income: boolean
          id: string
          indicator_bonus: number
          observations: string | null
          originaciones_meta: number
          originaciones_real: number
          originaciones_weighted: number
          period_month: number
          period_year: number
          regional: string | null
          rejection_reason: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          status: string
          total_commission: number
          updated_at: string
          user_email: string
          user_name: string | null
        }
        Insert: {
          base_commission?: number
          calculated_commission?: number
          candado_met?: boolean
          created_at?: string
          firmas_compliance?: number
          firmas_meta?: number
          firmas_real?: number
          gmv_meta?: number
          gmv_real?: number
          gmv_weighted?: number
          has_mb_income?: boolean
          id?: string
          indicator_bonus?: number
          observations?: string | null
          originaciones_meta?: number
          originaciones_real?: number
          originaciones_weighted?: number
          period_month: number
          period_year: number
          regional?: string | null
          rejection_reason?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          total_commission?: number
          updated_at?: string
          user_email: string
          user_name?: string | null
        }
        Update: {
          base_commission?: number
          calculated_commission?: number
          candado_met?: boolean
          created_at?: string
          firmas_compliance?: number
          firmas_meta?: number
          firmas_real?: number
          gmv_meta?: number
          gmv_real?: number
          gmv_weighted?: number
          has_mb_income?: boolean
          id?: string
          indicator_bonus?: number
          observations?: string | null
          originaciones_meta?: number
          originaciones_real?: number
          originaciones_weighted?: number
          period_month?: number
          period_year?: number
          regional?: string | null
          rejection_reason?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          total_commission?: number
          updated_at?: string
          user_email?: string
          user_name?: string | null
        }
        Relationships: []
      }
      course_enrollments: {
        Row: {
          completed_at: string | null
          course_id: string
          created_at: string
          id: string
          personal_expires_at: string | null
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
          personal_expires_at?: string | null
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
          personal_expires_at?: string | null
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
      course_folders: {
        Row: {
          color: string | null
          created_at: string
          created_by: string
          description: string | null
          id: string
          name: string
          order_index: number | null
          updated_at: string
        }
        Insert: {
          color?: string | null
          created_at?: string
          created_by: string
          description?: string | null
          id?: string
          name: string
          order_index?: number | null
          updated_at?: string
        }
        Update: {
          color?: string | null
          created_at?: string
          created_by?: string
          description?: string | null
          id?: string
          name?: string
          order_index?: number | null
          updated_at?: string
        }
        Relationships: []
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
      course_resources: {
        Row: {
          course_id: string
          created_at: string
          id: string
          order_index: number
          title: string
          url: string
        }
        Insert: {
          course_id: string
          created_at?: string
          id?: string
          order_index?: number
          title: string
          url: string
        }
        Update: {
          course_id?: string
          created_at?: string
          id?: string
          order_index?: number
          title?: string
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "course_resources_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
        ]
      }
      course_tag_assignments: {
        Row: {
          course_id: string
          created_at: string
          id: string
          tag_id: string
        }
        Insert: {
          course_id: string
          created_at?: string
          id?: string
          tag_id: string
        }
        Update: {
          course_id?: string
          created_at?: string
          id?: string
          tag_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "course_tag_assignments_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "course_tag_assignments_tag_id_fkey"
            columns: ["tag_id"]
            isOneToOne: false
            referencedRelation: "course_tags"
            referencedColumns: ["id"]
          },
        ]
      }
      course_tags: {
        Row: {
          color: string
          created_at: string
          created_by: string | null
          id: string
          name: string
          priority: number
        }
        Insert: {
          color?: string
          created_at?: string
          created_by?: string | null
          id?: string
          name: string
          priority?: number
        }
        Update: {
          color?: string
          created_at?: string
          created_by?: string | null
          id?: string
          name?: string
          priority?: number
        }
        Relationships: []
      }
      courses: {
        Row: {
          ai_analysis: string | null
          ai_generation_trigger: string | null
          ai_metadata: Json | null
          cover_image_url: string | null
          created_at: string
          created_by: string | null
          description: string | null
          difficulty: Database["public"]["Enums"]["difficulty_level"]
          dimension: Database["public"]["Enums"]["training_dimension"]
          estimated_duration_minutes: number | null
          expires_at: string | null
          folder_id: string | null
          id: string
          is_ai_generated: boolean
          language: string
          objectives: string[] | null
          order_index: number | null
          points: number
          process_id: string | null
          published_at: string | null
          scheduled_at: string | null
          status: Database["public"]["Enums"]["course_status"]
          subtitles_enabled: boolean
          tags: string[] | null
          target_audience: string[] | null
          target_teams: string[] | null
          target_users: string[] | null
          time_limit_minutes: number | null
          title: string
          updated_at: string
        }
        Insert: {
          ai_analysis?: string | null
          ai_generation_trigger?: string | null
          ai_metadata?: Json | null
          cover_image_url?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          difficulty?: Database["public"]["Enums"]["difficulty_level"]
          dimension?: Database["public"]["Enums"]["training_dimension"]
          estimated_duration_minutes?: number | null
          expires_at?: string | null
          folder_id?: string | null
          id?: string
          is_ai_generated?: boolean
          language?: string
          objectives?: string[] | null
          order_index?: number | null
          points?: number
          process_id?: string | null
          published_at?: string | null
          scheduled_at?: string | null
          status?: Database["public"]["Enums"]["course_status"]
          subtitles_enabled?: boolean
          tags?: string[] | null
          target_audience?: string[] | null
          target_teams?: string[] | null
          target_users?: string[] | null
          time_limit_minutes?: number | null
          title: string
          updated_at?: string
        }
        Update: {
          ai_analysis?: string | null
          ai_generation_trigger?: string | null
          ai_metadata?: Json | null
          cover_image_url?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          difficulty?: Database["public"]["Enums"]["difficulty_level"]
          dimension?: Database["public"]["Enums"]["training_dimension"]
          estimated_duration_minutes?: number | null
          expires_at?: string | null
          folder_id?: string | null
          id?: string
          is_ai_generated?: boolean
          language?: string
          objectives?: string[] | null
          order_index?: number | null
          points?: number
          process_id?: string | null
          published_at?: string | null
          scheduled_at?: string | null
          status?: Database["public"]["Enums"]["course_status"]
          subtitles_enabled?: boolean
          tags?: string[] | null
          target_audience?: string[] | null
          target_teams?: string[] | null
          target_users?: string[] | null
          time_limit_minutes?: number | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "courses_folder_id_fkey"
            columns: ["folder_id"]
            isOneToOne: false
            referencedRelation: "course_folders"
            referencedColumns: ["id"]
          },
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
          feedback_type: string | null
          id: string
          material_id: string | null
          message: string
          points_awarded: number | null
          rating: number | null
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
          feedback_type?: string | null
          id?: string
          material_id?: string | null
          message: string
          points_awarded?: number | null
          rating?: number | null
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
          feedback_type?: string | null
          id?: string
          material_id?: string | null
          message?: string
          points_awarded?: number | null
          rating?: number | null
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
          {
            foreignKeyName: "feedback_material_id_fkey"
            columns: ["material_id"]
            isOneToOne: false
            referencedRelation: "training_materials"
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
      followup_accompaniments: {
        Row: {
          comp_abordaje: number | null
          comp_claridad_negociacion: number | null
          comp_conocimiento_confianza: number | null
          comp_objeciones_cierre: number | null
          comp_optimiza_zona: number | null
          comp_pitch_comercial: number | null
          craft_conocimiento_productos: string | null
          craft_herramientas: string | null
          craft_manejo_objeciones: string | null
          craft_negociacion: string | null
          craft_persuasion: string | null
          created_at: string
          evaluator_email: string
          evidencia_url: string | null
          executive_email: string
          executive_name: string
          fecha_nuevo_acompanamiento: string | null
          google_sheets_row_id: string | null
          id: string
          necesidades_identificadas: string | null
          observaciones: string | null
          oportunidades_entrenamiento: string | null
          regional: string
          synced_at: string | null
          timestamp: string
        }
        Insert: {
          comp_abordaje?: number | null
          comp_claridad_negociacion?: number | null
          comp_conocimiento_confianza?: number | null
          comp_objeciones_cierre?: number | null
          comp_optimiza_zona?: number | null
          comp_pitch_comercial?: number | null
          craft_conocimiento_productos?: string | null
          craft_herramientas?: string | null
          craft_manejo_objeciones?: string | null
          craft_negociacion?: string | null
          craft_persuasion?: string | null
          created_at?: string
          evaluator_email: string
          evidencia_url?: string | null
          executive_email: string
          executive_name: string
          fecha_nuevo_acompanamiento?: string | null
          google_sheets_row_id?: string | null
          id?: string
          necesidades_identificadas?: string | null
          observaciones?: string | null
          oportunidades_entrenamiento?: string | null
          regional: string
          synced_at?: string | null
          timestamp: string
        }
        Update: {
          comp_abordaje?: number | null
          comp_claridad_negociacion?: number | null
          comp_conocimiento_confianza?: number | null
          comp_objeciones_cierre?: number | null
          comp_optimiza_zona?: number | null
          comp_pitch_comercial?: number | null
          craft_conocimiento_productos?: string | null
          craft_herramientas?: string | null
          craft_manejo_objeciones?: string | null
          craft_negociacion?: string | null
          craft_persuasion?: string | null
          created_at?: string
          evaluator_email?: string
          evidencia_url?: string | null
          executive_email?: string
          executive_name?: string
          fecha_nuevo_acompanamiento?: string | null
          google_sheets_row_id?: string | null
          id?: string
          necesidades_identificadas?: string | null
          observaciones?: string | null
          oportunidades_entrenamiento?: string | null
          regional?: string
          synced_at?: string | null
          timestamp?: string
        }
        Relationships: []
      }
      followup_quality_evaluations: {
        Row: {
          bot_actualizacion_correos: boolean | null
          calificacion_aliados: string | null
          created_at: string
          cumple_requisitos_activacion: boolean | null
          documentos_completos: boolean | null
          evaluation_date: string | null
          flujo_salesforce_correcto: boolean | null
          formatos_slug_correctos: boolean | null
          fotos_correctas_primer_intento: boolean | null
          gestion_tyc_oportuna: boolean | null
          google_sheets_row_id: string | null
          hunter_email: string
          hunter_name: string
          id: string
          info_comercial_correcta: boolean | null
          leader_email: string | null
          recomendacion_compromisos: string | null
          red_social_correcta: boolean | null
          score: string | null
          score_numeric: number | null
          slug_monitoreado: string | null
          slug_monitoreado_2: string | null
          synced_at: string | null
          timestamp: string
          valida_duplicidad_sf: boolean | null
        }
        Insert: {
          bot_actualizacion_correos?: boolean | null
          calificacion_aliados?: string | null
          created_at?: string
          cumple_requisitos_activacion?: boolean | null
          documentos_completos?: boolean | null
          evaluation_date?: string | null
          flujo_salesforce_correcto?: boolean | null
          formatos_slug_correctos?: boolean | null
          fotos_correctas_primer_intento?: boolean | null
          gestion_tyc_oportuna?: boolean | null
          google_sheets_row_id?: string | null
          hunter_email: string
          hunter_name: string
          id?: string
          info_comercial_correcta?: boolean | null
          leader_email?: string | null
          recomendacion_compromisos?: string | null
          red_social_correcta?: boolean | null
          score?: string | null
          score_numeric?: number | null
          slug_monitoreado?: string | null
          slug_monitoreado_2?: string | null
          synced_at?: string | null
          timestamp: string
          valida_duplicidad_sf?: boolean | null
        }
        Update: {
          bot_actualizacion_correos?: boolean | null
          calificacion_aliados?: string | null
          created_at?: string
          cumple_requisitos_activacion?: boolean | null
          documentos_completos?: boolean | null
          evaluation_date?: string | null
          flujo_salesforce_correcto?: boolean | null
          formatos_slug_correctos?: boolean | null
          fotos_correctas_primer_intento?: boolean | null
          gestion_tyc_oportuna?: boolean | null
          google_sheets_row_id?: string | null
          hunter_email?: string
          hunter_name?: string
          id?: string
          info_comercial_correcta?: boolean | null
          leader_email?: string | null
          recomendacion_compromisos?: string | null
          red_social_correcta?: boolean | null
          score?: string | null
          score_numeric?: number | null
          slug_monitoreado?: string | null
          slug_monitoreado_2?: string | null
          synced_at?: string | null
          timestamp?: string
          valida_duplicidad_sf?: boolean | null
        }
        Relationships: []
      }
      followup_universal_feedback: {
        Row: {
          acciones_resaltar: string | null
          compromiso_colega: string | null
          compromiso_seguimiento: string | null
          conclusiones_plan: string | null
          consecuencia: string | null
          consecuencia_seguimiento: string | null
          created_at: string
          diagnostico_desempeno: string | null
          duracion_plan: string | null
          evaluacion_final: string | null
          executive_email: string
          executive_name: string
          expectativa_clara: string | null
          expectativa_seguimiento: string | null
          feedback_date: string | null
          feedback_type: string
          google_sheets_row_id: string | null
          hecho_observado: string | null
          id: string
          impacto_incumplimiento: string | null
          impacto_seguimiento: string | null
          leader_email: string
          objetivo_metrica_exito: string | null
          oportunidades_trabajar: string | null
          plan_accion_semanas: string | null
          plan_apoyo: string | null
          plan_apoyo_seguimiento: string | null
          proxima_fecha_feedback: string | null
          proxima_fecha_revision: string | null
          regional: string
          regla_metrica: string | null
          regla_metrica_seguimiento: string | null
          seguimiento_reuniones: string | null
          synced_at: string | null
          team: string | null
          timestamp: string
        }
        Insert: {
          acciones_resaltar?: string | null
          compromiso_colega?: string | null
          compromiso_seguimiento?: string | null
          conclusiones_plan?: string | null
          consecuencia?: string | null
          consecuencia_seguimiento?: string | null
          created_at?: string
          diagnostico_desempeno?: string | null
          duracion_plan?: string | null
          evaluacion_final?: string | null
          executive_email: string
          executive_name: string
          expectativa_clara?: string | null
          expectativa_seguimiento?: string | null
          feedback_date?: string | null
          feedback_type: string
          google_sheets_row_id?: string | null
          hecho_observado?: string | null
          id?: string
          impacto_incumplimiento?: string | null
          impacto_seguimiento?: string | null
          leader_email: string
          objetivo_metrica_exito?: string | null
          oportunidades_trabajar?: string | null
          plan_accion_semanas?: string | null
          plan_apoyo?: string | null
          plan_apoyo_seguimiento?: string | null
          proxima_fecha_feedback?: string | null
          proxima_fecha_revision?: string | null
          regional: string
          regla_metrica?: string | null
          regla_metrica_seguimiento?: string | null
          seguimiento_reuniones?: string | null
          synced_at?: string | null
          team?: string | null
          timestamp: string
        }
        Update: {
          acciones_resaltar?: string | null
          compromiso_colega?: string | null
          compromiso_seguimiento?: string | null
          conclusiones_plan?: string | null
          consecuencia?: string | null
          consecuencia_seguimiento?: string | null
          created_at?: string
          diagnostico_desempeno?: string | null
          duracion_plan?: string | null
          evaluacion_final?: string | null
          executive_email?: string
          executive_name?: string
          expectativa_clara?: string | null
          expectativa_seguimiento?: string | null
          feedback_date?: string | null
          feedback_type?: string
          google_sheets_row_id?: string | null
          hecho_observado?: string | null
          id?: string
          impacto_incumplimiento?: string | null
          impacto_seguimiento?: string | null
          leader_email?: string
          objetivo_metrica_exito?: string | null
          oportunidades_trabajar?: string | null
          plan_accion_semanas?: string | null
          plan_apoyo?: string | null
          plan_apoyo_seguimiento?: string | null
          proxima_fecha_feedback?: string | null
          proxima_fecha_revision?: string | null
          regional?: string
          regla_metrica?: string | null
          regla_metrica_seguimiento?: string | null
          seguimiento_reuniones?: string | null
          synced_at?: string | null
          team?: string | null
          timestamp?: string
        }
        Relationships: []
      }
      glossary_terms: {
        Row: {
          created_at: string
          created_by: string | null
          definition: string
          example: string | null
          id: string
          related_terms: string[] | null
          term: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          definition: string
          example?: string | null
          id?: string
          related_terms?: string[] | null
          term: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          definition?: string
          example?: string | null
          id?: string
          related_terms?: string[] | null
          term?: string
          updated_at?: string
        }
        Relationships: []
      }
      impersonation_audit_log: {
        Row: {
          created_at: string
          failure_reason: string | null
          id: string
          ip_address: string | null
          requester_id: string
          success: boolean
          target_email: string
        }
        Insert: {
          created_at?: string
          failure_reason?: string | null
          id?: string
          ip_address?: string | null
          requester_id: string
          success?: boolean
          target_email: string
        }
        Update: {
          created_at?: string
          failure_reason?: string | null
          id?: string
          ip_address?: string | null
          requester_id?: string
          success?: boolean
          target_email?: string
        }
        Relationships: []
      }
      leader_hierarchy: {
        Row: {
          assigned_by: string | null
          created_at: string
          id: string
          subordinate_id: string
          supervisor_id: string
          updated_at: string
        }
        Insert: {
          assigned_by?: string | null
          created_at?: string
          id?: string
          subordinate_id: string
          supervisor_id: string
          updated_at?: string
        }
        Update: {
          assigned_by?: string | null
          created_at?: string
          id?: string
          subordinate_id?: string
          supervisor_id?: string
          updated_at?: string
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
      material_categories: {
        Row: {
          color: string | null
          created_at: string
          created_by: string | null
          description: string | null
          id: string
          name: string
          order_index: number | null
          parent_id: string | null
          section_id: string | null
          updated_at: string
        }
        Insert: {
          color?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          name: string
          order_index?: number | null
          parent_id?: string | null
          section_id?: string | null
          updated_at?: string
        }
        Update: {
          color?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          name?: string
          order_index?: number | null
          parent_id?: string | null
          section_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "material_categories_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "material_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "material_categories_section_id_fkey"
            columns: ["section_id"]
            isOneToOne: false
            referencedRelation: "category_sections"
            referencedColumns: ["id"]
          },
        ]
      }
      material_faqs: {
        Row: {
          answer: string
          created_at: string
          created_by: string | null
          id: string
          material_id: string
          order_index: number | null
          question: string
          updated_at: string
        }
        Insert: {
          answer: string
          created_at?: string
          created_by?: string | null
          id?: string
          material_id: string
          order_index?: number | null
          question: string
          updated_at?: string
        }
        Update: {
          answer?: string
          created_at?: string
          created_by?: string | null
          id?: string
          material_id?: string
          order_index?: number | null
          question?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "material_faqs_material_id_fkey"
            columns: ["material_id"]
            isOneToOne: false
            referencedRelation: "training_materials"
            referencedColumns: ["id"]
          },
        ]
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
      material_tag_assignments: {
        Row: {
          created_at: string
          id: string
          material_id: string
          tag_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          material_id: string
          tag_id: string
        }
        Update: {
          created_at?: string
          id?: string
          material_id?: string
          tag_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "material_tag_assignments_material_id_fkey"
            columns: ["material_id"]
            isOneToOne: false
            referencedRelation: "training_materials"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "material_tag_assignments_tag_id_fkey"
            columns: ["tag_id"]
            isOneToOne: false
            referencedRelation: "material_tags"
            referencedColumns: ["id"]
          },
        ]
      }
      material_tags: {
        Row: {
          color: string
          created_at: string
          created_by: string | null
          id: string
          name: string
          priority: number
        }
        Insert: {
          color?: string
          created_at?: string
          created_by?: string | null
          id?: string
          name: string
          priority?: number
        }
        Update: {
          color?: string
          created_at?: string
          created_by?: string | null
          id?: string
          name?: string
          priority?: number
        }
        Relationships: []
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
      portal_section_configs: {
        Row: {
          created_at: string
          description: string | null
          id: string
          is_enabled: boolean
          section_key: string
          section_name: string
          target_leaders: string[] | null
          target_teams: string[] | null
          target_users: string[] | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          is_enabled?: boolean
          section_key: string
          section_name: string
          target_leaders?: string[] | null
          target_teams?: string[] | null
          target_users?: string[] | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          is_enabled?: boolean
          section_key?: string
          section_name?: string
          target_leaders?: string[] | null
          target_teams?: string[] | null
          target_users?: string[] | null
          updated_at?: string
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
          is_guaranteed: boolean
          last_login: string | null
          password_changed: boolean | null
          password_changed_at: string | null
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
          is_guaranteed?: boolean
          last_login?: string | null
          password_changed?: boolean | null
          password_changed_at?: string | null
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
          is_guaranteed?: boolean
          last_login?: string | null
          password_changed?: boolean | null
          password_changed_at?: string | null
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
      team_feedback_forms: {
        Row: {
          created_at: string
          created_by: string | null
          description: string | null
          embed_url: string
          id: string
          is_active: boolean | null
          name: string
          target_leaders: string[] | null
          target_teams: string[] | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          embed_url: string
          id?: string
          is_active?: boolean | null
          name: string
          target_leaders?: string[] | null
          target_teams?: string[] | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          embed_url?: string
          id?: string
          is_active?: boolean | null
          name?: string
          target_leaders?: string[] | null
          target_teams?: string[] | null
          updated_at?: string
        }
        Relationships: []
      }
      team_results: {
        Row: {
          batch_id: string | null
          created_at: string
          dias_habiles_mes: number
          dias_habiles_transcurridos: number
          firmas_meta: number
          firmas_real: number
          gmv_meta: number
          gmv_real: number
          id: string
          originaciones_meta: number
          originaciones_real: number
          period_date: string
          regional: string | null
          team: string | null
          updated_at: string
          uploaded_by: string | null
          user_email: string
          weeks_in_month: number
        }
        Insert: {
          batch_id?: string | null
          created_at?: string
          dias_habiles_mes?: number
          dias_habiles_transcurridos?: number
          firmas_meta?: number
          firmas_real?: number
          gmv_meta?: number
          gmv_real?: number
          id?: string
          originaciones_meta?: number
          originaciones_real?: number
          period_date: string
          regional?: string | null
          team?: string | null
          updated_at?: string
          uploaded_by?: string | null
          user_email: string
          weeks_in_month?: number
        }
        Update: {
          batch_id?: string | null
          created_at?: string
          dias_habiles_mes?: number
          dias_habiles_transcurridos?: number
          firmas_meta?: number
          firmas_real?: number
          gmv_meta?: number
          gmv_real?: number
          id?: string
          originaciones_meta?: number
          originaciones_real?: number
          period_date?: string
          regional?: string | null
          team?: string | null
          updated_at?: string
          uploaded_by?: string | null
          user_email?: string
          weeks_in_month?: number
        }
        Relationships: []
      }
      tools: {
        Row: {
          created_at: string
          created_by: string | null
          description: string | null
          id: string
          is_active: boolean | null
          name: string
          target_teams: string[] | null
          type: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          target_teams?: string[] | null
          type?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          target_teams?: string[] | null
          type?: string
          updated_at?: string
        }
        Relationships: []
      }
      training_materials: {
        Row: {
          category_id: string | null
          content_text: string | null
          content_url: string | null
          created_at: string
          created_by: string | null
          description: string | null
          id: string
          is_published: boolean | null
          keywords: string[] | null
          order_index: number | null
          target_teams: string[] | null
          title: string
          type: string
          updated_at: string
        }
        Insert: {
          category_id?: string | null
          content_text?: string | null
          content_url?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          is_published?: boolean | null
          keywords?: string[] | null
          order_index?: number | null
          target_teams?: string[] | null
          title: string
          type: string
          updated_at?: string
        }
        Update: {
          category_id?: string | null
          content_text?: string | null
          content_url?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          is_published?: boolean | null
          keywords?: string[] | null
          order_index?: number | null
          target_teams?: string[] | null
          title?: string
          type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "training_materials_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "material_categories"
            referencedColumns: ["id"]
          },
        ]
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
      add_business_days: {
        Args: { num_days: number; start_date: string }
        Returns: string
      }
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
      publish_scheduled_courses: { Args: never; Returns: undefined }
    }
    Enums: {
      app_role: "student" | "creator" | "admin" | "lider" | "analista" | "qa"
      content_type: "video" | "documento" | "link" | "quiz" | "encuesta"
      course_status: "draft" | "published" | "archived" | "rejected"
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
      app_role: ["student", "creator", "admin", "lider", "analista", "qa"],
      content_type: ["video", "documento", "link", "quiz", "encuesta"],
      course_status: ["draft", "published", "archived", "rejected"],
      difficulty_level: ["basico", "medio", "avanzado"],
      training_dimension: ["onboarding", "refuerzo", "taller", "entrenamiento"],
    },
  },
} as const
