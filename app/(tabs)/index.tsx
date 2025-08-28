// app/(tabs)/index.tsx
import { useAuth } from "@/context/authContext";
import { useHabit } from "@/context/habitContext";
import { client, COMPLETIONS_COLLECTION_ID, databases, DBID, habitCollectionId, RealtimeResponse } from "@/lib/appwrite";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useNavigation, useRouter } from "expo-router";
import { useEffect, useRef, useState } from "react";
import { Alert, AppState, ScrollView, StyleSheet, TouchableOpacity, View } from "react-native";
import { Query } from "react-native-appwrite";
import { Swipeable } from "react-native-gesture-handler";
import { ActivityIndicator, Button, Surface, Text, useTheme } from "react-native-paper";


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
  console.log(`habit id: ${habitId}`);
  
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
          habitId,
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
  <MaterialCommunityIcons
    name="check-circle-outline"
    size={32}
    color="#fff"
    style={{ marginRight: 16 }}
  />
)}

    </View>
  )
}

const renderLeftActions =()=>{
  return (
    <View style={styles.swipeableActionLeft}>
      <MaterialCommunityIcons
        name="trash-can-outline"
        size={32}
        color="#fff"
        style={{ marginRight: 16 }}
        />
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


  return (
    <View style={[styles.container, {backgroundColor: theme.colors.background }]}>
   <View style={styles.header}>
<Text variant="headlineSmall" style={styles.title}> Today's Habit</Text>

  <View>
{plan === "premium" ?    
  <TouchableOpacity
      style={[
        styles.iconbg,
        { backgroundColor: isPressed ? '#7c4dff' : '#ede7f6' }
      ]}
      activeOpacity={0.8}
      onPressIn={() => setIsPressed(true)}
      onPressOut={() => setIsPressed(false)}
    >
      <MaterialCommunityIcons 
        name="account" 
        size={30} 
        onPress={handleUser}
        color={isPressed ? 'white' : '#7c4dff'} 
      /> 
    </TouchableOpacity> :
    <View style={{ flexDirection: "row", backgroundColor:"#7c4dff", justifyContent: "center", alignItems: "center" }}>
  <MaterialCommunityIcons 
    name="crown" 
    size={16} 
    color="#FFD700"
    style={{ marginRight: 4 }} 
  />
  <Button
    mode="text"
    onPress={() => router.replace('/login')}
    style={styles.premiumBtn}
    labelStyle={{ color: "#fff" }} // optional for styling
  >
    <Text style={{ color: "#fff" }}>Premium</Text>
  </Button>
</View>
}
  </View>

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
          {habit.title}
        </Text>
        <Text style={styles.cardDescription} variant="bodyMedium">
          {habit.description}
        </Text>
        <View style={styles.cardFooter}>
          <View style={styles.streakBadge}>
            <MaterialCommunityIcons name="fire" size={18} color="#ff9800" />
            
            <Text style={styles.streakText} variant="bodySmall">
              {habit.streak_count} days streak
            </Text>
          </View>
          <View style={styles.frequencyBadge}>
            <Text style={styles.frequencyText}>
              {habit.frequency.charAt(0).toUpperCase() + habit.frequency.slice(1)}
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

// css
const styles = StyleSheet.create({
  view: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#fff",
  },
  container:{
    flex:1,
    padding:16,
    backgroundColor:"#f5f5f5"
  },
  header:{
    flexDirection:"row",
    justifyContent:'space-between',
    alignItems:'center',
    marginBottom:24
  },
  title:{
   fontWeight:'bold',
  },
  premiumBtn:{
   fontSize: 20, // Small text
  color: '#FFD700', // Gold text
  fontWeight: 'bold',
  paddingVertical: 0,
  textTransform: 'uppercase',
  },
  card:{
    marginBottom:18,
    borderRadius:18,
    backgroundColor:'#f7f2fa',
    shadowColor:'#000',
    textShadowOffset: {width: 0, height:2},
    shadowOpacity:0.08,
    shadowRadius:8,
    elevation:4,
  },
  cardContent:{
   padding: 20,

  },
  cardTitle:{
  fontSize:20,
  fontWeight: 'bold',
  marginBottom:4,
  color:'#22223b',
  },
  cardDescription:{
  fontSize:15,
  marginBottom:16,
  color:'#6c6c80',
  },
  cardFooter:{
    flexDirection:'row',
    justifyContent:'space-between',
    alignContent:"center"
  },
  streakBadge:{
    flexDirection:'row',
    alignItems:'center',
    backgroundColor:'#fff3e0',
    borderRadius:12,
    paddingHorizontal:10,
    paddingVertical:4,
  },
  streakText:{
    marginLeft:6,
    color:'#ff9800',
    fontWeight:'bold',
    fontSize:14,
  },
  icon:{
    position:"absolute",
    marginLeft:3,
    marginTop:2

  },
 iconbg:{
    borderRadius: 100,
    height: 40,
    width: 40,
    justifyContent: 'center',
    alignItems: 'center',
 },

   frequencyBadge:{
    marginLeft:6,
    flexDirection:'row',
    backgroundColor:'#ede7f6',
    borderRadius:12,
    paddingHorizontal:12,
    fontWeight:'bold',
    paddingVertical:4,
    fontSize:14,
  },
  frequencyText:{
     color:'#7c4dff',
    fontWeight:'bold',
    fontSize:14,
  },

  emptyState: {
  flex: 1,
  justifyContent: 'center',
  alignItems: 'center',
},
emptyStateText: {
  color: "#666666",
  textAlign: "center",
  fontSize: 16,
  marginTop: 20,
},
swipeableActionLeft:{
  backgroundColor: "#ff1744",
  justifyContent: "center",
  alignItems: "flex-start",
  paddingLeft: 16,
  borderRadius:18,
  marginBottom:18,
  marginTop:2,
  flex: 1,
},
swipeableActionRight:{
  backgroundColor: "#4caf50",
  justifyContent: "center",
  alignItems: "flex-end",
  borderRadius:18,
  marginBottom:18,
  marginTop:2,
  flex: 1,
  paddingRight: 16,
},
cardCompleted:{
  // backgroundColor: "#e8f5e9",
  // shadowColor: "#4caf50",
  // textShadowOffset: { width: 0, height: 2 },
  // shadowOpacity: 0.08,
  // shadowRadius: 8,
  // elevation: 4,
  opacity: 0.6,
  backgroundColor: "#e8f5e9",
}
})