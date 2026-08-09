export type Json = string | number | boolean | null | { [k: string]: Json | undefined } | Json[];

export type UserRole = 'admin' | 'member';
export type ItemStatus = 'open' | 'done' | 'dropped';
export type Weekday = 'mon' | 'tue' | 'wed' | 'thu' | 'fri' | 'sat' | 'sun';

export interface User {
  id: string;
  whatsapp_jid: string;
  name: string;
  role: string;
  is_admin: boolean;
  created_at: string;
}

export interface Message {
  id: string;
  wa_message_id: string | null;
  group_jid: string;
  sender_jid: string;
  sender_name: string | null;
  text: string | null;
  replied_to_id: string | null;
  mentioned_bot: boolean;
  is_from_bot: boolean;
  embedding: number[] | null;
  created_at: string;
}

export interface Idea {
  id: string;
  text: string;
  created_by_jid: string | null;
  created_by_name: string | null;
  status: ItemStatus;
  created_at: string;
  updated_at: string;
}

export interface Task {
  id: string;
  text: string;
  due_date: string | null;
  assigned_to_jid: string | null;
  created_by_jid: string | null;
  status: ItemStatus;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface ReminderSkip {
  id: string;
  skip_date: string;
  reason: string | null;
  created_by_jid: string | null;
  created_at: string;
}

export interface SettingRow {
  key: string;
  value: Json;
  updated_at: string;
  updated_by: string | null;
}

export interface SettingsMap {
  system_prompt: string;
  morning_time: string;
  morning_days: Weekday[];
  timezone: string;
  bot_name: string;
  trigger_words: string[];
  llm_model: string;
  llm_temperature: number;
  llm_max_tokens: number;
  tools_enabled: Record<string, boolean>;
}

type TableDef<Row, RequiredInsert extends keyof Row> = {
  Row: Row;
  Insert: Partial<Row> & Pick<Row, RequiredInsert>;
  Update: Partial<Row>;
  Relationships: [];
};

export interface Database {
  public: {
    Tables: {
      users: TableDef<User, 'whatsapp_jid' | 'name'>;
      messages: TableDef<Message, 'group_jid' | 'sender_jid'>;
      ideas: TableDef<Idea, 'text'>;
      tasks: TableDef<Task, 'text'>;
      reminders_skip: TableDef<ReminderSkip, 'skip_date'>;
      settings: {
        Row: SettingRow;
        Insert: Pick<SettingRow, 'key' | 'value'> & Partial<SettingRow>;
        Update: Partial<SettingRow>;
        Relationships: [];
      };
    };
    Views: { [_ in never]: never };
    Functions: {
      match_messages: {
        Args: {
          query_embedding: number[];
          match_threshold?: number;
          match_count?: number;
          filter_group_jid?: string | null;
        };
        Returns: Array<{
          id: string;
          text: string;
          sender_name: string;
          created_at: string;
          similarity: number;
        }>;
      };
    };
    Enums: { [_ in never]: never };
    CompositeTypes: { [_ in never]: never };
  };
}
