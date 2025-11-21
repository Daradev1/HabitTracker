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
import { Alert, AppState } from "react-native";
import { Query } from "react-native-appwrite";
import {
  COMPLETIONS_COLLECTION_ID,
  databases,
  DBID,
  habitCollectionId
} from "../lib/appwrite";
import { Habit, HabitCompletion } from "../types/database.type";
import { useAuth } from "./authContext";

export type HabitContextType = {
  habits: Habit[];
  setHabits: React.Dispatch<React.SetStateAction<Habit[]>>;
  fetchHabits: () => Promise<void>;
  handleDeleteHabit: (habitId: string)=> Promise<void>
  completedHabits: HabitCompletion[];
  setCompletedHabits: React.Dispatch<React.SetStateAction<HabitCompletion[]>>;
  fetchTodayCompleted: () => Promise<void>;
  getStreakData: (habit: Habit) => { streak: number; bestStreak: number; total: number; };
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
  per_interval?: number | null;  // add this since we introduced interval counts
  streak_count: number;
  last_completed: string | null; // <-- fix here
  created_at: string;
  reminders: string[];
  reminderMessage: string;
  user_id?: string; // optional for premium users
};


export const HabitContext = createContext<HabitContextType | undefined>(undefined);

export const HabitProvider = ({ children }: { children: ReactNode }) => {
  const { user, plan } = useAuth();

  const [habits, setHabits] = useState<Habit[]>([]);
  const [completedHabits, setCompletedHabits] = useState<HabitCompletion[]>([]);
  const [allCompletions, setAllCompletions] = useState<HabitCompletion[]>([]);

// delete habit 
const handleDeleteHabit = async (habitId: string) => {
  try {
    if (user && plan !== "free") {
      try {
        // Delete the habit document
        try {
          await databases.deleteDocument(DBID!, habitCollectionId!, habitId);
          console.log("✅ Habit document deleted successfully.");
        } catch (habitError) {
          console.error("❌ Failed to delete habit document:", habitError);
        }

        // Find completion(s) linked to the habit
        const existingCompletions = await databases.listDocuments(
          DBID!,
          COMPLETIONS_COLLECTION_ID!,
          [Query.equal("habit_id", habitId)]
        );

        if (existingCompletions.total > 0) {
          for (const doc of existingCompletions.documents) {
            try {
              await databases.deleteDocument(
                DBID!,
                COMPLETIONS_COLLECTION_ID!,
                doc.$id
              );
              console.log(`✅ Deleted completion: ${doc.$id}`);
            } catch (completionError) {
              console.error(
                `❌ Failed to delete completion (${doc.$id}):`,
                completionError
              );
            }
          }
        } else {
          console.log("ℹ️ No completions found for this habit.");
        }
      } catch (outerError) {
        console.error("Unexpected error during habit deletion:", outerError);
      }
    }

    // --- Local storage cleanup ---
    const existingHabits = await AsyncStorage.getItem("@habits");
    if (existingHabits) {
      const habits = JSON.parse(existingHabits);
      const updatedHabits = habits.filter(
        (h: any) => String(h.id) !== String(habitId)
      );
      await AsyncStorage.setItem("@habits", JSON.stringify(updatedHabits));
      setHabits(updatedHabits);
    }

    const existingCompletionsLS = await AsyncStorage.getItem("@completedHabits");
    if (existingCompletionsLS) {
      const completions = JSON.parse(existingCompletionsLS);
      const updatedCompletions = completions.filter(
        (c: any) => String(c.habit_id) !== String(habitId)
      );
      await AsyncStorage.setItem("@completedHabits", JSON.stringify(updatedCompletions));
      setCompletedHabits((prev) =>
        prev.filter((id) => String(id) !== String(habitId))
      );
    }

  } catch (error) {
    console.error("Error deleting habit:", error);
    Alert.alert("Error", "Failed to delete habit");
  }
};


   // Fetch habits from local for free users
  const fetchFreeUserHabits = async () => {
    try {
      const data = await AsyncStorage.getItem("@habits");
      setHabits(data ? JSON.parse(data) : []);
    } catch (err) {
      console.error("Error fetching local habits:", err);
    }
  };

    const getStreakData = (habit: Habit) => {
      const completions = allCompletions
        .filter((c) => c.habit_id === habit.id)
        .sort(
          (a, b) =>
            new Date(a.completed_at).getTime() - new Date(b.completed_at).getTime()
        );
  
      if (completions.length === 0) {
        return { streak: 0, bestStreak: 0, total: 0 };
      }
  
      let streak = 0;
      let bestStreak = 0;
      let total = completions.length;
      let lastDate: Date | null = null;
      let currentStreak = 0;
  
      completions.forEach((c) => {
        const date = new Date(c.completed_at);
  
        if (!lastDate) {
          currentStreak = 1;
        } else {
          const diffDays =
            (date.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24);
  
          let intervalLimit = 2;
          if (habit.frequency === "weekly") intervalLimit = 8;
          if (habit.frequency === "monthly") intervalLimit = 32;
  
          if (diffDays <= intervalLimit) {
            currentStreak += 1;
          } else {
            currentStreak = 1;
          }
        }
  
        if (currentStreak > bestStreak) bestStreak = currentStreak;
        streak = currentStreak;
        lastDate = date;
      });
  
      return { streak, bestStreak, total };
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
        getStreakData,
        habits,
        handleDeleteHabit,
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