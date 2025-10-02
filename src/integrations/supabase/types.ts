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
    PostgrestVersion: "13.0.4"
  }
  public: {
    Tables: {
      audio_recordings: {
        Row: {
          classification: string | null
          confidence: number | null
          created_at: string | null
          duration: number | null
          file_name: string
          file_url: string
          id: string
          user_id: string | null
        }
        Insert: {
          classification?: string | null
          confidence?: number | null
          created_at?: string | null
          duration?: number | null
          file_name: string
          file_url: string
          id?: string
          user_id?: string | null
        }
        Update: {
          classification?: string | null
          confidence?: number | null
          created_at?: string | null
          duration?: number | null
          file_name?: string
          file_url?: string
          id?: string
          user_id?: string | null
        }
        Relationships: []
      }
      campus_alerts: {
        Row: {
          alert_type: string
          created_at: string | null
          expires_at: string | null
          id: string
          is_active: boolean | null
          message: string
          priority: string
          sender_id: string | null
          target_audience: string | null
          title: string
          updated_at: string | null
        }
        Insert: {
          alert_type?: string
          created_at?: string | null
          expires_at?: string | null
          id?: string
          is_active?: boolean | null
          message: string
          priority?: string
          sender_id?: string | null
          target_audience?: string | null
          title: string
          updated_at?: string | null
        }
        Update: {
          alert_type?: string
          created_at?: string | null
          expires_at?: string | null
          id?: string
          is_active?: boolean | null
          message?: string
          priority?: string
          sender_id?: string | null
          target_audience?: string | null
          title?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      check_in_timers: {
        Row: {
          created_at: string | null
          emergency_contacts: string[] | null
          expected_check_in: string
          id: string
          last_check_in: string | null
          location_data: Json | null
          start_time: string | null
          status: string | null
          timer_duration: number
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          emergency_contacts?: string[] | null
          expected_check_in: string
          id?: string
          last_check_in?: string | null
          location_data?: Json | null
          start_time?: string | null
          status?: string | null
          timer_duration: number
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          emergency_contacts?: string[] | null
          expected_check_in?: string
          id?: string
          last_check_in?: string | null
          location_data?: Json | null
          start_time?: string | null
          status?: string | null
          timer_duration?: number
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      emergency_broadcasts: {
        Row: {
          broadcast_type: string
          created_at: string
          expires_at: string | null
          id: string
          is_active: boolean | null
          message: string
          priority: string
          sender_id: string
          target_audience: string
          title: string
          updated_at: string
        }
        Insert: {
          broadcast_type: string
          created_at?: string
          expires_at?: string | null
          id?: string
          is_active?: boolean | null
          message: string
          priority: string
          sender_id: string
          target_audience?: string
          title: string
          updated_at?: string
        }
        Update: {
          broadcast_type?: string
          created_at?: string
          expires_at?: string | null
          id?: string
          is_active?: boolean | null
          message?: string
          priority?: string
          sender_id?: string
          target_audience?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      emergency_contacts: {
        Row: {
          created_at: string | null
          email: string | null
          id: string
          is_primary: boolean | null
          name: string
          phone: string
          relation: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          email?: string | null
          id?: string
          is_primary?: boolean | null
          name: string
          phone: string
          relation: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          email?: string | null
          id?: string
          is_primary?: boolean | null
          name?: string
          phone?: string
          relation?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "emergency_contacts_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      emergency_requests: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          latitude: number | null
          location: Json | null
          longitude: number | null
          priority: number | null
          resolved_at: string | null
          responder_eta: string | null
          response_notes: string | null
          response_status: string | null
          status: Database["public"]["Enums"]["emergency_status"] | null
          title: string
          type: Database["public"]["Enums"]["emergency_type"]
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          latitude?: number | null
          location?: Json | null
          longitude?: number | null
          priority?: number | null
          resolved_at?: string | null
          responder_eta?: string | null
          response_notes?: string | null
          response_status?: string | null
          status?: Database["public"]["Enums"]["emergency_status"] | null
          title: string
          type: Database["public"]["Enums"]["emergency_type"]
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          latitude?: number | null
          location?: Json | null
          longitude?: number | null
          priority?: number | null
          resolved_at?: string | null
          responder_eta?: string | null
          response_notes?: string | null
          response_status?: string | null
          status?: Database["public"]["Enums"]["emergency_status"] | null
          title?: string
          type?: Database["public"]["Enums"]["emergency_type"]
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      emergency_staff: {
        Row: {
          certification_level: string | null
          contact_number: string | null
          created_at: string
          emergency_contact: string | null
          id: string
          is_available: boolean
          specializations: string[] | null
          staff_type: string
          updated_at: string
          user_id: string
          years_experience: number | null
        }
        Insert: {
          certification_level?: string | null
          contact_number?: string | null
          created_at?: string
          emergency_contact?: string | null
          id?: string
          is_available?: boolean
          specializations?: string[] | null
          staff_type: string
          updated_at?: string
          user_id: string
          years_experience?: number | null
        }
        Update: {
          certification_level?: string | null
          contact_number?: string | null
          created_at?: string
          emergency_contact?: string | null
          id?: string
          is_available?: boolean
          specializations?: string[] | null
          staff_type?: string
          updated_at?: string
          user_id?: string
          years_experience?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "emergency_staff_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      emergency_supplies: {
        Row: {
          category: string
          created_at: string
          expiry_date: string | null
          id: string
          item_name: string
          last_checked: string | null
          location: string | null
          notes: string | null
          quantity: number
          updated_at: string
          user_id: string
        }
        Insert: {
          category: string
          created_at?: string
          expiry_date?: string | null
          id?: string
          item_name: string
          last_checked?: string | null
          location?: string | null
          notes?: string | null
          quantity?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          category?: string
          created_at?: string
          expiry_date?: string | null
          id?: string
          item_name?: string
          last_checked?: string | null
          location?: string | null
          notes?: string | null
          quantity?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      geofence_zones: {
        Row: {
          coordinates: Json
          created_at: string
          created_by: string | null
          description: string | null
          id: string
          is_active: boolean | null
          name: string
          radius: number | null
          updated_at: string
          zone_type: string
        }
        Insert: {
          coordinates: Json
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          radius?: number | null
          updated_at?: string
          zone_type: string
        }
        Update: {
          coordinates?: Json
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          radius?: number | null
          updated_at?: string
          zone_type?: string
        }
        Relationships: []
      }
      incident_reports: {
        Row: {
          created_at: string
          description: string
          id: string
          incident_type: string
          latitude: number | null
          location: string | null
          longitude: number | null
          severity: string
          status: string
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          description: string
          id?: string
          incident_type: string
          latitude?: number | null
          location?: string | null
          longitude?: number | null
          severity: string
          status?: string
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          description?: string
          id?: string
          incident_type?: string
          latitude?: number | null
          location?: string | null
          longitude?: number | null
          severity?: string
          status?: string
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      medical_info: {
        Row: {
          allergies: string | null
          blood_type: string | null
          conditions: string | null
          created_at: string | null
          doctor_contact: string | null
          doctor_name: string | null
          id: string
          medical_aid_number: string | null
          medical_aid_provider: string | null
          medications: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          allergies?: string | null
          blood_type?: string | null
          conditions?: string | null
          created_at?: string | null
          doctor_contact?: string | null
          doctor_name?: string | null
          id?: string
          medical_aid_number?: string | null
          medical_aid_provider?: string | null
          medications?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          allergies?: string | null
          blood_type?: string | null
          conditions?: string | null
          created_at?: string | null
          doctor_contact?: string | null
          doctor_name?: string | null
          id?: string
          medical_aid_number?: string | null
          medical_aid_provider?: string | null
          medications?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "medical_info_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          created_at: string | null
          emergency_id: string | null
          id: string
          is_read: boolean | null
          message: string
          title: string
          type: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          emergency_id?: string | null
          id?: string
          is_read?: boolean | null
          message: string
          title: string
          type?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          emergency_id?: string | null
          id?: string
          is_read?: boolean | null
          message?: string
          title?: string
          type?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_emergency_id_fkey"
            columns: ["emergency_id"]
            isOneToOne: false
            referencedRelation: "emergency_requests"
            referencedColumns: ["id"]
          },
        ]
      }
      offline_emergency_requests: {
        Row: {
          created_at: string | null
          emergency_data: Json
          id: string
          sync_status: string | null
          synced_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          emergency_data: Json
          id?: string
          sync_status?: string | null
          synced_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          emergency_data?: Json
          id?: string
          sync_status?: string | null
          synced_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      password_reset_codes: {
        Row: {
          code: string
          created_at: string
          email: string
          expires_at: string
          id: string
          updated_at: string
          used: boolean
        }
        Insert: {
          code: string
          created_at?: string
          email: string
          expires_at: string
          id?: string
          updated_at?: string
          used?: boolean
        }
        Update: {
          code?: string
          created_at?: string
          email?: string
          expires_at?: string
          id?: string
          updated_at?: string
          used?: boolean
        }
        Relationships: []
      }
      profiles: {
        Row: {
          address: string | null
          avatar_url: string | null
          created_at: string | null
          department: string | null
          faculty: string | null
          full_name: string
          id: string
          is_active: boolean | null
          phone_number: string | null
          role: Database["public"]["Enums"]["user_role"]
          student_number: string | null
          updated_at: string | null
          username: string | null
          year_of_study: string | null
        }
        Insert: {
          address?: string | null
          avatar_url?: string | null
          created_at?: string | null
          department?: string | null
          faculty?: string | null
          full_name: string
          id: string
          is_active?: boolean | null
          phone_number?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          student_number?: string | null
          updated_at?: string | null
          username?: string | null
          year_of_study?: string | null
        }
        Update: {
          address?: string | null
          avatar_url?: string | null
          created_at?: string | null
          department?: string | null
          faculty?: string | null
          full_name?: string
          id?: string
          is_active?: boolean | null
          phone_number?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          student_number?: string | null
          updated_at?: string | null
          username?: string | null
          year_of_study?: string | null
        }
        Relationships: []
      }
      safe_zones: {
        Row: {
          capacity: number | null
          contact_info: string | null
          created_at: string | null
          description: string | null
          id: string
          is_active: boolean | null
          latitude: number
          longitude: number
          name: string
          operating_hours: string | null
          updated_at: string | null
          zone_type: string
        }
        Insert: {
          capacity?: number | null
          contact_info?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          latitude: number
          longitude: number
          name: string
          operating_hours?: string | null
          updated_at?: string | null
          zone_type: string
        }
        Update: {
          capacity?: number | null
          contact_info?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          latitude?: number
          longitude?: number
          name?: string
          operating_hours?: string | null
          updated_at?: string | null
          zone_type?: string
        }
        Relationships: []
      }
      staff_responses: {
        Row: {
          arrived_at: string | null
          completed_at: string | null
          created_at: string | null
          emergency_id: string
          estimated_arrival: string | null
          id: string
          message: string | null
          response_type: string | null
          staff_id: string
          status: Database["public"]["Enums"]["response_status"] | null
          updated_at: string | null
        }
        Insert: {
          arrived_at?: string | null
          completed_at?: string | null
          created_at?: string | null
          emergency_id: string
          estimated_arrival?: string | null
          id?: string
          message?: string | null
          response_type?: string | null
          staff_id: string
          status?: Database["public"]["Enums"]["response_status"] | null
          updated_at?: string | null
        }
        Update: {
          arrived_at?: string | null
          completed_at?: string | null
          created_at?: string | null
          emergency_id?: string
          estimated_arrival?: string | null
          id?: string
          message?: string | null
          response_type?: string | null
          staff_id?: string
          status?: Database["public"]["Enums"]["response_status"] | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "staff_responses_emergency_id_fkey"
            columns: ["emergency_id"]
            isOneToOne: false
            referencedRelation: "emergency_requests"
            referencedColumns: ["id"]
          },
        ]
      }
      user_locations: {
        Row: {
          accuracy: number | null
          created_at: string
          id: string
          latitude: number
          longitude: number
          user_id: string
          zone_id: string | null
          zone_status: string | null
        }
        Insert: {
          accuracy?: number | null
          created_at?: string
          id?: string
          latitude: number
          longitude: number
          user_id: string
          zone_id?: string | null
          zone_status?: string | null
        }
        Update: {
          accuracy?: number | null
          created_at?: string
          id?: string
          latitude?: number
          longitude?: number
          user_id?: string
          zone_id?: string | null
          zone_status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "user_locations_zone_id_fkey"
            columns: ["zone_id"]
            isOneToOne: false
            referencedRelation: "geofence_zones"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      can_access_emergency_type: {
        Args: {
          _emergency_type: Database["public"]["Enums"]["emergency_type"]
          _user_id: string
        }
        Returns: boolean
      }
      get_user_role: {
        Args: { _user_id: string }
        Returns: Database["public"]["Enums"]["user_role"]
      }
    }
    Enums: {
      emergency_status:
        | "pending"
        | "acknowledged"
        | "in_progress"
        | "resolved"
        | "cancelled"
      emergency_type: "medical" | "security" | "fire" | "general"
      response_status: "dispatched" | "arrived" | "completed"
      user_role: "student" | "medical_staff" | "security_staff" | "admin"
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
      emergency_status: [
        "pending",
        "acknowledged",
        "in_progress",
        "resolved",
        "cancelled",
      ],
      emergency_type: ["medical", "security", "fire", "general"],
      response_status: ["dispatched", "arrived", "completed"],
      user_role: ["student", "medical_staff", "security_staff", "admin"],
    },
  },
} as const
