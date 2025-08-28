// context/HabitProvider.tsx
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Notifications from "expo-notifications";
import {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useState
} from "react";
import { AppState } from "react-native";
import { Query } from "react-native-appwrite";
import {
  COMPLETIONS_COLLECTION_ID,
  databases,
  DBID,
  habitCollectionId
} from "../lib/appwrite";
import { Habit, HabitCompletion } from "../types/database.type";
import { useAuth } from "./authContext";

// Define the context type
export type HabitContextType = {
  habits: Habit[];
  setHabits: React.Dispatch<React.SetStateAction<Habit[]>>;
  fetchHabits: () => Promise<void>;
  completedHabits: HabitCompletion[];
  setCompletedHabits: React.Dispatch<React.SetStateAction<HabitCompletion[]>>;
  fetchTodayCompleted: () => Promise<void>;
  allCompletions: HabitCompletion[];
  fetchAllUserCompletions: () => Promise<void>;
  saveHabitLocally: (habit: LocalHabit) => Promise<void>;
  scheduleNotifications: (
    times: string[],
    habitTitle: string,
    reminderMessage: string
  ) => Promise<void>;
};

// Local habit type used before syncing
type LocalHabit = {
  id: string;
  title: string;
  description: string;
  frequency: string;
  streak_count: number;
  last_completed: string; 
  created_at: string;
  reminders: string[];
  reminderMessage: string;
};

// Create the context with proper typing
export const HabitContext = createContext<HabitContextType | undefined>(undefined);

export const HabitProvider = ({ children }: { children: ReactNode }) => {
  const { user, plan } = useAuth();

  const [habits, setHabits] = useState<Habit[]>([]);
  const [completedHabits, setCompletedHabits] = useState<HabitCompletion[]>([]);
  const [allCompletions, setAllCompletions] = useState<HabitCompletion[]>([]);

   // Fetch habits from local for free users
  const fetchFreeUserHabits = async () => {
    try {
      const data = await AsyncStorage.getItem("@habits");
      setHabits(data ? JSON.parse(data) : []);
    } catch (err) {
      console.error("Error fetching local habits:", err);
    }
  };

  // Fetch habits from Appwrite for premium users
  const fetchPremiumUserHabits = async () => {
    try {
      const res = await databases.listDocuments(DBID!, habitCollectionId!, [
        Query.equal("user_id", user?.$id ?? "")
      ]);
      setHabits(res.documents as Habit[]);
    } catch (err) {
      console.error("Error fetching remote habits:", err);
      await fetchFreeUserHabits(); // fallback
    }
  };

  const fetchHabits = async () => {
    if (!user && plan === "free") {
      await fetchFreeUserHabits();
    } else {
      await fetchPremiumUserHabits();
    }
  };

  const fetchFreeUserCompletions = async () => {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const data = await AsyncStorage.getItem("@completedHabits");
      const all = data ? JSON.parse(data) : [];

      const todayOnly = all.filter((c: any) => {
        const date = new Date(c.completed_at);
        return date >= today;
      });

      setCompletedHabits(todayOnly.map((c: any) => c.habit_id));
    } catch (err) {
      console.error("Error fetching local completions:", err);
    }
  };

  const fetchPremiumUserCompletions = async () => {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const res = await databases.listDocuments(
        DBID!,
        COMPLETIONS_COLLECTION_ID!,
        [
          Query.equal("user_id", user?.$id ?? ""),
          Query.greaterThanEqual("completed_at", today.toISOString())
        ]
      );

      setCompletedHabits(res.documents.map((c: any) => c.habit_id));
    } catch (err) {
      console.error("Error fetching remote completions:", err);
      await fetchFreeUserCompletions();
    }
  };

  const fetchTodayCompleted = async () => {
    if (!user && plan === "free") {
      await fetchFreeUserCompletions();
    } else {
      await fetchPremiumUserCompletions();
    }
  };

  const fetchAllUserCompletions = async () => {
    if (!user) return;

    try {
      const res = await databases.listDocuments(
        DBID!,
        COMPLETIONS_COLLECTION_ID!,
        [Query.equal("user_id", user?.$id ?? "")]
      );

      setAllCompletions(res.documents as HabitCompletion[]);
    } catch (err) {
      console.error("Error fetching all completions:", err);
    }
  };

  const saveHabitLocally = async (habit: LocalHabit) => {
    const data = await AsyncStorage.getItem("@habits");
    const existing = data ? JSON.parse(data) : [];
    await AsyncStorage.setItem("@habits", JSON.stringify([...existing, habit]));
  };

  const scheduleNotifications = async (
    times: string[],
    habitTitle: string,
    reminderMessage: string
  ) => {
    try {
      const { status } = await Notifications.requestPermissionsAsync();
      if (status !== "granted") {
        console.warn("Notification permission denied");
        return;
      }

      const existing = await Notifications.getAllScheduledNotificationsAsync();

      // Cancel previous
      await Promise.all(
        existing
          .filter(n => n.content.title?.includes(habitTitle))
          .map(n => Notifications.cancelScheduledNotificationAsync(n.identifier))
      );

      await Promise.all(
        times.map(time => {
          const [hour, minute] = time.split(":").map(Number);
          const trigger: Notifications.DailyTriggerInput = {
            type: Notifications.SchedulableTriggerInputTypes.DAILY,
            hour,
            minute
          };

          return Notifications.scheduleNotificationAsync({
            content: {
              title: `⏰ ${habitTitle}`,
              body: reminderMessage,
              sound: true,
              data: { habitTitle }
            },
            trigger
          });
        })
      );
    } catch (err) {
      console.error("Notification scheduling failed:", err);
    }
  };

  // For free users: auto-fetch on foreground
  useEffect(() => {
    if (!user || plan === "free") {
      const appStateListener = AppState.addEventListener("change", state => {
        if (state === "active") {
          fetchHabits();
          fetchTodayCompleted();
        }
      });

      return () => {
        appStateListener.remove();
      };
    }
  }, [user, plan]);

  return (
    <HabitContext.Provider
      value={{
        habits,
        setHabits,
        fetchHabits,
        setCompletedHabits,
        completedHabits,
        fetchTodayCompleted,
        allCompletions,
        fetchAllUserCompletions,
        saveHabitLocally,
        scheduleNotifications
      }}
    >
      {children}
    </HabitContext.Provider>
  );
};

// Update the useHabit hook to handle undefined context
export const useHabit = () => {
  const context = useContext(HabitContext);
  if (context === undefined) {
    throw new Error('useHabit must be used within a HabitProvider');
  }
  return context;
};