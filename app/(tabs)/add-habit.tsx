import { databases, DBID, habitCollectionId } from "@/lib/appwrite";
import { useAuth } from "@/lib/authContext";
import { useRouter } from "expo-router";
import { useState } from "react";
import { StyleSheet, View } from "react-native";
import { ID } from "react-native-appwrite";
import { Button, SegmentedButtons, Text, TextInput } from "react-native-paper";

const router = useRouter()

const FREQUENCIES = ["daily", "weekly", "monthly"];
type Frequency = (typeof FREQUENCIES)[number];
export default function Addhabit() {
  const [title, setTitle] = useState<string>("")
  const [description, setDescription] = useState<string>("")
  const [error, setError] = useState<string>("")
  const [frequency, setFrequency] = useState<string>("daily")
  const {user} = useAuth()

  const handleSubmit = async ()=>{
  try {
       if (!user) return;
    if (!DBID || !habitCollectionId) {
  throw new Error("Missing DBID or habitCollectionId in environment variables");
}
    
   await databases.createDocument(DBID!, habitCollectionId!, ID.unique(),
   {
    user_id:user.$id,
    title,
    description,
    frequency,
    streak_count:0,
    last_completed: new Date().toISOString(),
    created_at: new Date().toISOString()  
   }
  );
  router.back()
  setTitle("");
  setDescription("");
  setFrequency("daily");
  setError("");
  } 

  catch (error) {
    if (error instanceof Error) {
      setError(error.message)
      return;
    }
    setError('an error occured')
  }  
  }

  return (
    <View
      style={
        styles.container
      }
    >
  <TextInput value={title} style={styles.input} onChangeText={setTitle} label={'Title'} mode="outlined"/>   
  <TextInput value={description} style={styles.input} onChangeText={setDescription} label={'Description'} mode="outlined"/> 
  <View style={styles.frequencyContainer}>
  <SegmentedButtons
  value={frequency}
  onValueChange={(value)=> setFrequency(value as Frequency)}
  buttons={FREQUENCIES.map((freq)=>({
    value: freq,
    label: freq.charAt(0).toUpperCase() + freq.slice(1),
  }))}/>  
  </View>   
  <Button  mode="contained" onPress={handleSubmit} disabled={!title || !description}>
    Add Habit
  </Button>  
  {error ? <Text style={{ color: "red" }}>{error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container:{
    flex:1,
    padding:16,
    backgroundColor:'#f5f5f5',
    justifyContent:'center',
  },
  input: {
  marginBottom:16,
  },
  frequencyContainer:{
    marginBottom:24,
  },
  
})