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
      agency_settings: {
        Row: {
          agency_description: string | null
          created_at: string
          established_year: string | null
          hero_subtitle: string | null
          hero_tagline: string | null
          hero_tagline_accent: string | null
          hero_title: string | null
          id: string
          stats: Json | null
          story_content: string | null
          story_image_url: string | null
          story_title: string | null
          team_section_title: string | null
          updated_at: string
          values: Json | null
        }
        Insert: {
          agency_description?: string | null
          created_at?: string
          established_year?: string | null
          hero_subtitle?: string | null
          hero_tagline?: string | null
          hero_tagline_accent?: string | null
          hero_title?: string | null
          id?: string
          stats?: Json | null
          story_content?: string | null
          story_image_url?: string | null
          story_title?: string | null
          team_section_title?: string | null
          updated_at?: string
          values?: Json | null
        }
        Update: {
          agency_description?: string | null
          created_at?: string
          established_year?: string | null
          hero_subtitle?: string | null
          hero_tagline?: string | null
          hero_tagline_accent?: string | null
          hero_title?: string | null
          id?: string
          stats?: Json | null
          story_content?: string | null
          story_image_url?: string | null
          story_title?: string | null
          team_section_title?: string | null
          updated_at?: string
          values?: Json | null
        }
        Relationships: []
      }
      ai_creations: {
        Row: {
          content: string | null
          created_at: string
          creation_type: string
          id: string
          image_url: string | null
          is_favorite: boolean | null
          metadata: Json | null
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          content?: string | null
          created_at?: string
          creation_type: string
          id?: string
          image_url?: string | null
          is_favorite?: boolean | null
          metadata?: Json | null
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          content?: string | null
          created_at?: string
          creation_type?: string
          id?: string
          image_url?: string | null
          is_favorite?: boolean | null
          metadata?: Json | null
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      beta_feedback: {
        Row: {
          created_at: string
          feature_name: string
          feedback_type: string
          id: string
          message: string
          rating: number | null
          user_id: string
        }
        Insert: {
          created_at?: string
          feature_name: string
          feedback_type: string
          id?: string
          message: string
          rating?: number | null
          user_id: string
        }
        Update: {
          created_at?: string
          feature_name?: string
          feedback_type?: string
          id?: string
          message?: string
          rating?: number | null
          user_id?: string
        }
        Relationships: []
      }
      blog_posts: {
        Row: {
          author_name: string | null
          content: string
          created_at: string
          excerpt: string | null
          id: string
          image_url: string | null
          published: boolean | null
          published_at: string | null
          slug: string
          title: string
          updated_at: string
          youtube_url: string | null
        }
        Insert: {
          author_name?: string | null
          content: string
          created_at?: string
          excerpt?: string | null
          id?: string
          image_url?: string | null
          published?: boolean | null
          published_at?: string | null
          slug: string
          title: string
          updated_at?: string
          youtube_url?: string | null
        }
        Update: {
          author_name?: string | null
          content?: string
          created_at?: string
          excerpt?: string | null
          id?: string
          image_url?: string | null
          published?: boolean | null
          published_at?: string | null
          slug?: string
          title?: string
          updated_at?: string
          youtube_url?: string | null
        }
        Relationships: []
      }
      calendar_events: {
        Row: {
          all_day: boolean | null
          color: string | null
          created_at: string
          description: string | null
          end_time: string
          id: string
          start_time: string
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          all_day?: boolean | null
          color?: string | null
          created_at?: string
          description?: string | null
          end_time: string
          id?: string
          start_time: string
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          all_day?: boolean | null
          color?: string | null
          created_at?: string
          description?: string | null
          end_time?: string
          id?: string
          start_time?: string
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      cart_items: {
        Row: {
          created_at: string
          id: string
          product_id: string
          quantity: number
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          product_id: string
          quantity?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          product_id?: string
          quantity?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "cart_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      categories: {
        Row: {
          created_at: string
          description: string | null
          id: string
          name: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          name: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          name?: string
        }
        Relationships: []
      }
      chat_messages: {
        Row: {
          content: string
          created_at: string
          id: string
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          user_id?: string
        }
        Relationships: []
      }
      digital_downloads: {
        Row: {
          created_at: string
          download_count: number
          download_token: string
          expires_at: string
          id: string
          max_downloads: number
          order_id: string
          product_id: string
        }
        Insert: {
          created_at?: string
          download_count?: number
          download_token: string
          expires_at: string
          id?: string
          max_downloads?: number
          order_id: string
          product_id: string
        }
        Update: {
          created_at?: string
          download_count?: number
          download_token?: string
          expires_at?: string
          id?: string
          max_downloads?: number
          order_id?: string
          product_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "digital_downloads_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "digital_downloads_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      direct_messages: {
        Row: {
          content: string
          created_at: string
          id: string
          read: boolean | null
          recipient_id: string
          sender_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          read?: boolean | null
          recipient_id: string
          sender_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          read?: boolean | null
          recipient_id?: string
          sender_id?: string
        }
        Relationships: []
      }
      feature_usage: {
        Row: {
          created_at: string
          feature_type: string
          id: string
          updated_at: string
          usage_count: number
          usage_date: string
          user_id: string
        }
        Insert: {
          created_at?: string
          feature_type: string
          id?: string
          updated_at?: string
          usage_count?: number
          usage_date?: string
          user_id: string
        }
        Update: {
          created_at?: string
          feature_type?: string
          id?: string
          updated_at?: string
          usage_count?: number
          usage_date?: string
          user_id?: string
        }
        Relationships: []
      }
      highlights: {
        Row: {
          category: string
          created_at: string
          display_order: number | null
          id: string
          image_url: string | null
          link_url: string | null
          project_id: string | null
          published: boolean | null
          title: string
          updated_at: string
        }
        Insert: {
          category: string
          created_at?: string
          display_order?: number | null
          id?: string
          image_url?: string | null
          link_url?: string | null
          project_id?: string | null
          published?: boolean | null
          title: string
          updated_at?: string
        }
        Update: {
          category?: string
          created_at?: string
          display_order?: number | null
          id?: string
          image_url?: string | null
          link_url?: string | null
          project_id?: string | null
          published?: boolean | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "highlights_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      homepage_settings: {
        Row: {
          created_at: string
          featured_project_ids: string[] | null
          hero_images: string[] | null
          hero_media_type: string
          hero_video_url: string | null
          id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          featured_project_ids?: string[] | null
          hero_images?: string[] | null
          hero_media_type?: string
          hero_video_url?: string | null
          id?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          featured_project_ids?: string[] | null
          hero_images?: string[] | null
          hero_media_type?: string
          hero_video_url?: string | null
          id?: string
          updated_at?: string
        }
        Relationships: []
      }
      member_connections: {
        Row: {
          addressee_id: string
          created_at: string
          id: string
          requester_id: string
          status: string
          updated_at: string
        }
        Insert: {
          addressee_id: string
          created_at?: string
          id?: string
          requester_id: string
          status?: string
          updated_at?: string
        }
        Update: {
          addressee_id?: string
          created_at?: string
          id?: string
          requester_id?: string
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      newsletter_subscribers: {
        Row: {
          email: string
          id: string
          is_active: boolean
          subscribed_at: string
        }
        Insert: {
          email: string
          id?: string
          is_active?: boolean
          subscribed_at?: string
        }
        Update: {
          email?: string
          id?: string
          is_active?: boolean
          subscribed_at?: string
        }
        Relationships: []
      }
      notifications: {
        Row: {
          created_at: string
          id: string
          link: string | null
          message: string
          read: boolean | null
          title: string
          type: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          link?: string | null
          message: string
          read?: boolean | null
          title: string
          type?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          link?: string | null
          message?: string
          read?: boolean | null
          title?: string
          type?: string | null
          user_id?: string
        }
        Relationships: []
      }
      order_feedback: {
        Row: {
          created_at: string
          id: string
          message: string
          order_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          message: string
          order_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          message?: string
          order_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "order_feedback_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      order_items: {
        Row: {
          created_at: string
          id: string
          order_id: string
          price_at_purchase: number
          product_id: string
          quantity: number
        }
        Insert: {
          created_at?: string
          id?: string
          order_id: string
          price_at_purchase: number
          product_id: string
          quantity?: number
        }
        Update: {
          created_at?: string
          id?: string
          order_id?: string
          price_at_purchase?: number
          product_id?: string
          quantity?: number
        }
        Relationships: [
          {
            foreignKeyName: "order_items_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      order_timeline: {
        Row: {
          created_at: string
          id: string
          message: string | null
          order_id: string
          status: Database["public"]["Enums"]["order_status"]
        }
        Insert: {
          created_at?: string
          id?: string
          message?: string | null
          order_id: string
          status: Database["public"]["Enums"]["order_status"]
        }
        Update: {
          created_at?: string
          id?: string
          message?: string | null
          order_id?: string
          status?: Database["public"]["Enums"]["order_status"]
        }
        Relationships: [
          {
            foreignKeyName: "order_timeline_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      orders: {
        Row: {
          created_at: string
          customer_name: string | null
          customer_phone: string | null
          id: string
          notes: string | null
          order_type: string | null
          payment_method: string | null
          preferred_delivery_date: string | null
          preview_url: string | null
          revolut_link: string | null
          shipping_address: string | null
          special_instructions: string | null
          status: Database["public"]["Enums"]["order_status"]
          total_amount: number
          tracking_number: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          customer_name?: string | null
          customer_phone?: string | null
          id?: string
          notes?: string | null
          order_type?: string | null
          payment_method?: string | null
          preferred_delivery_date?: string | null
          preview_url?: string | null
          revolut_link?: string | null
          shipping_address?: string | null
          special_instructions?: string | null
          status?: Database["public"]["Enums"]["order_status"]
          total_amount: number
          tracking_number?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          customer_name?: string | null
          customer_phone?: string | null
          id?: string
          notes?: string | null
          order_type?: string | null
          payment_method?: string | null
          preferred_delivery_date?: string | null
          preview_url?: string | null
          revolut_link?: string | null
          shipping_address?: string | null
          special_instructions?: string | null
          status?: Database["public"]["Enums"]["order_status"]
          total_amount?: number
          tracking_number?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      payment_settings: {
        Row: {
          bank_beneficiary: string
          bank_bic: string
          bank_iban: string
          bank_name: string
          created_at: string
          default_revolut_link: string | null
          id: string
          premium_payment_link: string | null
          updated_at: string
        }
        Insert: {
          bank_beneficiary?: string
          bank_bic?: string
          bank_iban?: string
          bank_name?: string
          created_at?: string
          default_revolut_link?: string | null
          id?: string
          premium_payment_link?: string | null
          updated_at?: string
        }
        Update: {
          bank_beneficiary?: string
          bank_bic?: string
          bank_iban?: string
          bank_name?: string
          created_at?: string
          default_revolut_link?: string | null
          id?: string
          premium_payment_link?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      products: {
        Row: {
          category: string | null
          category_id: string | null
          created_at: string
          description: string | null
          digital_file_url: string | null
          id: string
          image_url: string | null
          in_stock: boolean | null
          member_only: boolean
          name: string
          price: number
          product_type: Database["public"]["Enums"]["product_type"]
          revolut_link: string | null
          stock_quantity: number | null
        }
        Insert: {
          category?: string | null
          category_id?: string | null
          created_at?: string
          description?: string | null
          digital_file_url?: string | null
          id?: string
          image_url?: string | null
          in_stock?: boolean | null
          member_only?: boolean
          name: string
          price: number
          product_type?: Database["public"]["Enums"]["product_type"]
          revolut_link?: string | null
          stock_quantity?: number | null
        }
        Update: {
          category?: string | null
          category_id?: string | null
          created_at?: string
          description?: string | null
          digital_file_url?: string | null
          id?: string
          image_url?: string | null
          in_stock?: boolean | null
          member_only?: boolean
          name?: string
          price?: number
          product_type?: Database["public"]["Enums"]["product_type"]
          revolut_link?: string | null
          stock_quantity?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "products_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          address: string | null
          avatar_url: string | null
          city: string | null
          country: string | null
          created_at: string
          full_name: string | null
          id: string
          phone: string | null
          postal_code: string | null
          updated_at: string
        }
        Insert: {
          address?: string | null
          avatar_url?: string | null
          city?: string | null
          country?: string | null
          created_at?: string
          full_name?: string | null
          id: string
          phone?: string | null
          postal_code?: string | null
          updated_at?: string
        }
        Update: {
          address?: string | null
          avatar_url?: string | null
          city?: string | null
          country?: string | null
          created_at?: string
          full_name?: string | null
          id?: string
          phone?: string | null
          postal_code?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      projects: {
        Row: {
          category: string
          challenge: string | null
          client: string | null
          created_at: string
          description: string | null
          gallery_display_type: string | null
          gallery_images: string[] | null
          id: string
          image_url: string | null
          playground_align: string | null
          playground_order: number | null
          playground_scale: string | null
          published: boolean | null
          services: string[] | null
          show_in_playground: boolean | null
          slug: string
          solution: string | null
          title: string
          updated_at: string
          year: string | null
        }
        Insert: {
          category: string
          challenge?: string | null
          client?: string | null
          created_at?: string
          description?: string | null
          gallery_display_type?: string | null
          gallery_images?: string[] | null
          id?: string
          image_url?: string | null
          playground_align?: string | null
          playground_order?: number | null
          playground_scale?: string | null
          published?: boolean | null
          services?: string[] | null
          show_in_playground?: boolean | null
          slug: string
          solution?: string | null
          title: string
          updated_at?: string
          year?: string | null
        }
        Update: {
          category?: string
          challenge?: string | null
          client?: string | null
          created_at?: string
          description?: string | null
          gallery_display_type?: string | null
          gallery_images?: string[] | null
          id?: string
          image_url?: string | null
          playground_align?: string | null
          playground_order?: number | null
          playground_scale?: string | null
          published?: boolean | null
          services?: string[] | null
          show_in_playground?: boolean | null
          slug?: string
          solution?: string | null
          title?: string
          updated_at?: string
          year?: string | null
        }
        Relationships: []
      }
      scene_plans: {
        Row: {
          created_at: string
          id: string
          project_name: string
          scene_plan: Json
          updated_at: string
          user_id: string
          video_description: string | null
          video_duration: number | null
          video_style: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          project_name: string
          scene_plan: Json
          updated_at?: string
          user_id: string
          video_description?: string | null
          video_duration?: number | null
          video_style?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          project_name?: string
          scene_plan?: Json
          updated_at?: string
          user_id?: string
          video_description?: string | null
          video_duration?: number | null
          video_style?: string | null
        }
        Relationships: []
      }
      team_members: {
        Row: {
          bio: string | null
          created_at: string
          display_order: number | null
          id: string
          image_url: string | null
          name: string
          published: boolean | null
          role: string
          updated_at: string
        }
        Insert: {
          bio?: string | null
          created_at?: string
          display_order?: number | null
          id?: string
          image_url?: string | null
          name: string
          published?: boolean | null
          role: string
          updated_at?: string
        }
        Update: {
          bio?: string | null
          created_at?: string
          display_order?: number | null
          id?: string
          image_url?: string | null
          name?: string
          published?: boolean | null
          role?: string
          updated_at?: string
        }
        Relationships: []
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
          role: Database["public"]["Enums"]["app_role"]
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
      user_settings: {
        Row: {
          ai_conversation_tone: string | null
          ai_language: string | null
          ai_response_length: string | null
          beta_features_enabled: boolean | null
          business_bio: string | null
          business_brand_name: string | null
          business_industry: string | null
          business_mission: string | null
          business_outreach_tone: string | null
          business_target_audience: string | null
          business_usp: string | null
          created_at: string
          default_start_page: string | null
          display_name: string | null
          github: string | null
          id: string
          instagram: string | null
          interface_language: string | null
          linkedin: string | null
          location: string | null
          notification_settings: Json | null
          personal_company: string | null
          personal_cta_style: string | null
          personal_emoji_usage: string | null
          personal_greeting_style: string | null
          personal_note: string | null
          personal_role: string | null
          personal_text_length: string | null
          personal_tone: string | null
          twitter: string | null
          updated_at: string
          upline_user_id: string | null
          user_id: string
          website: string | null
        }
        Insert: {
          ai_conversation_tone?: string | null
          ai_language?: string | null
          ai_response_length?: string | null
          beta_features_enabled?: boolean | null
          business_bio?: string | null
          business_brand_name?: string | null
          business_industry?: string | null
          business_mission?: string | null
          business_outreach_tone?: string | null
          business_target_audience?: string | null
          business_usp?: string | null
          created_at?: string
          default_start_page?: string | null
          display_name?: string | null
          github?: string | null
          id?: string
          instagram?: string | null
          interface_language?: string | null
          linkedin?: string | null
          location?: string | null
          notification_settings?: Json | null
          personal_company?: string | null
          personal_cta_style?: string | null
          personal_emoji_usage?: string | null
          personal_greeting_style?: string | null
          personal_note?: string | null
          personal_role?: string | null
          personal_text_length?: string | null
          personal_tone?: string | null
          twitter?: string | null
          updated_at?: string
          upline_user_id?: string | null
          user_id: string
          website?: string | null
        }
        Update: {
          ai_conversation_tone?: string | null
          ai_language?: string | null
          ai_response_length?: string | null
          beta_features_enabled?: boolean | null
          business_bio?: string | null
          business_brand_name?: string | null
          business_industry?: string | null
          business_mission?: string | null
          business_outreach_tone?: string | null
          business_target_audience?: string | null
          business_usp?: string | null
          created_at?: string
          default_start_page?: string | null
          display_name?: string | null
          github?: string | null
          id?: string
          instagram?: string | null
          interface_language?: string | null
          linkedin?: string | null
          location?: string | null
          notification_settings?: Json | null
          personal_company?: string | null
          personal_cta_style?: string | null
          personal_emoji_usage?: string | null
          personal_greeting_style?: string | null
          personal_note?: string | null
          personal_role?: string | null
          personal_text_length?: string | null
          personal_tone?: string | null
          twitter?: string | null
          updated_at?: string
          upline_user_id?: string | null
          user_id?: string
          website?: string | null
        }
        Relationships: []
      }
      user_subscriptions: {
        Row: {
          amount: number | null
          created_at: string
          expires_at: string | null
          id: string
          payment_method: string | null
          payment_reference: string | null
          plan_type: string
          started_at: string | null
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          amount?: number | null
          created_at?: string
          expires_at?: string | null
          id?: string
          payment_method?: string | null
          payment_reference?: string | null
          plan_type?: string
          started_at?: string | null
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          amount?: number | null
          created_at?: string
          expires_at?: string | null
          id?: string
          payment_method?: string | null
          payment_reference?: string | null
          plan_type?: string
          started_at?: string | null
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      wishlist: {
        Row: {
          created_at: string
          id: string
          product_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          product_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          product_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "wishlist_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      increment_feature_usage: {
        Args: { p_feature_type: string; p_user_id: string }
        Returns: undefined
      }
    }
    Enums: {
      app_role: "admin" | "moderator" | "user"
      order_status:
        | "pending"
        | "accepted"
        | "in_progress"
        | "preview_sent"
        | "confirmed"
        | "processing"
        | "shipped"
        | "delivered"
        | "cancelled"
      product_type: "physical" | "digital" | "service"
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
      app_role: ["admin", "moderator", "user"],
      order_status: [
        "pending",
        "accepted",
        "in_progress",
        "preview_sent",
        "confirmed",
        "processing",
        "shipped",
        "delivered",
        "cancelled",
      ],
      product_type: ["physical", "digital", "service"],
    },
  },
} as const
