// app/(tabs)/index.tsx
import { useAuth } from "@/context/authContext";
import { useHabit } from "@/context/habitContext";
import { client, COMPLETIONS_COLLECTION_ID, databases, DBID, habitCollectionId, RealtimeResponse } from "@/lib/appwrite";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useNavigation, useRouter } from "expo-router";
import { useEffect, useRef, useState } from "react";
import { Alert, AppState, ScrollView, StyleSheet, TouchableOpacity, View } from "react-native";
import { ID, Query } from "react-native-appwrite";
import { Swipeable } from "react-native-gesture-handler";
import { ActivityIndicator, Surface, Text, useTheme } from "react-native-paper";


export default function HomeScreen() {
 const {plan,  user, } = useAuth();
 const {habits, setHabits, fetchHabits} = useHabit()
 const navigation = useNavigation()
 const theme = useTheme();
// const [habits, setHabits] = useState<Habit[]>();
const [completedHabits, setCompletedHabits] = useState<string[]>([]);
const [isPressed, setIsPressed] = useState<boolean>(false);
const SwipeableRefs = useRef<{[key:string]:Swipeable | null}>({});

const [isCompleted, setIsCompleted] = useState<boolean | null>(null);

const [completedMap, setCompletedMap] = useState<{ [key: string]: boolean }>({});

useEffect(() => {
  if (habits?.length && completedHabits.length) {
    const fetchCompletionStatuses = async () => {
      const results: { [key: string]: boolean } = {};
      for (const habit of habits) {
        const result = await isHabitCompleted(habit.id);
        results[habit.id] = result;
      }
      setCompletedMap(results);
    };

    fetchCompletionStatuses();
  }
}, [habits, completedHabits]); // <-- now waits for both



 const fetchFreeUserCompletions = async () => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const existingCompletions = await AsyncStorage.getItem('@completedHabits');
    const allCompletions = existingCompletions ? JSON.parse(existingCompletions) : [];
    
    const todaysCompletions = allCompletions.filter((c: any) => {
      const completionDate = new Date(c.completed_at);
      return completionDate >= today;
    });
    
    setCompletedHabits(todaysCompletions.map((c: any) => c.habit_id));
  } catch (error) {
    console.error("Error fetching local completions:", error);
  }
};

const fetchPremiumUserCompletions = async () => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const completions = await databases.listDocuments(
      DBID!,
      COMPLETIONS_COLLECTION_ID!,
      [
        Query.equal("user_id", user?.$id ?? ""),
        Query.greaterThanEqual("completed_at", today.toISOString())
      ]
    );
    
    setCompletedHabits(completions.documents.map((c: any) => c.habit_id));
  } catch (error) {
    console.error("Error fetching remote completions:", error);
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

useEffect(() => {
  const fetchData = async () => {
    await fetchHabits();
    await fetchTodayCompleted();
  };

  // Initial fetch
  fetchData();

  // For premium users: realtime subscriptions
  let habitsSubscription: (() => void) | null = null;
  let completionsSubscription: (() => void) | null = null;

  if (user && plan !== "free") {
    const habitChannel = `databases.${DBID}.collections.${habitCollectionId}.documents`;
    habitsSubscription = client.subscribe(habitChannel, (response: RealtimeResponse) => {
      if (response.events.some(e => e.includes('documents.*.create') || 
                                 e.includes('documents.*.update') || 
                                 e.includes('documents.*.delete'))) {
        fetchHabits();
      }
    });

    const completionsChannel = `databases.${DBID}.collections.${COMPLETIONS_COLLECTION_ID}.documents`;
    completionsSubscription = client.subscribe(completionsChannel, (response: RealtimeResponse) => {
      if (response.events.includes("databases.*.collections.*.documents.*.create")) {
        fetchTodayCompleted();
      }
    });
  }

  return () => {
    habitsSubscription?.();
    completionsSubscription?.();
  };
}, [user, plan]);

// For free users: add focus listener to handle navigation updates
useEffect(() => {
  if (!user || plan === "free") {
    const unsubscribe = navigation.addListener('focus', () => {
      fetchHabits();
      fetchTodayCompleted();
    });

    // Also add AppState listener for background/foreground changes
    const appStateListener = AppState.addEventListener('change', (state) => {
      if (state === 'active') {
        fetchHabits();
        fetchTodayCompleted();
      }
    });

    return () => {
      unsubscribe();
      appStateListener.remove();
    };
  }
}, [navigation, user, plan]);
 



const handleDeleteHabit = async (habitId: string) => {
  
  try {
    // Close swipeable immediately
    SwipeableRefs.current[habitId]?.close();

    // For premium users
    if (user && plan !== "free") {
      try {        
        await databases.deleteDocument(DBID!, habitCollectionId!, habitId);
      } catch (remoteError) {
        console.error("Remote delete failed:", remoteError);
      }
    }

    // Update local storage for all users
    const existingHabits = await AsyncStorage.getItem('@habits');

    if (existingHabits) {
      const habits = JSON.parse(existingHabits);
      // Filter out the habit to delete
      
      const updatedHabits = habits.filter((h: any) => {
        // Ensure consistent ID comparison
        return String(h.id) === String(habitId) ? false : true;
      });
      await AsyncStorage.setItem('@habits', JSON.stringify(updatedHabits));
      // Optimistically update UI state
      setHabits(updatedHabits);
    }

    // Clean up related completions
    const existingCompletions = await AsyncStorage.getItem('@completedHabits');
    if (existingCompletions) {
      const completions = JSON.parse(existingCompletions);
      const updatedCompletions = completions.filter((c: any) => {
        return String(c.habit_id) !== String(habitId);
      });
      await AsyncStorage.setItem('@completedHabits', JSON.stringify(updatedCompletions));
      setCompletedHabits(prev => prev.filter(id => String(id) !== String(habitId)));
    }

  } catch (error) {
    console.error("Error deleting habit:", error);
    Alert.alert("Error", "Failed to delete habit");
  }
};



const handleCompleteHabit = async (habitId: string) => {
  if (!habitId || completedHabits?.includes(habitId)) return;
  
  const currentDate = new Date().toISOString();
  const completionData = {
    habit_id: habitId,
    completed_at: currentDate,
    ...(user && { user_id: user.$id })
  };

  try {
    // Optimistic UI update
    setCompletedHabits(prev => [...prev, habitId]);
    
    // Find the habit for streak update
    const habitToUpdate = habits?.find(h => h.id === habitId);    
    const newStreakCount = (habitToUpdate?.streak_count || 0) + 1;

    // For premium users
    if (user && plan !== "free") {
      try {
        await databases.createDocument(
        DBID!,
        COMPLETIONS_COLLECTION_ID!,
        ID.unique(),   // instead of habitId
        completionData
        );


        if (habitToUpdate) {
          await databases.updateDocument(
            DBID!,
            habitCollectionId!,
            habitId,
            {
              last_completed: currentDate,
              streak_count: newStreakCount,
            }
          );
        }
      } catch (remoteError) {
        console.error("Remote completion failed:", remoteError);
        // Continue with local completion
      }
    }

    // Update local storage
    await updateLocalStorageAfterCompletion(habitId, completionData, currentDate, newStreakCount);

    // Refresh data (will use appropriate source based on user/plan)
    fetchTodayCompleted();
    fetchHabits();

  } catch (error) {
    console.error("Error completing habit:", error);
    // Revert optimistic update
    setCompletedHabits(prev => prev.filter(id => id !== habitId));
    Alert.alert("Error", "Failed to complete habit");
  }
};

const updateLocalStorageAfterCompletion = async (
  habitId: string,
  completionData: any,
  currentDate: string,
  newStreakCount: number
) => {
  try {
    // 1. Store completion
    const existingCompletions = await AsyncStorage.getItem('@completedHabits');
    const completions = existingCompletions ? JSON.parse(existingCompletions) : [];
    await AsyncStorage.setItem(
      '@completedHabits',
      JSON.stringify([...completions, completionData])
    );

    // 2. Update streak in local habits
    const existingHabits = await AsyncStorage.getItem('@habits');
    if (existingHabits) {
      const habits = JSON.parse(existingHabits);
      const updatedHabits = habits.map((h: any) => {
        if (h.id === habitId) {
          return {
            ...h,
            last_completed: currentDate,
            streak_count: newStreakCount
          };
        }
        return h;
      });
      await AsyncStorage.setItem('@habits', JSON.stringify(updatedHabits));
    }
  } catch (storageError) {
    console.error("Local storage update failed:", storageError);
    throw storageError;
  }
};

const isHabitCompleted = async (habitId: string) => {
  if (!habitId) return false;

  // // First check local state for immediate response
  if (completedHabits.includes(habitId)) return true;

  // For free users or when offline, check local storage
  if (plan === "free" || !user) {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const existingCompletions = await AsyncStorage.getItem('@completedHabits');
      if (existingCompletions) {
        const completions = JSON.parse(existingCompletions);
        return completions.some((c: any) => {
          const completionDate = new Date(c.completed_at);
          return c.habit_id === habitId && completionDate >= today;
        });
      }
    } catch (error) {
      console.error("Error checking local completions:", error);
    }
  }

  return false;
};


const renderRightActions =(habitId: string)=>{
  return (
    <View  style={styles.swipeableActionRight}>
   { completedMap[habitId] === undefined ? (
  <ActivityIndicator size="small" color="#fff" />
) : completedMap[habitId] ? (
  <Text style={{color:"#fff", fontSize:16, fontWeight:"bold"}}>Completed!</Text>
) : (
  <Text>
  <MaterialCommunityIcons
    name="check-circle-outline"
    size={32}
    color="#fff"
    style={{ marginRight: 16 }}
  />
  </Text>
)}

    </View>
  )
}

const renderLeftActions =()=>{
  return (
    <View style={styles.swipeableActionLeft}>
      <Text>
      <MaterialCommunityIcons
        name="trash-can-outline"
        size={32}
        color="#fff"
        style={{ marginRight: 16 }}
        />
        </Text>
    </View>
  )
}
 const router = useRouter();

 const handleUser = ()=>{
    if (plan === "premium" && user) {
      router.replace("/account")
    }
    return
 }

 // css

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: "#F8F9FC",
  },

  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 24,
  },

  title: {
    fontWeight: "700",
    fontSize: 24,
    color: "#1E1E2F",
  },

  // Premium Button Container
  premiumContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#7C4DFF",
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },

  premiumBtnText: {
    fontSize: 14,
    color: "#fff",
    fontWeight: "600",
    marginLeft: 4,
    textTransform: "uppercase",
  },

  // Habit Cards
  card: {
    marginBottom: 16,
    borderRadius: 16,
    backgroundColor: "#FFFFFF",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
  },

  cardContent: {
    padding: 18,
  },

  cardTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#1E1E2F",
    marginBottom: 6,
  },

  cardDescription: {
    fontSize: 15,
    color: "#6C6C80",
    marginBottom: 12,
  },

  cardFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  streakBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFF5E5",
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },

  streakText: {
    marginLeft: 6,
    color: "#FF9800",
    fontWeight: "600",
    fontSize: 14,
  },

  frequencyBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#EDE7F6",
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },

  frequencyText: {
    color: "#7C4DFF",
    fontWeight: "600",
    fontSize: 14,
  },

  emptyState: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 100,
  },

  emptyStateText: {
    color: "#6C6C80",
    textAlign: "center",
    fontSize: 16,
    marginTop: 16,
  },

  swipeableActionLeft: {
    backgroundColor: "#FF1744",
    justifyContent: "center",
    alignItems: "flex-start",
    paddingLeft: 16,
    borderRadius: 18,
    marginBottom: 18,
    marginTop: 2,
    flex: 1,
  },

  swipeableActionRight: {
    backgroundColor: "#4CAF50",
    justifyContent: "center",
    alignItems: "flex-end",
    borderRadius: 18,
    marginBottom: 18,
    marginTop: 2,
    flex: 1,
    paddingRight: 16,
  },

  cardCompleted: {
    opacity: 0.6,
    backgroundColor: "#E8F5E9",
  },
});




  return (
    <View style={[styles.container, {backgroundColor: theme.colors.background }]}>
   <View style={styles.header}>
  <Text style={styles.title}>Today's Habits</Text>

  {plan === "premium" ? (
    <TouchableOpacity
      style={[ { backgroundColor: isPressed ? "#7C4DFF" : "#EDE7F6" }]}
      activeOpacity={0.8}
      onPressIn={() => setIsPressed(true)}
      onPressOut={() => setIsPressed(false)}
      onPress={handleUser}
    >
      <MaterialCommunityIcons
        name="account"
        size={28}
        color={isPressed ? "white" : "#7C4DFF"}
      />
    </TouchableOpacity>
  ) : (
    <View style={styles.premiumContainer}>
      <MaterialCommunityIcons name="crown" size={16} color="#FFD700" />
      <Text style={styles.premiumBtnText}>Go Premium</Text>
    </View>
  )}
</View>


 <ScrollView showsVerticalScrollIndicator={false} >
 {habits?.length === 0 ? (
  <View style={styles.emptyState}>
    <Text style={styles.emptyStateText} variant="bodyLarge">
      No habits found. Start by adding a new habit!
    </Text>
  </View>
) : (
  habits?.map((habit) => (
    <Swipeable ref={(ref)=>{
      SwipeableRefs.current[habit.id] = ref;
     
    }}
    key={habit.id}
    overshootLeft={false}
    overshootRight={false}
    renderLeftActions={renderLeftActions}
   renderRightActions={()=>renderRightActions(habit.id)}
   onSwipeableOpen={(direction)=>{
    if (direction === "left") {
      handleDeleteHabit(habit.id);
    }else if (direction === "right") {
      handleCompleteHabit(habit.id);
    }
    SwipeableRefs.current[habit.
      id]?.close();
    
   }}
   >
<Surface
  style={[
    styles.card,
    completedMap[habit.id] === true && styles.cardCompleted
  ]}  
  elevation={0}
>      <View style={styles.cardContent}>

        <Text style={styles.cardTitle} variant="titleMedium">
        {String(habit.title ?? "")}
      </Text>
        <Text style={styles.cardDescription} variant="bodyMedium">
        {String(habit.description ?? "")}
      </Text>

        <View style={styles.cardFooter}>
          <View style={styles.streakBadge}>
            <MaterialCommunityIcons name="fire" size={18} color="#ff9800" />
            
         <Text style={styles.streakText} variant="bodySmall">
          {`${Number(habit.streak_count ?? 0)} days streak`}
        </Text>
          </View>
          <View style={styles.frequencyBadge}>
           <Text style={styles.frequencyText}>
          {String(habit.frequency ?? "").charAt(0).toUpperCase() + String(habit.frequency ?? "").slice(1)}
        </Text>
          </View>
        </View>
      </View>
    </Surface>
    </Swipeable>
  ))
)}
</ScrollView>  
    </View>
    
)

}

