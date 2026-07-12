export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

type ApplicationRow = {
  application_link: string;
  company: string;
  created_at: string;
  date_applied: string | null;
  deadline: string | null;
  follow_up_date: string | null;
  id: string;
  interest_level: number;
  interview_stage: string;
  location: string;
  notes: string;
  oa_received: boolean;
  recruiter_contact: string;
  referral_status: string;
  resume_version: string;
  role: string;
  status: string;
  updated_at: string;
  user_id: string;
};

type TargetCompanyRow = {
  application_season: string;
  company: string;
  created_at: string;
  id: string;
  notes: string;
  priority_level: string;
  role_type: string;
  updated_at: string;
  user_id: string;
};

type NetworkingContactRow = {
  company: string;
  connected: boolean;
  created_at: string;
  id: string;
  last_contacted_date: string | null;
  linkedin_url: string;
  name: string;
  notes: string;
  referral_received: boolean;
  referral_requested: boolean;
  role: string;
  updated_at: string;
  user_id: string;
};

type WeeklyGoalRow = {
  application_goal: number;
  applications_completed: number;
  created_at: string;
  id: string;
  leetcode_completed: number;
  leetcode_goal: number;
  networking_completed: number;
  networking_goal: number;
  updated_at: string;
  user_id: string;
  week: string;
};

type ProfileRow = {
  avatar_url: string | null;
  created_at: string;
  display_name: string | null;
  email: string;
  id: string;
  legacy_migrated_at: string | null;
  updated_at: string;
};

type TableDefinition<Row, Insert, Update> = {
  Insert: Insert;
  Relationships: [];
  Row: Row;
  Update: Update;
};

export type Database = {
  public: {
    CompositeTypes: Record<never, never>;
    Enums: Record<never, never>;
    Functions: {
      replace_user_data: {
        Args: {
          p_applications: Json;
          p_contacts: Json;
          p_target_companies: Json;
          p_weekly_goals: Json;
        };
        Returns: Json;
      };
    };
    Tables: {
      applications: TableDefinition<
        ApplicationRow,
        Omit<ApplicationRow, "created_at" | "id" | "updated_at" | "user_id"> & {
          created_at?: string;
          id?: string;
          updated_at?: string;
          user_id?: string;
        },
        Partial<Omit<ApplicationRow, "id" | "user_id">>
      >;
      networking_contacts: TableDefinition<
        NetworkingContactRow,
        Omit<NetworkingContactRow, "created_at" | "id" | "updated_at" | "user_id"> & {
          created_at?: string;
          id?: string;
          updated_at?: string;
          user_id?: string;
        },
        Partial<Omit<NetworkingContactRow, "id" | "user_id">>
      >;
      profiles: TableDefinition<
        ProfileRow,
        Omit<ProfileRow, "created_at" | "updated_at"> & {
          created_at?: string;
          updated_at?: string;
        },
        Partial<Omit<ProfileRow, "id">>
      >;
      target_companies: TableDefinition<
        TargetCompanyRow,
        Omit<TargetCompanyRow, "created_at" | "id" | "updated_at" | "user_id"> & {
          created_at?: string;
          id?: string;
          updated_at?: string;
          user_id?: string;
        },
        Partial<Omit<TargetCompanyRow, "id" | "user_id">>
      >;
      weekly_goals: TableDefinition<
        WeeklyGoalRow,
        Omit<WeeklyGoalRow, "created_at" | "id" | "updated_at" | "user_id"> & {
          created_at?: string;
          id?: string;
          updated_at?: string;
          user_id?: string;
        },
        Partial<Omit<WeeklyGoalRow, "id" | "user_id">>
      >;
    };
    Views: Record<never, never>;
  };
};

export type ApplicationDatabaseRow = Database["public"]["Tables"]["applications"]["Row"];
export type ApplicationDatabaseInsert = Database["public"]["Tables"]["applications"]["Insert"];
export type ApplicationDatabaseUpdate = Database["public"]["Tables"]["applications"]["Update"];
export type NetworkingContactDatabaseRow = Database["public"]["Tables"]["networking_contacts"]["Row"];
export type NetworkingContactDatabaseInsert = Database["public"]["Tables"]["networking_contacts"]["Insert"];
export type NetworkingContactDatabaseUpdate = Database["public"]["Tables"]["networking_contacts"]["Update"];
export type ProfileDatabaseRow = Database["public"]["Tables"]["profiles"]["Row"];
export type ProfileDatabaseUpdate = Database["public"]["Tables"]["profiles"]["Update"];
export type TargetCompanyDatabaseRow = Database["public"]["Tables"]["target_companies"]["Row"];
export type TargetCompanyDatabaseInsert = Database["public"]["Tables"]["target_companies"]["Insert"];
export type TargetCompanyDatabaseUpdate = Database["public"]["Tables"]["target_companies"]["Update"];
export type WeeklyGoalDatabaseRow = Database["public"]["Tables"]["weekly_goals"]["Row"];
export type WeeklyGoalDatabaseInsert = Database["public"]["Tables"]["weekly_goals"]["Insert"];
export type WeeklyGoalDatabaseUpdate = Database["public"]["Tables"]["weekly_goals"]["Update"];
