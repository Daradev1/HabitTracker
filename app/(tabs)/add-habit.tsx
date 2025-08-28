import TimePicker from '@/components/timepicker';
import { useAuth } from "@/context/authContext";
import { useHabit } from '@/context/habitContext';
import { databases, DBID, habitCollectionId } from "@/lib/appwrite";
import { MaterialCommunityIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from "expo-router";
import { useState } from "react";
import { Alert, ScrollView, StyleSheet, View } from "react-native";
import { Button, SegmentedButtons, Switch, Text, TextInput, TouchableRipple, useTheme } from "react-native-paper";
const router = useRouter()

const FREQUENCIES = ["daily", "weekly", "monthly"];
type Frequency = (typeof FREQUENCIES)[number];

export default function Addhabit() {
  const [title, setTitle] = useState<string>("")
  const [description, setDescription] = useState<string>("")
  const [error, setError] = useState<string>("")
  const [frequency, setFrequency] = useState<string>("daily")
  const [isReminderEnabled, setIsReminderEnabled] = useState(false);
  const [reminderMessage, setReminderMessage] = useState('Dont forget your habit!');
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [reminderTimes, setReminderTimes] = useState<string[]>([]);
  const {user, plan, } = useAuth()
  const {saveHabitLocally, scheduleNotifications} = useHabit()
  const { colors, dark } = useTheme();  


  // submit fn
const handleSubmit = async () => {
  // 1. Validate reminders if enabled
  if (isReminderEnabled && reminderTimes.length === 0) {
    Alert.alert("Reminder Required", "Add at least one reminder time or disable reminders.");
    return;
  }

  const generateRandomId = () => {
  return 'randomId' + Math.random().toString(36).substring(2, 9);
};
const randomId = generateRandomId()
console.log(`freeId: ${randomId}`);

  try {
    const newHabit = {
      id: randomId,
      title,
      description,
      frequency,
      streak_count: 0,
      last_completed: new Date().toISOString(),
      created_at: new Date().toISOString(),
      reminders: isReminderEnabled ? reminderTimes : [],
      reminderMessage: reminderMessage
    };
  if (reminderTimes.length !== 0) await scheduleNotifications(reminderTimes, title, reminderMessage );
  
  // const FreeHabit = {...newHabit, id: freeId}

  await AsyncStorage.setItem(
  `habit-reminders-${newHabit.id}`,
  JSON.stringify({
    title,
    reminderMessage,
    reminderTimes,
  })
);

    // 2. Free Plan: Save locally only
    if (!user || plan === "free") {
      await saveHabitLocally(newHabit);
   } 
    // 3. Premium Plan: Save to cloud + local cache
    else {
      const premiumHabit = {
        ...newHabit,
        user_id: user.$id,
      }
      await databases.createDocument(DBID!, habitCollectionId!, randomId, premiumHabit);
      await saveHabitLocally(premiumHabit); // Optional: Cache locally for offline access
    }

    // Reset form
    router.back();
    setTitle("");
    setDescription("");
    setFrequency("daily");
    setError("");
    setIsReminderEnabled(false);
    setReminderMessage("Dont forget your habit!");
    setReminderTimes([]);    

  } catch (error) {
    setError(error instanceof Error ? error.message : "Failed to save habit.");
  }
};


  // css 
const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: colors.background,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 20,
    marginTop: 16,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
  },
  sectionHeader: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.onSurface,
    marginBottom: 8,
  },
  input: {
    marginBottom: 10,
    backgroundColor: colors.surfaceVariant,
  },
  placeholderText: {
    color: colors.onSurfaceVariant,
    fontSize: 10,
  },
  segmentedButtons: {
    marginBottom: 24,
  },
  submitButton: {
    borderRadius: 8,
    paddingVertical: 6,
    marginTop: 8,
    backgroundColor: colors.primary,
  },
  submitButtonLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.onPrimary,
  },
  errorText: {
    color: colors.error,
    marginTop: 16,
    textAlign: 'center',
  },
  sectionHeaderContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  optionItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.outline,
  },
  optionLabel: {
    fontSize: 16,
    color: colors.onSurface,
  },
  optionValueContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  optionValue: {
    fontSize: 16,
    color: colors.onSurfaceVariant,
    marginRight: 8,
  },
  messageLabel: {
    fontSize: 16,
    color: colors.onSurface,
    marginTop: 16,
    marginBottom: 8,
  },
  messageInput: {
    backgroundColor: colors.surfaceVariant,
    marginBottom: 0,
  },
});

// component

  return (
    <ScrollView style={styles.container}>
      <View style={styles.card}>
        {/* Habit Name */}
        <Text style={styles.sectionHeader}>Habit name</Text>
        <TextInput
          value={title}
          style={styles.input}
          onChangeText={setTitle}
          mode="outlined"
          placeholder="Enter habit name"
            theme={{
    colors: {
      primary: '#6200ee', // Active outline color
      outline: '#ede7f6', // Inactive outline color
      background: 'white' // Background color
    }
  }}
        />

        {/* Description */}
        <Text style={[styles.sectionHeader, { marginTop: 24 }]}>Description (Optional)</Text>
        <TextInput
          value={description}
          style={styles.input}
          onChangeText={setDescription}
          mode="outlined"
          placeholder="Enter description"
            theme={{
    colors: {
      primary: '#6200ee', // Active outline color
      outline: '#ede7f6', // Inactive outline color
      background: 'white' // Background color
    }
  }}
        />

        {/* Frequency */}
        <Text style={[styles.sectionHeader, { marginTop: 20 }]}>Frequency</Text>
       <SegmentedButtons
        value={frequency}
        onValueChange={(value) => setFrequency(value)}
        buttons={FREQUENCIES.map((freq) => ({
          value: freq,
          label: freq.charAt(0).toUpperCase() + freq.slice(1),
          style: {
            backgroundColor: frequency === freq ? '#6200ee' : 'white',
            borderColor: '#6200ee'
          },
          labelStyle: {
            color: frequency === freq ? 'white' : '#6200ee', // Text color changes based on selection
          },
        }))}
        theme={{ colors: { secondaryContainer: '#6200ee' } }}
        style={styles.segmentedButtons}
        />

        {error && <Text style={styles.errorText}>{error}</Text>}
      </View>
    
    {/* notification selection */}
       <View style={styles.card}>
        <View style={styles.sectionHeaderContainer}>
          <Text style={styles.sectionHeader}>Reminders</Text>
          <Switch
            value={isReminderEnabled}
            onValueChange={() => setIsReminderEnabled(!isReminderEnabled)}
            color="#6200ee"
          />
        </View>

        {isReminderEnabled && (
          <>
            <TimePicker 
              reminderTimes={reminderTimes} 
              setReminderTimes={setReminderTimes} 
            />

            {/* Keep the rest of your reminder section */}
            <View style={styles.optionItem}>
              <Text style={styles.optionLabel}>Ringtone</Text>
              <TouchableRipple 
                onPress={() => {}}
                style={styles.optionValueContainer}
              >
                <>
                  <Text style={styles.optionValue}>Universe</Text>
                  <MaterialCommunityIcons name="chevron-right" size={24} color="#888" />
                </>
              </TouchableRipple>
            </View>

            <Text style={styles.messageLabel}>Motivational Message</Text>
            <TextInput
              value={reminderMessage}
              onChangeText={setReminderMessage}
              mode="outlined"
              style={styles.messageInput}
              theme={{
                colors: {
                  primary: '#6200ee',
                  outline: '#ede7f6',
                  background: 'white'
                }
              }}
            />
          </>
        )}
      </View>


         {/* Submit Button */}
        <Button 
          mode="contained" 
          onPress={handleSubmit} 
          disabled={!title}
          style={styles.submitButton}
          labelStyle={styles.submitButtonLabel}
          theme={{ colors: { primary: '#6200ee' } }}
        >
          Add Habit
        </Button>
    </ScrollView>
  );
};

// some css too...

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  card: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    marginTop: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
  },
  sectionHeader: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  input: {
    marginBottom: 10,
  },

  placeholderText: {
    color: '#888',
    fontSize: 10,
  },
  segmentedButtons: {
    marginBottom: 24,
  },
  submitButton: {
    borderRadius: 8,
    paddingVertical: 6,
    marginTop: 8,
  },
  submitButtonLabel: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  errorText: {
    color: 'red',
    marginTop: 16,
    textAlign: 'center',
  },
    sectionHeaderContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  optionItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  optionLabel: {
    fontSize: 16,
    color: '#333',
  },
  optionValueContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  optionValue: {
    fontSize: 16,
    color: '#888',
    marginRight: 8,
  },
  messageLabel: {
    fontSize: 16,
    color: '#333',
    marginTop: 16,
    marginBottom: 8,
  },
  messageInput: {
    backgroundColor: 'white',
    marginBottom: 0,
  },

})