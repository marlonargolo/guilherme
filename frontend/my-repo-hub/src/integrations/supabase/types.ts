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
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      admin_notifications: {
        Row: {
          id: string
          message: string
          metadata: Json | null
          sent_at: string | null
          status: string
          type: string
          user_id: string
        }
        Insert: {
          id?: string
          message: string
          metadata?: Json | null
          sent_at?: string | null
          status?: string
          type: string
          user_id: string
        }
        Update: {
          id?: string
          message?: string
          metadata?: Json | null
          sent_at?: string | null
          status?: string
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      admin_settings: {
        Row: {
          id: string
          key: string
          updated_at: string | null
          updated_by: string | null
          value: Json
        }
        Insert: {
          id?: string
          key: string
          updated_at?: string | null
          updated_by?: string | null
          value: Json
        }
        Update: {
          id?: string
          key?: string
          updated_at?: string | null
          updated_by?: string | null
          value?: Json
        }
        Relationships: []
      }
      ai_chat_messages: {
        Row: {
          content: string
          created_at: string | null
          id: string
          role: string
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string | null
          id?: string
          role: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string | null
          id?: string
          role?: string
          user_id?: string
        }
        Relationships: []
      }
      ai_prompts: {
        Row: {
          category: string | null
          created_at: string
          id: string
          is_active: boolean | null
          is_main: boolean | null
          name: string
          prompt: string
          updated_at: string
          user_id: string
        }
        Insert: {
          category?: string | null
          created_at?: string
          id?: string
          is_active?: boolean | null
          is_main?: boolean | null
          name: string
          prompt: string
          updated_at?: string
          user_id: string
        }
        Update: {
          category?: string | null
          created_at?: string
          id?: string
          is_active?: boolean | null
          is_main?: boolean | null
          name?: string
          prompt?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      audit_logs: {
        Row: {
          action: string
          created_at: string
          details: string | null
          id: string
          ip_address: string | null
          level: string
          resource: string
          user_id: string | null
        }
        Insert: {
          action: string
          created_at?: string
          details?: string | null
          id?: string
          ip_address?: string | null
          level?: string
          resource: string
          user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string
          details?: string | null
          id?: string
          ip_address?: string | null
          level?: string
          resource?: string
          user_id?: string | null
        }
        Relationships: []
      }
      automation_execution_logs: {
        Row: {
          automation_id: string
          created_at: string
          error_details: string | null
          execution_time_ms: number | null
          id: string
          queue_id: string
          request_payload: Json | null
          response_payload: Json | null
          status: string
          user_id: string | null
        }
        Insert: {
          automation_id: string
          created_at?: string
          error_details?: string | null
          execution_time_ms?: number | null
          id?: string
          queue_id: string
          request_payload?: Json | null
          response_payload?: Json | null
          status: string
          user_id?: string | null
        }
        Update: {
          automation_id?: string
          created_at?: string
          error_details?: string | null
          execution_time_ms?: number | null
          id?: string
          queue_id?: string
          request_payload?: Json | null
          response_payload?: Json | null
          status?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "automation_execution_logs_automation_id_fkey"
            columns: ["automation_id"]
            isOneToOne: false
            referencedRelation: "python_automations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "automation_execution_logs_queue_id_fkey"
            columns: ["queue_id"]
            isOneToOne: false
            referencedRelation: "automation_queue"
            referencedColumns: ["id"]
          },
        ]
      }
      automation_interactions: {
        Row: {
          created_at: string
          current_card_id: string | null
          flow_id: string
          id: string
          instagram_username: string
          interaction_data: Json
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          current_card_id?: string | null
          flow_id: string
          id?: string
          instagram_username: string
          interaction_data?: Json
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          current_card_id?: string | null
          flow_id?: string
          id?: string
          instagram_username?: string
          interaction_data?: Json
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "automation_interactions_current_card_id_fkey"
            columns: ["current_card_id"]
            isOneToOne: false
            referencedRelation: "flow_cards"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "automation_interactions_flow_id_fkey"
            columns: ["flow_id"]
            isOneToOne: false
            referencedRelation: "instagram_flows"
            referencedColumns: ["id"]
          },
        ]
      }
      automation_logs: {
        Row: {
          action_taken: string
          app_type: string
          automation_type: string
          channel: string
          created_at: string
          error_message: string | null
          id: string
          metadata: Json | null
          status: string
          trigger_event: string
          user_id: string
        }
        Insert: {
          action_taken: string
          app_type: string
          automation_type: string
          channel: string
          created_at?: string
          error_message?: string | null
          id?: string
          metadata?: Json | null
          status: string
          trigger_event: string
          user_id: string
        }
        Update: {
          action_taken?: string
          app_type?: string
          automation_type?: string
          channel?: string
          created_at?: string
          error_message?: string | null
          id?: string
          metadata?: Json | null
          status?: string
          trigger_event?: string
          user_id?: string
        }
        Relationships: []
      }
      automation_queue: {
        Row: {
          attempts: number
          automation_id: string
          completed_at: string | null
          created_at: string
          error_message: string | null
          id: string
          max_attempts: number
          payload: Json
          priority: number
          result: Json | null
          scheduled_for: string
          started_at: string | null
          status: string
          user_id: string | null
        }
        Insert: {
          attempts?: number
          automation_id: string
          completed_at?: string | null
          created_at?: string
          error_message?: string | null
          id?: string
          max_attempts?: number
          payload?: Json
          priority?: number
          result?: Json | null
          scheduled_for?: string
          started_at?: string | null
          status?: string
          user_id?: string | null
        }
        Update: {
          attempts?: number
          automation_id?: string
          completed_at?: string | null
          created_at?: string
          error_message?: string | null
          id?: string
          max_attempts?: number
          payload?: Json
          priority?: number
          result?: Json | null
          scheduled_for?: string
          started_at?: string | null
          status?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "automation_queue_automation_id_fkey"
            columns: ["automation_id"]
            isOneToOne: false
            referencedRelation: "python_automations"
            referencedColumns: ["id"]
          },
        ]
      }
      contacts: {
        Row: {
          avatar_url: string | null
          created_at: string | null
          id: string
          metadata: Json | null
          name: string
          phone_number: string | null
          platform: string
          platform_user_id: string
          updated_at: string | null
          user_id: string
          username: string | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string | null
          id?: string
          metadata?: Json | null
          name: string
          phone_number?: string | null
          platform: string
          platform_user_id: string
          updated_at?: string | null
          user_id: string
          username?: string | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string | null
          id?: string
          metadata?: Json | null
          name?: string
          phone_number?: string | null
          platform?: string
          platform_user_id?: string
          updated_at?: string | null
          user_id?: string
          username?: string | null
        }
        Relationships: []
      }
      conversations: {
        Row: {
          ai_confidence: number | null
          ai_status: string | null
          assigned_to: string | null
          contact_id: string
          created_at: string | null
          id: string
          last_message_at: string | null
          last_message_preview: string | null
          metadata: Json | null
          platform: string
          status: string
          unread_count: number | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          ai_confidence?: number | null
          ai_status?: string | null
          assigned_to?: string | null
          contact_id: string
          created_at?: string | null
          id?: string
          last_message_at?: string | null
          last_message_preview?: string | null
          metadata?: Json | null
          platform: string
          status?: string
          unread_count?: number | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          ai_confidence?: number | null
          ai_status?: string | null
          assigned_to?: string | null
          contact_id?: string
          created_at?: string | null
          id?: string
          last_message_at?: string | null
          last_message_preview?: string | null
          metadata?: Json | null
          platform?: string
          status?: string
          unread_count?: number | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "conversations_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
        ]
      }
      coupon_usage: {
        Row: {
          coupon_id: string
          expires_at: string
          id: string
          sent_at: string | null
          status: string
          stripe_session_id: string | null
          stripe_subscription_id: string | null
          used_at: string
          user_email: string
          user_id: string
        }
        Insert: {
          coupon_id: string
          expires_at: string
          id?: string
          sent_at?: string | null
          status?: string
          stripe_session_id?: string | null
          stripe_subscription_id?: string | null
          used_at?: string
          user_email?: string
          user_id: string
        }
        Update: {
          coupon_id?: string
          expires_at?: string
          id?: string
          sent_at?: string | null
          status?: string
          stripe_session_id?: string | null
          stripe_subscription_id?: string | null
          used_at?: string
          user_email?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "coupon_usage_coupon_id_fkey"
            columns: ["coupon_id"]
            isOneToOne: false
            referencedRelation: "retention_coupons"
            referencedColumns: ["id"]
          },
        ]
      }
      custom_endpoints: {
        Row: {
          body: Json | null
          created_at: string | null
          headers: Json | null
          id: string
          method: string
          name: string
          url: string
          user_id: string
        }
        Insert: {
          body?: Json | null
          created_at?: string | null
          headers?: Json | null
          id?: string
          method?: string
          name: string
          url: string
          user_id: string
        }
        Update: {
          body?: Json | null
          created_at?: string | null
          headers?: Json | null
          id?: string
          method?: string
          name?: string
          url?: string
          user_id?: string
        }
        Relationships: []
      }
      dm_automation_logs: {
        Row: {
          automation_id: string
          id: string
          platform: string
          recipient_username: string
          sent_at: string
          status: string
          trigger_content: string | null
          user_id: string
        }
        Insert: {
          automation_id: string
          id?: string
          platform: string
          recipient_username: string
          sent_at?: string
          status?: string
          trigger_content?: string | null
          user_id: string
        }
        Update: {
          automation_id?: string
          id?: string
          platform?: string
          recipient_username?: string
          sent_at?: string
          status?: string
          trigger_content?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "dm_automation_logs_automation_id_fkey"
            columns: ["automation_id"]
            isOneToOne: false
            referencedRelation: "dm_automations"
            referencedColumns: ["id"]
          },
        ]
      }
      dm_automation_messages: {
        Row: {
          automation_id: string
          buttons: Json | null
          content: string
          created_at: string
          delay_seconds: number | null
          followup_delay_hours: number | null
          id: string
          is_followup: boolean | null
          media_url: string | null
          message_order: number
          message_type: string
          use_ai_response: boolean | null
        }
        Insert: {
          automation_id: string
          buttons?: Json | null
          content: string
          created_at?: string
          delay_seconds?: number | null
          followup_delay_hours?: number | null
          id?: string
          is_followup?: boolean | null
          media_url?: string | null
          message_order?: number
          message_type: string
          use_ai_response?: boolean | null
        }
        Update: {
          automation_id?: string
          buttons?: Json | null
          content?: string
          created_at?: string
          delay_seconds?: number | null
          followup_delay_hours?: number | null
          id?: string
          is_followup?: boolean | null
          media_url?: string | null
          message_order?: number
          message_type?: string
          use_ai_response?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "dm_automation_messages_automation_id_fkey"
            columns: ["automation_id"]
            isOneToOne: false
            referencedRelation: "dm_automations"
            referencedColumns: ["id"]
          },
        ]
      }
      dm_automations: {
        Row: {
          active: boolean
          created_at: string
          id: string
          name: string
          platforms: string[]
          trigger_keyword: string | null
          trigger_type: string
          updated_at: string
          user_id: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          id?: string
          name: string
          platforms: string[]
          trigger_keyword?: string | null
          trigger_type: string
          updated_at?: string
          user_id: string
        }
        Update: {
          active?: boolean
          created_at?: string
          id?: string
          name?: string
          platforms?: string[]
          trigger_keyword?: string | null
          trigger_type?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      feature_packs: {
        Row: {
          expires_at: string | null
          features: Json
          id: string
          is_active: boolean
          pack_name: string
          price: number
          purchased_at: string
          stripe_payment_id: string | null
          user_id: string
        }
        Insert: {
          expires_at?: string | null
          features?: Json
          id?: string
          is_active?: boolean
          pack_name: string
          price: number
          purchased_at?: string
          stripe_payment_id?: string | null
          user_id: string
        }
        Update: {
          expires_at?: string | null
          features?: Json
          id?: string
          is_active?: boolean
          pack_name?: string
          price?: number
          purchased_at?: string
          stripe_payment_id?: string | null
          user_id?: string
        }
        Relationships: []
      }
      flow_cards: {
        Row: {
          card_type: Database["public"]["Enums"]["card_type"]
          connections: Json
          content: Json
          created_at: string
          flow_id: string
          id: string
          name: string
          position: Json
        }
        Insert: {
          card_type: Database["public"]["Enums"]["card_type"]
          connections?: Json
          content?: Json
          created_at?: string
          flow_id: string
          id?: string
          name: string
          position?: Json
        }
        Update: {
          card_type?: Database["public"]["Enums"]["card_type"]
          connections?: Json
          content?: Json
          created_at?: string
          flow_id?: string
          id?: string
          name?: string
          position?: Json
        }
        Relationships: [
          {
            foreignKeyName: "flow_cards_flow_id_fkey"
            columns: ["flow_id"]
            isOneToOne: false
            referencedRelation: "instagram_flows"
            referencedColumns: ["id"]
          },
        ]
      }
      instagram_flows: {
        Row: {
          created_at: string
          description: string | null
          id: string
          name: string
          status: Database["public"]["Enums"]["automation_status"]
          trigger_post_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          name: string
          status?: Database["public"]["Enums"]["automation_status"]
          trigger_post_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          status?: Database["public"]["Enums"]["automation_status"]
          trigger_post_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      integrations: {
        Row: {
          account_id: string | null
          account_name: string | null
          app_type: string | null
          channel: Database["public"]["Enums"]["integration_channel"]
          created_at: string | null
          credentials: Json | null
          encrypted_credentials: string | null
          id: string
          last_sync: string | null
          oauth_expires_at: string | null
          oauth_refresh_token: string | null
          oauth_token: string | null
          phone_number: string | null
          status: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          account_id?: string | null
          account_name?: string | null
          app_type?: string | null
          channel: Database["public"]["Enums"]["integration_channel"]
          created_at?: string | null
          credentials?: Json | null
          encrypted_credentials?: string | null
          id?: string
          last_sync?: string | null
          oauth_expires_at?: string | null
          oauth_refresh_token?: string | null
          oauth_token?: string | null
          phone_number?: string | null
          status?: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          account_id?: string | null
          account_name?: string | null
          app_type?: string | null
          channel?: Database["public"]["Enums"]["integration_channel"]
          created_at?: string | null
          credentials?: Json | null
          encrypted_credentials?: string | null
          id?: string
          last_sync?: string | null
          oauth_expires_at?: string | null
          oauth_refresh_token?: string | null
          oauth_token?: string | null
          phone_number?: string | null
          status?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      live_chat_messages: {
        Row: {
          content: string
          created_at: string
          id: string
          read: boolean
          sender_id: string
          sender_type: string
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          read?: boolean
          sender_id: string
          sender_type: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          read?: boolean
          sender_id?: string
          sender_type?: string
          user_id?: string
        }
        Relationships: []
      }
      login_attempts: {
        Row: {
          attempt_time: string
          email: string
          id: string
          ip_address: string | null
          success: boolean
        }
        Insert: {
          attempt_time?: string
          email: string
          id?: string
          ip_address?: string | null
          success?: boolean
        }
        Update: {
          attempt_time?: string
          email?: string
          id?: string
          ip_address?: string | null
          success?: boolean
        }
        Relationships: []
      }
      oauth_configs: {
        Row: {
          app_type: string
          channel: string
          client_id: string
          client_secret: string
          created_at: string
          id: string
          redirect_uri: string
          scopes: string[]
          updated_at: string
        }
        Insert: {
          app_type: string
          channel: string
          client_id: string
          client_secret: string
          created_at?: string
          id?: string
          redirect_uri: string
          scopes: string[]
          updated_at?: string
        }
        Update: {
          app_type?: string
          channel?: string
          client_id?: string
          client_secret?: string
          created_at?: string
          id?: string
          redirect_uri?: string
          scopes?: string[]
          updated_at?: string
        }
        Relationships: []
      }
      oauth_states: {
        Row: {
          app_type: string
          channel: string
          created_at: string
          expires_at: string
          id: string
          state: string
          user_id: string
        }
        Insert: {
          app_type: string
          channel: string
          created_at?: string
          expires_at: string
          id?: string
          state: string
          user_id: string
        }
        Update: {
          app_type?: string
          channel?: string
          created_at?: string
          expires_at?: string
          id?: string
          state?: string
          user_id?: string
        }
        Relationships: []
      }
      omnichannel_messages: {
        Row: {
          ai_confidence: number | null
          ai_explanation: string | null
          ai_generated: boolean | null
          content: string
          conversation_id: string
          created_at: string | null
          id: string
          media_url: string | null
          message_type: string
          metadata: Json | null
          read_at: string | null
          sender_type: string
          status: string | null
        }
        Insert: {
          ai_confidence?: number | null
          ai_explanation?: string | null
          ai_generated?: boolean | null
          content: string
          conversation_id: string
          created_at?: string | null
          id?: string
          media_url?: string | null
          message_type?: string
          metadata?: Json | null
          read_at?: string | null
          sender_type: string
          status?: string | null
        }
        Update: {
          ai_confidence?: number | null
          ai_explanation?: string | null
          ai_generated?: boolean | null
          content?: string
          conversation_id?: string
          created_at?: string | null
          id?: string
          media_url?: string | null
          message_type?: string
          metadata?: Json | null
          read_at?: string | null
          sender_type?: string
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "omnichannel_messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      payments: {
        Row: {
          amount: number
          id: string
          metadata: Json | null
          payment_date: string | null
          status: string
          stripe_payment_id: string | null
          user_id: string
        }
        Insert: {
          amount: number
          id?: string
          metadata?: Json | null
          payment_date?: string | null
          status?: string
          stripe_payment_id?: string | null
          user_id: string
        }
        Update: {
          amount?: number
          id?: string
          metadata?: Json | null
          payment_date?: string | null
          status?: string
          stripe_payment_id?: string | null
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          app_type: string[] | null
          avatar_url: string | null
          bio: string | null
          company_name: string | null
          company_website: string | null
          created_at: string | null
          email: string | null
          id: string
          last_payment: string | null
          name: string | null
          next_payment: string | null
          phone: string | null
          plan: string | null
          subscription_status: string | null
          updated_at: string | null
        }
        Insert: {
          app_type?: string[] | null
          avatar_url?: string | null
          bio?: string | null
          company_name?: string | null
          company_website?: string | null
          created_at?: string | null
          email?: string | null
          id: string
          last_payment?: string | null
          name?: string | null
          next_payment?: string | null
          phone?: string | null
          plan?: string | null
          subscription_status?: string | null
          updated_at?: string | null
        }
        Update: {
          app_type?: string[] | null
          avatar_url?: string | null
          bio?: string | null
          company_name?: string | null
          company_website?: string | null
          created_at?: string | null
          email?: string | null
          id?: string
          last_payment?: string | null
          name?: string | null
          next_payment?: string | null
          phone?: string | null
          plan?: string | null
          subscription_status?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      python_automations: {
        Row: {
          automation_key: string
          config: Json
          created_at: string
          created_by: string | null
          description: string | null
          id: string
          is_active: boolean
          name: string
          retry_attempts: number
          timeout_seconds: number
          updated_at: string
          webhook_secret: string | null
          webhook_url: string
        }
        Insert: {
          automation_key: string
          config?: Json
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          is_active?: boolean
          name: string
          retry_attempts?: number
          timeout_seconds?: number
          updated_at?: string
          webhook_secret?: string | null
          webhook_url: string
        }
        Update: {
          automation_key?: string
          config?: Json
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          is_active?: boolean
          name?: string
          retry_attempts?: number
          timeout_seconds?: number
          updated_at?: string
          webhook_secret?: string | null
          webhook_url?: string
        }
        Relationships: []
      }
      retention_coupons: {
        Row: {
          code: string
          created_at: string
          created_by: string | null
          discount_percent: number
          id: string
          is_active: boolean
          stripe_coupon_id: string | null
          target_audience: string
          updated_at: string
          valid_hours: number
        }
        Insert: {
          code: string
          created_at?: string
          created_by?: string | null
          discount_percent: number
          id?: string
          is_active?: boolean
          stripe_coupon_id?: string | null
          target_audience?: string
          updated_at?: string
          valid_hours?: number
        }
        Update: {
          code?: string
          created_at?: string
          created_by?: string | null
          discount_percent?: number
          id?: string
          is_active?: boolean
          stripe_coupon_id?: string | null
          target_audience?: string
          updated_at?: string
          valid_hours?: number
        }
        Relationships: []
      }
      scheduled_posts: {
        Row: {
          content: string
          cover_image: string | null
          created_at: string | null
          engagement_prediction: string | null
          id: string
          media_url: string | null
          platforms: string[]
          scheduled_date: string
          status: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          content: string
          cover_image?: string | null
          created_at?: string | null
          engagement_prediction?: string | null
          id?: string
          media_url?: string | null
          platforms: string[]
          scheduled_date: string
          status?: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          content?: string
          cover_image?: string | null
          created_at?: string | null
          engagement_prediction?: string | null
          id?: string
          media_url?: string | null
          platforms?: string[]
          scheduled_date?: string
          status?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      subscription_cancellations: {
        Row: {
          app_type: string[] | null
          canceled_at: string | null
          coupon_sent: boolean | null
          id: string
          plan_name: string | null
          stripe_customer_id: string | null
          stripe_subscription_id: string
          user_email: string
          user_id: string
        }
        Insert: {
          app_type?: string[] | null
          canceled_at?: string | null
          coupon_sent?: boolean | null
          id?: string
          plan_name?: string | null
          stripe_customer_id?: string | null
          stripe_subscription_id: string
          user_email: string
          user_id: string
        }
        Update: {
          app_type?: string[] | null
          canceled_at?: string | null
          coupon_sent?: boolean | null
          id?: string
          plan_name?: string | null
          stripe_customer_id?: string | null
          stripe_subscription_id?: string
          user_email?: string
          user_id?: string
        }
        Relationships: []
      }
      subscription_plans: {
        Row: {
          created_at: string
          currency: string
          features: Json
          id: string
          is_active: boolean
          name: string
          price: number
          recurrence: string
          stripe_price_id: string
          stripe_product_id: string
          token_limit: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          currency?: string
          features?: Json
          id?: string
          is_active?: boolean
          name: string
          price: number
          recurrence?: string
          stripe_price_id: string
          stripe_product_id: string
          token_limit?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          currency?: string
          features?: Json
          id?: string
          is_active?: boolean
          name?: string
          price?: number
          recurrence?: string
          stripe_price_id?: string
          stripe_product_id?: string
          token_limit?: number
          updated_at?: string
        }
        Relationships: []
      }
      support_ticket_messages: {
        Row: {
          content: string
          created_at: string
          id: string
          sender_id: string
          sender_type: string
          ticket_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          sender_id: string
          sender_type: string
          ticket_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          sender_id?: string
          sender_type?: string
          ticket_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "support_ticket_messages_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "support_tickets"
            referencedColumns: ["id"]
          },
        ]
      }
      support_tickets: {
        Row: {
          assigned_admin: string | null
          category: string
          created_at: string
          id: string
          message: string
          priority: string
          status: string
          subject: string
          updated_at: string
          user_id: string
        }
        Insert: {
          assigned_admin?: string | null
          category: string
          created_at?: string
          id?: string
          message: string
          priority?: string
          status?: string
          subject: string
          updated_at?: string
          user_id: string
        }
        Update: {
          assigned_admin?: string | null
          category?: string
          created_at?: string
          id?: string
          message?: string
          priority?: string
          status?: string
          subject?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      token_packs: {
        Row: {
          applied_at: string | null
          id: string
          pack_name: string
          price: number
          purchased_at: string
          stripe_payment_id: string | null
          tokens_added: number
          user_id: string
        }
        Insert: {
          applied_at?: string | null
          id?: string
          pack_name: string
          price: number
          purchased_at?: string
          stripe_payment_id?: string | null
          tokens_added: number
          user_id: string
        }
        Update: {
          applied_at?: string | null
          id?: string
          pack_name?: string
          price?: number
          purchased_at?: string
          stripe_payment_id?: string | null
          tokens_added?: number
          user_id?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string | null
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      user_templates: {
        Row: {
          category: string | null
          created_at: string
          description: string | null
          id: string
          image_url: string
          is_system_template: boolean | null
          prompt: string
          subcategory: string | null
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          category?: string | null
          created_at?: string
          description?: string | null
          id?: string
          image_url: string
          is_system_template?: boolean | null
          prompt: string
          subcategory?: string | null
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          category?: string | null
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string
          is_system_template?: boolean | null
          prompt?: string
          subcategory?: string | null
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_token_usage: {
        Row: {
          created_at: string
          id: string
          period_end: string
          period_start: string
          plan_id: string | null
          tokens_limit: number
          tokens_used: number
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          period_end?: string
          period_start?: string
          plan_id?: string | null
          tokens_limit?: number
          tokens_used?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          period_end?: string
          period_start?: string
          plan_id?: string | null
          tokens_limit?: number
          tokens_used?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_token_usage_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "subscription_plans"
            referencedColumns: ["id"]
          },
        ]
      }
      webhook_logs: {
        Row: {
          endpoint_id: string
          error_message: string | null
          executed_at: string
          execution_time_ms: number | null
          id: string
          request_payload: Json
          response_payload: Json | null
          status_code: number | null
          success: boolean
          user_id: string
        }
        Insert: {
          endpoint_id: string
          error_message?: string | null
          executed_at?: string
          execution_time_ms?: number | null
          id?: string
          request_payload?: Json
          response_payload?: Json | null
          status_code?: number | null
          success?: boolean
          user_id: string
        }
        Update: {
          endpoint_id?: string
          error_message?: string | null
          executed_at?: string
          execution_time_ms?: number | null
          id?: string
          request_payload?: Json
          response_payload?: Json | null
          status_code?: number | null
          success?: boolean
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "webhook_logs_endpoint_id_fkey"
            columns: ["endpoint_id"]
            isOneToOne: false
            referencedRelation: "custom_endpoints"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      check_login_rate_limit: {
        Args: { p_email: string; p_ip_address?: string }
        Returns: Json
      }
      cleanup_expired_oauth_states: { Args: never; Returns: undefined }
      decrypt_integration_credentials: {
        Args: { p_encrypted_credentials: string; p_user_id: string }
        Returns: Json
      }
      encrypt_integration_credentials: {
        Args: { p_credentials: Json; p_user_id: string }
        Returns: string
      }
      generate_user_encryption_key: {
        Args: { p_user_id: string }
        Returns: string
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      record_login_attempt: {
        Args: { p_email: string; p_ip_address?: string; p_success?: boolean }
        Returns: undefined
      }
      reset_monthly_tokens: { Args: never; Returns: undefined }
    }
    Enums: {
      app_role: "superadmin" | "user"
      automation_status: "active" | "paused" | "draft"
      card_type: "trigger" | "message" | "condition" | "ai" | "human" | "action"
      integration_channel:
        | "whatsapp"
        | "instagram"
        | "telegram"
        | "facebook"
        | "linkedin"
        | "tiktok"
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
      app_role: ["superadmin", "user"],
      automation_status: ["active", "paused", "draft"],
      card_type: ["trigger", "message", "condition", "ai", "human", "action"],
      integration_channel: [
        "whatsapp",
        "instagram",
        "telegram",
        "facebook",
        "linkedin",
        "tiktok",
      ],
    },
  },
} as const
