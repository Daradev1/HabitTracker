import { Habit } from "@/types/database.type";
import AsyncStorage from "@react-native-async-storage/async-storage";
import NetInfo from "@react-native-community/netinfo";
import { router } from "expo-router";
import { createContext, useContext, useEffect, useState } from "react";
import { useColorScheme } from "react-native";
import { ID, Models } from "react-native-appwrite";
import { MD3DarkTheme, MD3LightTheme, PaperProvider } from 'react-native-paper'; // Add this import
import { account } from "../lib/appwrite";

type PlanType = "free" | "premium";
type ThemeMode  = 'light' | 'dark' | 'system';

type habitType = {
  id: string
  title: string,
  description:string,
  frequency:string,
  streak_count: number,
  last_completed: string,
  created_at: string,
  reminders: string[],
  reminderMessage: string
};


type AuthContextType = {
  user: Models.User<Models.Preferences> | null;
  loading: boolean;
  // habits: Habit[];
  // setHabits: React.Dispatch<React.SetStateAction<Habit[]>>;
  // fetchHabits: () => Promise<void>;
  // theme
  themeMode: ThemeMode;
  setThemeMode: (mode: ThemeMode) => void;
  isDark: boolean;
  paperTheme: typeof MD3LightTheme | typeof MD3DarkTheme;
  plan: PlanType | null;
  setPlan: React.Dispatch<React.SetStateAction<PlanType | null>>;
  signUp: (email: string, password: string) => Promise<string | null>;
  signIn: (email: string, password: string) => Promise<string | null>;
  // syncRemindersFromCloud: (userId: string)  => Promise<void>;
  // saveHabitLocally: (habit: habitType) => Promise<void>;
  // scheduleNotifications: (times: string[], habitTitle: string, reminderMessage: string) => Promise<void>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);
// Custom themes
const lightTheme = {
  ...MD3LightTheme,
  colors: {
    ...MD3LightTheme.colors,
    primary: '#6200ee',
    accent: '#03dac4',
  },
};

const darkTheme = {
  ...MD3DarkTheme,
  colors: {
    ...MD3DarkTheme.colors,
    primary: '#bb86fc',
    accent: '#03dac4',
  },
};

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<Models.User<Models.Preferences> | null>(null);
  const [loading, setLoading] = useState(true);
  const [habits, setHabits] = useState<Habit[]>([]); // no undefined
  const [plan, setPlan] = useState<PlanType | null>(null);
 // Theme state
  const [themeMode, setThemeMode] = useState<ThemeMode>('system');
  const systemScheme = useColorScheme();
  const isDark = themeMode === 'dark' || (themeMode === 'system' && systemScheme === 'dark');
  const paperTheme = isDark ? darkTheme : lightTheme;


  // 1. Main effect for checking user/plan
  useEffect(() => {
    const checkUserAndPlan = async () => {
      try {
        const net = await NetInfo.fetch();
        
        if (!net.isConnected) {
          const storedPlan = await AsyncStorage.getItem("userPlan");
          setPlan(storedPlan === "premium" ? "premium" : "free");
          setUser(null);
          return;
        }
        
        const currentUser = await account.get();
        setUser(currentUser);
        setPlan("premium");
      } catch (error) {
        console.log("User not logged in:", error);
        setUser(null);
        setPlan("free");
      } finally {
        setLoading(false);
      }
    };
       const loadTheme = async () => {
      const savedTheme = await AsyncStorage.getItem('@app_theme');
      if (savedTheme === 'light' || savedTheme === 'dark' || savedTheme === 'system') {
        setThemeMode(savedTheme);
      }
    };
    loadTheme();

    checkUserAndPlan();
  }, []);

   // Save theme preference when it changes
  useEffect(() => {
    AsyncStorage.setItem('@app_theme', themeMode);
  }, [themeMode]);
  

 // Handle system theme changes end...
// const saveHabitLocally = async (habit: habitType) => {
//   const existingHabits = await AsyncStorage.getItem('@habits');
//   const habits = existingHabits ? JSON.parse(existingHabits) : [];
//   await AsyncStorage.setItem('@habits', JSON.stringify([...habits, habit]));
// };

// golbal habit fetch
// const fetchFreeUserHabits = async () => {
//   try {
//     const habits = await AsyncStorage.getItem('@habits');
//     setHabits(habits ? JSON.parse(habits) : []);
//   } catch (error) {
//     console.error("Error fetching local habits:", error);
//   }
// };

// const fetchPremiumUserHabits = async () => {
//   try {
//     const response = await databases.listDocuments(
//       DBID!,
//       habitCollectionId!,
//       [Query.equal("user_id", user?.$id ?? "")]
//     );
//     setHabits(response.documents as Habit[]);
//   } catch (error) {
//     console.error("Error fetching remote habits:", error);
//     // Fallback to local storage
//     await fetchFreeUserHabits();
//   }
// };


//  const fetchHabits = async () => {
//     if (!user && plan === "free") {
//       await fetchFreeUserHabits(); 
      
//     }else {
//     await fetchPremiumUserHabits();
//   }
//  }




  // 2. Dedicated sync effect for plan changes
  useEffect(() => {
    const syncPlanToStorage = async () => {
      if (plan === null) return;
      
      try {
        await AsyncStorage.setItem("userPlan", plan);
        console.log("Plan synced to storage:", plan);
      } catch (error) {
        console.error("Failed to sync plan:", error);
      }
    };

    syncPlanToStorage();
    // if (plan === "premium") {
    //  const runSync = async()=>{
    //    await syncRemindersAndUnsyncedHabitsToCloud(user?.$id!);
    //  }
    //  runSync();
    // }
  }, [plan]);






  const signUp = async (email: string, password: string): Promise<string | null> => {
    try {
      await account.create(ID.unique(), email, password);
      return await signIn(email, password);
    } catch (error) {
      return error instanceof Error ? error.message : "An unexpected error occurred.";
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      await account.createEmailPasswordSession(email, password);
      const currentUser = await account.get();
      setUser(currentUser);
      setPlan("premium"); // Storage will be updated by the sync effect
      return null;
    } catch (error) {
      return error instanceof Error ? error.message : "An unexpected error occurred.";
    }
  };

  const signOut = async () => {
    try {
      const net = await NetInfo.fetch();
      if (net.isConnected && user) {
        await account.deleteSession("current");
      }
      router.replace("/auth");
    } catch (error) {
      console.error("Failed to sign out:", error);
    } finally {
      setUser(null);
      setPlan("free"); // Storage will be updated by the sync effect
    }
  };

 // In your AuthContext.tsx - Update the return statement
return (
  <AuthContext.Provider value={{ 
    user, 
    loading, 
    themeMode,
    setThemeMode,
    isDark,
    paperTheme, // Make sure this is included
    plan, 
    setPlan, 
    // saveHabitLocally,
    // fetchHabits,
    // setHabits,
    // habits,
    // scheduleNotifications,
    signUp, 
    signIn, 
    signOut 
  }}>
    <PaperProvider theme={paperTheme}> {/* Add this wrapper */}
      {children}
    </PaperProvider>
  </AuthContext.Provider>
);
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}