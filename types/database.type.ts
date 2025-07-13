import { Models } from "react-native-appwrite";


export interface Habit extends Models.Document {
    user_id: string;
    title: string;
    description?: string;
    frequency: "daily" | "weekly" | "monthly";
    last_completed?: string; // ISO date string
    streak_count: number;
    created_at: string; // ISO date string
    }