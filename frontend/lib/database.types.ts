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
      properties: {
        Row: any
        Insert: any
        Update: any
      }
      issues: {
        Row: any
        Insert: any
        Update: any
      }
      conversations: {
        Row: any
        Insert: any
        Update: any
      }
      property_info: {
        Row: any
        Insert: any
        Update: any
      }
      cleaning_tasks: {
        Row: any
        Insert: any
        Update: any
      }
      stays: {
        Row: any
        Insert: any
        Update: any
      }
      local_tips: {
        Row: any
        Insert: any
        Update: any
      }
    }
  }
}