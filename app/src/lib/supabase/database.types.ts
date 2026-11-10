
export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export type Database = {

  "public": {
          Tables: {
            "checkins": {
                  Row: {
                    "created_at": string,"distance_m": number | null,"flagged": boolean,"geo_ok": boolean,"id": string,"lat": number | null,"lng": number | null,"night_date": string,"place_id": string,"qr_kind": string,"signup_id": string | null,"user_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string,"distance_m"?: number | null,"flagged"?: boolean,"geo_ok": boolean,"id"?: string,"lat"?: number | null,"lng"?: number | null,"night_date": string,"place_id": string,"qr_kind": string,"signup_id"?: string | null,"user_id": string
                  }
                  Update: {
                    "created_at"?: string,"distance_m"?: number | null,"flagged"?: boolean,"geo_ok"?: boolean,"id"?: string,"lat"?: number | null,"lng"?: number | null,"night_date"?: string,"place_id"?: string,"qr_kind"?: string,"signup_id"?: string | null,"user_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "checkins_place_id_fkey"
      columns: ["place_id"]
isOneToOne: false
      referencedRelation: "places"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "checkins_signup_id_fkey"
      columns: ["signup_id"]
isOneToOne: false
      referencedRelation: "signups"
      referencedColumns: ["id"]
    }
                  ]
                },"cities": {
                  Row: {
                    "id": string,"name": string,"timezone": string
                  }
                  ComputedFields: never
                  Insert: {
                    "id"?: string,"name": string,"timezone"?: string
                  }
                  Update: {
                    "id"?: string,"name"?: string,"timezone"?: string
                  }
                  Relationships: [

                  ]
                },"friend_requests": {
                  Row: {
                    "created_at": string,"id": string,"recipient_id": string,"requester_id": string,"status": string
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string,"id"?: string,"recipient_id": string,"requester_id": string,"status"?: string
                  }
                  Update: {
                    "created_at"?: string,"id"?: string,"recipient_id"?: string,"requester_id"?: string,"status"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "friend_requests_recipient_id_fkey"
      columns: ["recipient_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "friend_requests_requester_id_fkey"
      columns: ["requester_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                },"offers": {
                  Row: {
                    "created_at": string,"days_of_week": (number)[],"description": string | null,"id": string,"includes_alcohol": boolean,"is_active": boolean,"place_id": string,"title": string,"valid_until_time": string | null
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string,"days_of_week": (number)[],"description"?: string | null,"id"?: string,"includes_alcohol": boolean,"is_active"?: boolean,"place_id": string,"title": string,"valid_until_time"?: string | null
                  }
                  Update: {
                    "created_at"?: string,"days_of_week"?: (number)[],"description"?: string | null,"id"?: string,"includes_alcohol"?: boolean,"is_active"?: boolean,"place_id"?: string,"title"?: string,"valid_until_time"?: string | null
                  }
                  Relationships: [
                    {
      foreignKeyName: "offers_place_id_fkey"
      columns: ["place_id"]
isOneToOne: false
      referencedRelation: "places"
      referencedColumns: ["id"]
    }
                  ]
                },"organizer_members": {
                  Row: {
                    "organizer_id": string,"role": string,"user_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "organizer_id": string,"role": string,"user_id": string
                  }
                  Update: {
                    "organizer_id"?: string,"role"?: string,"user_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "organizer_members_organizer_id_fkey"
      columns: ["organizer_id"]
isOneToOne: false
      referencedRelation: "organizers"
      referencedColumns: ["id"]
    }
                  ]
                },"organizers": {
                  Row: {
                    "created_at": string,"id": string,"kind": string,"name": string
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string,"id"?: string,"kind": string,"name": string
                  }
                  Update: {
                    "created_at"?: string,"id"?: string,"kind"?: string,"name"?: string
                  }
                  Relationships: [

                  ]
                },"pilot_feedback": {
                  Row: {
                    "created_at": string,"id": string,"message": string,"user_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string,"id"?: string,"message": string,"user_id"?: string
                  }
                  Update: {
                    "created_at"?: string,"id"?: string,"message"?: string,"user_id"?: string
                  }
                  Relationships: [

                  ]
                },"place_opening_hours": {
                  Row: {
                    "closes_at": string,"opens_at": string,"place_id": string,"weekday": number
                  }
                  ComputedFields: never
                  Insert: {
                    "closes_at": string,"opens_at": string,"place_id": string,"weekday": number
                  }
                  Update: {
                    "closes_at"?: string,"opens_at"?: string,"place_id"?: string,"weekday"?: number
                  }
                  Relationships: [
                    {
      foreignKeyName: "place_opening_hours_place_id_fkey"
      columns: ["place_id"]
isOneToOne: false
      referencedRelation: "places"
      referencedColumns: ["id"]
    }
                  ]
                },"place_photos": {
                  Row: {
                    "created_at": string,"id": string,"place_id": string,"rights_confirmed": boolean,"storage_path": string,"uploaded_by": string | null
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string,"id"?: string,"place_id": string,"rights_confirmed": boolean,"storage_path": string,"uploaded_by"?: string | null
                  }
                  Update: {
                    "created_at"?: string,"id"?: string,"place_id"?: string,"rights_confirmed"?: boolean,"storage_path"?: string,"uploaded_by"?: string | null
                  }
                  Relationships: [
                    {
      foreignKeyName: "place_photos_place_id_fkey"
      columns: ["place_id"]
isOneToOne: false
      referencedRelation: "places"
      referencedColumns: ["id"]
    }
                  ]
                },"place_programming": {
                  Row: {
                    "music": string,"place_id": string,"vibe": string,"weekday": number
                  }
                  ComputedFields: never
                  Insert: {
                    "music": string,"place_id": string,"vibe": string,"weekday": number
                  }
                  Update: {
                    "music"?: string,"place_id"?: string,"vibe"?: string,"weekday"?: number
                  }
                  Relationships: [
                    {
      foreignKeyName: "place_programming_place_id_fkey"
      columns: ["place_id"]
isOneToOne: false
      referencedRelation: "places"
      referencedColumns: ["id"]
    }
                  ]
                },"place_reviews": {
                  Row: {
                    "checkin_id": string,"comment": string,"created_at": string,"place_id": string,"rating": number,"user_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "checkin_id": string,"comment"?: string,"created_at"?: string,"place_id": string,"rating": number,"user_id"?: string
                  }
                  Update: {
                    "checkin_id"?: string,"comment"?: string,"created_at"?: string,"place_id"?: string,"rating"?: number,"user_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "place_reviews_checkin_id_fkey"
      columns: ["checkin_id"]
isOneToOne: true
      referencedRelation: "checkins"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "place_reviews_place_id_fkey"
      columns: ["place_id"]
isOneToOne: false
      referencedRelation: "places"
      referencedColumns: ["id"]
    }
                  ]
                },"places": {
                  Row: {
                    "address": string,"base_age_band": string | null,"city_id": string,"created_at": string,"demo_owner_id": string | null,"id": string,"is_active": boolean,"is_demo": boolean,"is_founder": boolean,"kind": string,"location": unknown,"name": string,"organizer_id": string,"price_level": string,"slug": string,"zone": string
                  }
                  ComputedFields: never
                  Insert: {
                    "address": string,"base_age_band"?: string | null,"city_id": string,"created_at"?: string,"demo_owner_id"?: string | null,"id"?: string,"is_active"?: boolean,"is_demo"?: boolean,"is_founder"?: boolean,"kind": string,"location": unknown,"name": string,"organizer_id": string,"price_level"?: string,"slug": string,"zone": string
                  }
                  Update: {
                    "address"?: string,"base_age_band"?: string | null,"city_id"?: string,"created_at"?: string,"demo_owner_id"?: string | null,"id"?: string,"is_active"?: boolean,"is_demo"?: boolean,"is_founder"?: boolean,"kind"?: string,"location"?: unknown,"name"?: string,"organizer_id"?: string,"price_level"?: string,"slug"?: string,"zone"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "places_city_id_fkey"
      columns: ["city_id"]
isOneToOne: false
      referencedRelation: "cities"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "places_organizer_id_fkey"
      columns: ["organizer_id"]
isOneToOne: false
      referencedRelation: "organizers"
      referencedColumns: ["id"]
    }
                  ]
                },"profiles": {
                  Row: {
                    "birthdate": string,"created_at": string,"display_name": string,"friend_code": string,"home_city": string | null,"id": string,"locale": string
                  }
                  ComputedFields: never
                  Insert: {
                    "birthdate": string,"created_at"?: string,"display_name": string,"friend_code"?: string,"home_city"?: string | null,"id": string,"locale"?: string
                  }
                  Update: {
                    "birthdate"?: string,"created_at"?: string,"display_name"?: string,"friend_code"?: string,"home_city"?: string | null,"id"?: string,"locale"?: string
                  }
                  Relationships: [

                  ]
                },"redemptions": {
                  Row: {
                    "billable": boolean,"checkin_id": string,"created_at": string,"expires_at": string,"id": string,"is_first_visit": boolean,"offer_id": string,"offer_snapshot": NonNullable<Json>
                  }
                  ComputedFields: never
                  Insert: {
                    "billable": boolean,"checkin_id": string,"created_at": string,"expires_at": string,"id"?: string,"is_first_visit": boolean,"offer_id": string,"offer_snapshot": NonNullable<Json>
                  }
                  Update: {
                    "billable"?: boolean,"checkin_id"?: string,"created_at"?: string,"expires_at"?: string,"id"?: string,"is_first_visit"?: boolean,"offer_id"?: string,"offer_snapshot"?: NonNullable<Json>
                  }
                  Relationships: [
                    {
      foreignKeyName: "redemptions_checkin_id_fkey"
      columns: ["checkin_id"]
isOneToOne: true
      referencedRelation: "checkins"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "redemptions_offer_id_fkey"
      columns: ["offer_id"]
isOneToOne: false
      referencedRelation: "offers"
      referencedColumns: ["id"]
    }
                  ]
                },"signups": {
                  Row: {
                    "cancelled_at": string | null,"created_at": string,"id": string,"is_spontaneous": boolean,"night_date": string,"place_id": string,"user_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "cancelled_at"?: string | null,"created_at"?: string,"id"?: string,"is_spontaneous": boolean,"night_date": string,"place_id": string,"user_id": string
                  }
                  Update: {
                    "cancelled_at"?: string | null,"created_at"?: string,"id"?: string,"is_spontaneous"?: boolean,"night_date"?: string,"place_id"?: string,"user_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "signups_place_id_fkey"
      columns: ["place_id"]
isOneToOne: false
      referencedRelation: "places"
      referencedColumns: ["id"]
    }
                  ]
                },"user_preferences": {
                  Row: {
                    "age_bands": (string)[],"music": (string)[],"price": (string)[],"updated_at": string,"user_id": string,"vibe": (string)[]
                  }
                  ComputedFields: never
                  Insert: {
                    "age_bands"?: (string)[],"music"?: (string)[],"price"?: (string)[],"updated_at"?: string,"user_id"?: string,"vibe"?: (string)[]
                  }
                  Update: {
                    "age_bands"?: (string)[],"music"?: (string)[],"price"?: (string)[],"updated_at"?: string,"user_id"?: string,"vibe"?: (string)[]
                  }
                  Relationships: [

                  ]
                },"venue_applications": {
                  Row: {
                    "applicant_id": string,"created_at": string,"decision_note": string,"details": NonNullable<Json>,"id": string,"place_id": string | null,"reviewed_at": string | null,"reviewed_by": string | null,"status": string
                  }
                  ComputedFields: never
                  Insert: {
                    "applicant_id"?: string,"created_at"?: string,"decision_note"?: string,"details": NonNullable<Json>,"id"?: string,"place_id"?: string | null,"reviewed_at"?: string | null,"reviewed_by"?: string | null,"status"?: string
                  }
                  Update: {
                    "applicant_id"?: string,"created_at"?: string,"decision_note"?: string,"details"?: NonNullable<Json>,"id"?: string,"place_id"?: string | null,"reviewed_at"?: string | null,"reviewed_by"?: string | null,"status"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "venue_applications_place_id_fkey"
      columns: ["place_id"]
isOneToOne: false
      referencedRelation: "places"
      referencedColumns: ["id"]
    }
                  ]
                }
          }
          Views: {
            [_ in never]: never
          }
          Functions: {
            "cancel_signup":
{ Args: { "p_place_id": string }; Returns: Json
                           },
"cancel_venue_application":
{ Args: { "p_id": string }; Returns: Json
                           },
"check_in":
{ Args: { "p_lat"?: number,"p_lng"?: number,"p_place_id": string,"p_screen_code"?: string,"p_static_token"?: string }; Returns: Json
                           },
"create_my_demo_venue":
{ Args: Record<PropertyKey, never>; Returns: Json
                           },
"delete_my_account":
{ Args: Record<PropertyKey, never>; Returns: undefined
                           },
"my_friends":
{ Args: Record<PropertyKey, never>; Returns: Json
                           },
"my_pilot_profile":
{ Args: Record<PropertyKey, never>; Returns: Json
                           },
"my_reviewable_visits":
{ Args: Record<PropertyKey, never>; Returns: Json
                           },
"place_nightly_stats":
{ Args: { "p_from": string,"p_place_id": string,"p_to": string }; Returns: {
              "billable": number,"checkins": number,"night_date": string,"redemptions": number,"signups": number
            }[]
                           },
"place_qr_credentials":
{ Args: { "p_place_id": string }; Returns: {
              "screen_secret": string,"static_token": string
            }[]
                           },
"place_rating_summary":
{ Args: { "p_place": string }; Returns: Json
                           },
"recommendation_settings":
{ Args: Record<PropertyKey, never>; Returns: Json
                           },
"redeem":
{ Args: { "p_checkin_id": string,"p_offer_id": string }; Returns: Json
                           },
"request_friend":
{ Args: { "p_code": string }; Returns: Json
                           },
"respond_friend":
{ Args: { "p_accept": boolean,"p_request": string }; Returns: Json
                           },
"review_venue_application":
{ Args: { "p_approve": boolean,"p_id": string,"p_note"?: string }; Returns: Json
                           },
"review_visit":
{ Args: { "p_checkin": string,"p_comment"?: string,"p_rating": number }; Returns: Json
                           },
"send_pilot_feedback":
{ Args: { "p_message": string }; Returns: Json
                           },
"sign_up":
{ Args: { "p_place_id": string }; Returns: Json
                           },
"submit_venue_application":
{ Args: { "p_details": Json }; Returns: Json
                           },
"tonight_places":
{ Args: Record<PropertyKey, never>; Returns: {
              "age_band": string,"age_source": string,"closes_at": string,"cover_path": string,"id": string,"kind": string,"lat": number,"lng": number,"music": string,"name": string,"opens_at": string,"price_level": string,"signups_any": boolean,"signups_visible": number,"vibe": string,"zone": string
            }[]
                           },
"update_my_city":
{ Args: { "p_city": string }; Returns: Json
                           },
"venue_management_context":
{ Args: Record<PropertyKey, never>; Returns: Json
                           }
          }
          Enums: {
            [_ in never]: never
          }
          CompositeTypes: {
            [_ in never]: never
          }
        }
}

type DatabaseWithoutInternals = Omit<Database, '__InternalSupabase'>

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
    : never = never
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
  ? (DefaultSchema["Tables"] & DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
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
    : never = never
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
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
    : never = never
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
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
    : never = never
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
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
    : never = never
> = PublicCompositeTypeNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
  ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
  : never

export const Constants = {
  "public": {
          Enums: {

          }
        }
} as const
