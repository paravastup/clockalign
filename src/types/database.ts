/**
 * Database Types for Supabase
 * Auto-generated from schema, manually maintained for now
 * Run `npx supabase gen types typescript` to regenerate from live DB
 */

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          email: string
          name: string | null
          timezone: string
          energy_profile: Json
          avatar_url: string | null
          google_id: string | null
          preferences: Json
          created_at: string
          updated_at: string
          // Subscription fields
          stripe_customer_id: string | null
          subscription_status: 'free' | 'active' | 'past_due' | 'canceled' | 'trialing' | 'incomplete'
          subscription_tier: 'free' | 'pro'
          subscription_id: string | null
          current_period_end: string | null
          trial_ends_at: string | null
        }
        Insert: {
          id?: string
          email: string
          name?: string | null
          timezone: string
          energy_profile?: Json
          avatar_url?: string | null
          google_id?: string | null
          preferences?: Json
          created_at?: string
          updated_at?: string
          // Subscription fields
          stripe_customer_id?: string | null
          subscription_status?: 'free' | 'active' | 'past_due' | 'canceled' | 'trialing' | 'incomplete'
          subscription_tier?: 'free' | 'pro'
          subscription_id?: string | null
          current_period_end?: string | null
          trial_ends_at?: string | null
        }
        Update: {
          id?: string
          email?: string
          name?: string | null
          timezone?: string
          energy_profile?: Json
          avatar_url?: string | null
          google_id?: string | null
          preferences?: Json
          created_at?: string
          updated_at?: string
          // Subscription fields
          stripe_customer_id?: string | null
          subscription_status?: 'free' | 'active' | 'past_due' | 'canceled' | 'trialing' | 'incomplete'
          subscription_tier?: 'free' | 'pro'
          subscription_id?: string | null
          current_period_end?: string | null
          trial_ends_at?: string | null
        }
      }
      teams: {
        Row: {
          id: string
          name: string
          slug: string
          created_by: string | null
          settings: Json
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          slug: string
          created_by?: string | null
          settings?: Json
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          slug?: string
          created_by?: string | null
          settings?: Json
          created_at?: string
        }
      }
      team_members: {
        Row: {
          id: string
          team_id: string
          user_id: string
          role: string
          joined_at: string
        }
        Insert: {
          id?: string
          team_id: string
          user_id: string
          role?: string
          joined_at?: string
        }
        Update: {
          id?: string
          team_id?: string
          user_id?: string
          role?: string
          joined_at?: string
        }
      }
      meetings: {
        Row: {
          id: string
          title: string
          description: string | null
          duration_minutes: number
          meeting_type: string | null
          organizer_id: string | null
          team_id: string | null
          is_recurring: boolean
          recurrence_rule: Json | null
          external_calendar_id: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          title: string
          description?: string | null
          duration_minutes?: number
          meeting_type?: string | null
          organizer_id?: string | null
          team_id?: string | null
          is_recurring?: boolean
          recurrence_rule?: Json | null
          external_calendar_id?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          title?: string
          description?: string | null
          duration_minutes?: number
          meeting_type?: string | null
          organizer_id?: string | null
          team_id?: string | null
          is_recurring?: boolean
          recurrence_rule?: Json | null
          external_calendar_id?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      meeting_participants: {
        Row: {
          id: string
          meeting_id: string
          user_id: string | null
          email: string
          name: string | null
          timezone: string
          status: string
          responded_at: string | null
          created_at: string
        }
        Insert: {
          id?: string
          meeting_id: string
          user_id?: string | null
          email: string
          name?: string | null
          timezone: string
          status?: string
          responded_at?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          meeting_id?: string
          user_id?: string | null
          email?: string
          name?: string | null
          timezone?: string
          status?: string
          responded_at?: string | null
          created_at?: string
        }
      }
      meeting_slots: {
        Row: {
          id: string
          meeting_id: string
          start_time: string
          end_time: string
          status: string
          golden_score: number | null
          total_sacrifice_points: number
          google_event_id: string | null
          created_at: string
        }
        Insert: {
          id?: string
          meeting_id: string
          start_time: string
          end_time: string
          status?: string
          golden_score?: number | null
          total_sacrifice_points?: number
          google_event_id?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          meeting_id?: string
          start_time?: string
          end_time?: string
          status?: string
          golden_score?: number | null
          total_sacrifice_points?: number
          google_event_id?: string | null
          created_at?: string
        }
      }
      sacrifice_scores: {
        Row: {
          id: string
          participant_id: string
          meeting_slot_id: string
          points: number
          local_start_time: string
          category: string
          multiplier: number
          calculated_at: string
        }
        Insert: {
          id?: string
          participant_id: string
          meeting_slot_id: string
          points: number
          local_start_time: string
          category: string
          multiplier?: number
          calculated_at?: string
        }
        Update: {
          id?: string
          participant_id?: string
          meeting_slot_id?: string
          points?: number
          local_start_time?: string
          category?: string
          multiplier?: number
          calculated_at?: string
        }
      }
      golden_windows: {
        Row: {
          id: string
          user_id: string
          hour: number
          sharpness: number
          is_available: boolean
        }
        Insert: {
          id?: string
          user_id: string
          hour: number
          sharpness: number
          is_available?: boolean
        }
        Update: {
          id?: string
          user_id?: string
          hour?: number
          sharpness?: number
          is_available?: boolean
        }
      }
      async_nudges: {
        Row: {
          id: string
          meeting_id: string
          decision: string
          original_sacrifice_points: number | null
          hours_saved: number | null
          async_type: string | null
          created_at: string
        }
        Insert: {
          id?: string
          meeting_id: string
          decision: string
          original_sacrifice_points?: number | null
          hours_saved?: number | null
          async_type?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          meeting_id?: string
          decision?: string
          original_sacrifice_points?: number | null
          hours_saved?: number | null
          async_type?: string | null
          created_at?: string
        }
      }
      team_invites: {
        Row: {
          id: string
          team_id: string
          email: string
          invite_code: string
          invited_by: string | null
          status: string
          created_at: string
          expires_at: string
          accepted_at: string | null
        }
        Insert: {
          id?: string
          team_id: string
          email: string
          invite_code: string
          invited_by?: string | null
          status?: string
          created_at?: string
          expires_at: string
          accepted_at?: string | null
        }
        Update: {
          id?: string
          team_id?: string
          email?: string
          invite_code?: string
          invited_by?: string | null
          status?: string
          created_at?: string
          expires_at?: string
          accepted_at?: string | null
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
}

// Helper types
export type Tables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Row']
export type InsertTables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Insert']
export type UpdateTables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Update']
