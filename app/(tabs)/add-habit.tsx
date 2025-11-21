import CompletionsPerInterval from '@/components/completionIntervals';
import TimePicker from '@/components/timepicker';
import { useAuth } from "@/context/authContext";
import { useHabit } from '@/context/habitContext';
import { databases, DBID, habitCollectionId } from "@/lib/appwrite";
import { MaterialCommunityIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from "expo-router";
import { nanoid } from "nanoid";
import { useState } from "react";
import { Alert, ScrollView, StyleSheet, View } from "react-native";
import Modal from "react-native-modal";
import { Button, SegmentedButtons, Switch, Text, TextInput, TouchableRipple, useTheme } from "react-native-paper";
import RingtoneSelector from "../../components/RingtoneSelector";

const FREQUENCIES = ["daily", "weekly", "monthly"];
type Frequency = (typeof FREQUENCIES)[number];

export default function AddHabit() {
  const router = useRouter();
  const { user, plan } = useAuth();
  const { saveHabitLocally, scheduleNotifications } = useHabit();
  const { colors } = useTheme();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [error, setError] = useState("");
  const [isFocused, setIsFocused] = useState(false);
  const [frequency, setFrequency] = useState<Frequency>("daily");
  const [isReminderEnabled, setIsReminderEnabled] = useState(false);
  const [reminderMessage, setReminderMessage] = useState("Don't forget your habit!");
  const [reminderTimes, setReminderTimes] = useState<string[]>([]);
  const [weeklyCount, setWeeklyCount] = useState(0);
  const [monthlyCount, setMonthlyCount] = useState(0);
  const [isModalVisible, setModalVisible] = useState(false);
  const [selectedTone, setSelectedTone] = useState("Default");

    const handleSelectTone = (tone: string) => {
    setSelectedTone(tone);
  };

  const handleSubmit = async () => {
    if (isReminderEnabled && reminderTimes.length === 0) {
      Alert.alert("Reminder Required", "Add at least one reminder time or disable reminders.");
      return;
    }

  const generateRandomId = () => 'habit_' + nanoid();
  const randomId = generateRandomId();
    try {
      const perInterval =
        frequency === "weekly"
          ? weeklyCount
          : frequency === "monthly"
          ? monthlyCount
          : null;

      const newHabit = {
        id: randomId,
        user_id: user?.$id || "local_user",
        title,
        description,
        frequency,
        per_interval: perInterval,
        current_interval_completions: 0,
        streak_count: 0,
        last_completed: "",
        created_at: new Date().toISOString(),
        reminders: isReminderEnabled ? reminderTimes : [],
        reminderMessage,
      };

      if (reminderTimes.length > 0) {
        await scheduleNotifications(reminderTimes, title, reminderMessage);
      }

      await AsyncStorage.setItem(
        `habit-reminders-${newHabit.id}`,
        JSON.stringify({ title, reminderMessage, reminderTimes })
      );

      if (!user || plan === "free") {
        await saveHabitLocally(newHabit);
      } else {
        await databases.createDocument(DBID!, habitCollectionId!, newHabit.id, newHabit);
        await saveHabitLocally(newHabit);
      }

      router.back();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save habit.");
    }
  };

  const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    headerContainer: {
      paddingVertical: 40,
      paddingHorizontal: 20,
      borderBottomLeftRadius: 30,
      borderBottomRightRadius: 30,
      marginBottom: 16,
    },
    headerText: {
      fontSize: 26,
      fontWeight: "700",
      color: "#fff",
    },
    headerSubText: {
      fontSize: 14,
      color: "#f0f0f0",
      marginTop: 6,
    },
    content: { padding: 16 },
    card: {
      borderRadius: 16,
      padding: 20,
      marginBottom: 16,
      backgroundColor: colors.surface,
      elevation: 2,
    },
    sectionHeader: {
      fontSize: 16,
      fontWeight: "bold",
      marginBottom: 8,
      color: colors.onSurface,
    },
    input: {
      marginBottom: 14,
      borderRadius: 10,
      backgroundColor: colors.surfaceVariant,
    },
    touch: { 
      padding: 8,
      borderRadius: 8,
     },
    segmentedButtons: { marginBottom: 24 },
    errorText: { color: "red", marginTop: 12, textAlign: "center" },
    optionItem: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: colors.outlineVariant,
    },
    messageLabel: { fontSize: 15, marginTop: 16, marginBottom: 8, color: colors.onSurface },
    submitButton: { borderRadius: 10, marginTop: 20, paddingVertical: 8 },
  });

  return (
    <ScrollView style={styles.container}>
      {/* Gradient Header */}
      <LinearGradient
        colors={[colors.primary, colors.primaryContainer]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.headerContainer}
      >
        <Text style={styles.headerText}>Create New Habit</Text>
        <Text style={styles.headerSubText}>Stay consistent. Build momentum. Grow daily.</Text>
      </LinearGradient>

      <View style={styles.content}>
        {/* Basic Info */}
        <View style={styles.card}>
          <Text style={styles.sectionHeader}>Habit Name</Text>
          <TextInput
            value={title}
            onChangeText={setTitle}
            mode="outlined"
            placeholder="e.g., Morning workout"
            outlineColor="transparent"
            activeOutlineColor={colors.primary}
            style={styles.input}
          />

          <Text style={[styles.sectionHeader, { marginTop: 16 }]}>Description</Text>
          <TextInput
            value={description}
            onChangeText={setDescription}
            mode="outlined"
            placeholder="Describe your habit goal..."
            outlineColor="transparent"
            activeOutlineColor={colors.primary}
            style={styles.input}
          />

          <Text style={[styles.sectionHeader, { marginTop: 20 }]}>Frequency</Text>
          <SegmentedButtons
            value={frequency}
            onValueChange={(val) => setFrequency(val as Frequency)}
            buttons={FREQUENCIES.map((freq) => ({
              value: freq,
              label: freq.charAt(0).toUpperCase() + freq.slice(1),
            }))}
            style={styles.segmentedButtons}
          />

          {frequency === "weekly" && (
            <CompletionsPerInterval count={weeklyCount} unit="Week" onChange={setWeeklyCount} />
          )}
          {frequency === "monthly" && (
            <CompletionsPerInterval count={monthlyCount} unit="Month" onChange={setMonthlyCount} />
          )}
          {error && <Text style={styles.errorText}>{error}</Text>}
        </View>

        {/* Reminder Section */}
        <View style={styles.card}>
          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
            <Text style={styles.sectionHeader}>Reminders</Text>
            <Switch
              value={isReminderEnabled}
              onValueChange={() => setIsReminderEnabled(!isReminderEnabled)}
            />
          </View>

          {isReminderEnabled && (
            <>
              <TimePicker reminderTimes={reminderTimes} setReminderTimes={setReminderTimes} />

              {/*ring tone  */}
              <View style={styles.optionItem}>
  <Text style={styles.sectionHeader}>Ringtone</Text>
  <TouchableRipple onPress={() => setModalVisible(true)}>
    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
      <Text style={{ color: colors.onSurfaceVariant, marginRight: 6 }}>
        {selectedTone}
      </Text>
      <MaterialCommunityIcons
        name="chevron-right"
        size={24}
        color={colors.outline}
      />
    </View>
  </TouchableRipple>

  <Modal
    isVisible={isModalVisible}
    onBackdropPress={() => setModalVisible(false)}
    style={{ justifyContent: "flex-end", margin: 0 }}
  >
    <RingtoneSelector
      onSelect={handleSelectTone}
      selectedTone={selectedTone}
      onClose={() => setModalVisible(false)}
    />
  </Modal>
</View>

              <Text style={styles.messageLabel}>Motivational Message</Text>
              <TextInput
                value={reminderMessage}
                onChangeText={setReminderMessage}
                mode="outlined"
                outlineColor="transparent"
                activeOutlineColor={colors.primary}
                style={styles.input}
              />
            </>
          )}
        </View>

        {/* Submit */}
        <Button
          mode="contained"
          onPress={handleSubmit}
          disabled={!title}
          style={styles.submitButton}
          labelStyle={{ color: colors.onPrimary, fontWeight: 'bold' }}
        >
          Add Habit
        </Button>
      </View>
    </ScrollView>
  );
}
