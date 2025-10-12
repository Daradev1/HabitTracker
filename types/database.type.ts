import { Models } from "react-native-appwrite";


export interface Habit extends Models.Document {
  user_id: string;
  id: string;
  title: string;
  description?: string;

  // "daily" still works as is, but now we can handle "weekly" & "monthly" in detail
  frequency: "daily" | "weekly" | "monthly";

  // New fields for interval completion goals
  per_interval?: number | null; // e.g. 3 times a week, 10 times a month
  current_interval_completions?: number; // count of completions so far this week/month

  last_completed?: string; // ISO date string
  streak_count: number;
  created_at: string; // ISO date string
  reminders: string[];
  reminderMessage: string;
}


 export interface HabitCompletion extends Models.Document {
    habit_id: string;     
    user_id: string;
    completed_at: string; // ISO date string
    }   