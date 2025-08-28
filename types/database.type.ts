import { Models } from "react-native-appwrite";


export interface Habit extends Models.Document {
    user_id: string;
    title: string;
    id: string;
    description?: string;
    frequency: "daily" | "weekly" | "monthly";
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