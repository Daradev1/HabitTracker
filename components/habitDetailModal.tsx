import { useHabit } from "@/context/habitContext";
import { HabitCompletion } from "@/types/database.type";
import React, { useEffect, useRef, useState } from "react";
import {
  Animated,
  Dimensions,
  Modal,
  PanResponder,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from "react-native";
import { useTheme } from "react-native-paper";
import ContributionGrid from "./trackerGrid";

interface HabitDetailModalProps {
  visible: boolean;
  onClose: () => void;
  habit: any;
}

const SCREEN_HEIGHT = Dimensions.get("window").height;

export default function HabitDetailModal({
  visible,
  onClose,
  habit,
}: HabitDetailModalProps) {
  const { colors } = useTheme();
  const { allCompletions } = useHabit(); // assume deleteHabit exists in context
  const translateY = useRef(new Animated.Value(SCREEN_HEIGHT)).current;
  const [vacationMode, setVacationMode] = useState(false);

  useEffect(() => {
    if (visible) {
      Animated.timing(translateY, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start();
    } else {
      Animated.timing(translateY, {
        toValue: SCREEN_HEIGHT,
        duration: 250,
        useNativeDriver: true,
      }).start(() => setVacationMode(false));
    }
  }, [visible]);

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, g) => g.dy > 5,
      onPanResponderMove: (_, g) => {
        if (g.dy > 0) translateY.setValue(g.dy);
      },
      onPanResponderRelease: (_, g) => {
        if (g.dy > 100) {
          Animated.timing(translateY, {
            toValue: SCREEN_HEIGHT,
            duration: 250,
            useNativeDriver: true,
          }).start(() => onClose());
        } else {
          Animated.spring(translateY, {
            toValue: 0,
            bounciness: 5,
            useNativeDriver: true,
          }).start();
        }
      },
    })
  ).current;

  if (!habit) return null;

  const generateContributionData = (completions: HabitCompletion[]) => {
    const dateCountMap: Record<string, number> = {};
    completions.forEach((c) => {
      if (!c.completed_at) return;
      const date = new Date(c.completed_at).toISOString().split("T")[0];
      dateCountMap[date] = (dateCountMap[date] || 0) + 1;
    });
    return dateCountMap;
  };

  const data = generateContributionData(allCompletions);

  // const handleDelete = () => {
  //   deleteHabit?.(habit.id);
  //   onClose();
  // };

  return (
    <Modal visible={visible} transparent animationType="none" statusBarTranslucent>
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.overlay} />
      </TouchableWithoutFeedback>

      <Animated.View
        style={[
          styles.modalContainer,
          {
            backgroundColor: colors.surface,
            borderColor: colors.outlineVariant ?? colors.outline,
            transform: [{ translateY }],
          },
        ]}
        {...panResponder.panHandlers}
      >
        {/* Drag handle */}
        <View style={styles.handleContainer}>
          <View style={[styles.handle, { backgroundColor: colors.outline }]} />
        </View>

        {/* Content */}
        <View style={styles.contentContainer}>
          <Text style={[styles.habitName, { color: colors.primary }]}>
            {habit.name}
          </Text>
          <Text style={[styles.frequencyText, { color: colors.onSurfaceVariant }]}>
            {habit.frequency} times/week
          </Text>

          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.onSurfaceVariant }]}>
              Progress Tracker
            </Text>
            <ContributionGrid data={data} />
          </View>

          {/* Vacation Mode Toggle */}
          <View style={styles.rowBetween}>
            <Text style={[styles.sectionTitle, { color: colors.onSurfaceVariant }]}>
              Vacation Mode
            </Text>
            <Switch
              value={vacationMode}
              onValueChange={setVacationMode}
              thumbColor={vacationMode ? colors.primary : "#ccc"}
              trackColor={{ true: colors.primaryContainer, false: "#e0e0e0" }}
            />
          </View>

          {/* Delete Habit Button */}
          <TouchableOpacity
            activeOpacity={0.8}
            style={[styles.deleteButton, { backgroundColor: colors.error }]}
            onPress={() => {/* handleDelete() */}}
          >
            <Text style={styles.deleteText}>Delete Habit</Text>
          </TouchableOpacity>
        </View>
      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  modalContainer: {
    position: "absolute",
    bottom: 0,
    width: "100%",
    height: SCREEN_HEIGHT * 0.55, // smaller height
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    borderWidth: 0.6,
    paddingTop: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 10,
  },
  handleContainer: {
    alignItems: "center",
    marginBottom: 10,
  },
  handle: {
    width: 50,
    height: 5,
    borderRadius: 3,
    opacity: 0.6,
  },
  contentContainer: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 8,
  },
  habitName: {
    fontSize: 22,
    fontWeight: "700",
    marginBottom: 6,
  },
  frequencyText: {
    fontSize: 16,
    marginBottom: 20,
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 8,
  },
  rowBetween: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 24,
  },
  deleteButton: {
    alignSelf: "center",
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 10,
  },
  deleteText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 16,
  },
});
