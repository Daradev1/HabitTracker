// app/(tabs)/index.tsx
import { client, COMPLETIONS_COLLECTION_ID, databases, DBID, habitCollectionId, RealtimeResponse } from "@/lib/appwrite";
import { useAuth } from "@/lib/authContext";
import { Habit } from "@/types/database.type";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useEffect, useRef, useState } from "react";
import { ScrollView, StyleSheet, View } from "react-native";
import { ID, Query } from "react-native-appwrite";
import { Swipeable } from "react-native-gesture-handler";
import { Button, Surface, Text } from "react-native-paper";

export default function HomeScreen() {
 const {signOut, user} = useAuth();

const [habits, setHabits] = useState<Habit[]>();

const SwipeableRefs = useRef<{[key:string]:Swipeable | null}>({});

 const fetchHabits = async () => {
   try {
     const habits = await databases.listDocuments(
       DBID!,
       habitCollectionId!,
       [Query.equal("user_id", user?.$id ?? "")]
     );
      setHabits(habits.documents as Habit[]);   
   } catch (error) {
      console.error("Error fetching habits:", error);
    
   }
 }
useEffect(()=>{
  if (user){
  const channel = `databases.${DBID}.collections.${habitCollectionId}.documents`
  const habitsSubcription = client.subscribe(
    channel,
    (response:RealtimeResponse)=>{
      if (response.events.includes("databases.*.collections.*.documents.*.create")) {
        fetchHabits()
      }
      else if (response.events.includes("databases.*.collections.*.documents.*.update")) {
        fetchHabits()
      }
      else if (response.events.includes("databases.*.collections.*.documents.*.delete")) {
        fetchHabits()
      }
    }
  );
  fetchHabits();
  return()=>{
    habitsSubcription();
  }
  }
},[user]);

const handleDeleteHabit = async (habitId: string) => {
  try {
    await databases.deleteDocument(DBID!, habitCollectionId!, habitId);
    // Close the swipeable after deletion
    SwipeableRefs.current[habitId]?.close();
    // Optionally, you can refetch habits to update the UI
    fetchHabits();
  }catch(error){
    console.error("Error deleting habit:", error);
  }
}

const handleCompleteHabit = async (habitId: string) => {
  if (!user) return;
  try {
    const currentDate = new Date().toISOString();
    await databases.createDocument(
      DBID!,
      COMPLETIONS_COLLECTION_ID!,
      ID.unique(),
      {
        habit_id: habitId,
        user_id: user.$id,
        completed_at: currentDate,
      }
    );
    const habit = habits?.find(h => h.$id === habitId);
    if(!habit) return;
    await databases.updateDocument(
      DBID!,  
      habitCollectionId!,
      habitId,
      {
        last_completed: currentDate,
        streak_count: habit.streak_count + 1,
      })
  } catch (error) {
    console.error("Error completing habit:", error);

  }
}
const renderRightActions =()=>{
  return (
    <View  style={styles.swipeableActionRight}>
      <MaterialCommunityIcons
        name="check-circle-outline"
        size={32}
        color="#fff"
        style={{ marginRight: 16 }}
        />
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

  return (
    <View style={styles.container}>
   <View style={styles.header}>
<Text variant="headlineSmall" style={styles.title}> Today's Habit</Text>
<Button mode="text" onPress={signOut} icon={"logout"}>
  Sign Out
   </Button>
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
      SwipeableRefs.current[habit.$id] = ref;
     
    }}
    key={habit.$id}
    overshootLeft={false}
    overshootRight={false}
    renderLeftActions={renderLeftActions}
   renderRightActions={renderRightActions}
   onSwipeableOpen={(direction)=>{
    if (direction === "left") {
      handleDeleteHabit(habit.$id);
    }else if (direction === "right") {
      handleCompleteHabit(habit.$id);
    }
    SwipeableRefs.current[habit.$id]?.close();
    
   }}
   >
    <Surface  style={styles.card} elevation={0}>
      <View style={styles.cardContent}>
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
})