import { useHabit } from "@/context/habitContext";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import React, { useState } from "react";
import { StyleSheet, TouchableOpacity, View } from "react-native";
import { ScrollView } from "react-native-gesture-handler";
import { Surface, Text, useTheme } from "react-native-paper";
import HabitDetailModal from "./../components/habitDetailModal";

export default function HabitManagerScreen() {
  const { habits } = useHabit();
  const { colors } = useTheme();
  const [selectedHabit, setSelectedHabit] = useState<any | null>(null);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {habits?.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={[styles.emptyStateText, { color: colors.onSurfaceVariant }]} variant="bodyLarge">
              No habits found. Start by adding a new habit!
            </Text>
          </View>
        ) : (
          habits?.map((habit) => (
            // <Swipeable
            //   key={habit.id}
            //   overshootLeft={false}
            //   overshootRight={false}
            //   renderLeftActions={renderLeftActions}
            //   renderRightActions={() => renderRightActions(habit.id)}
            //   onSwipeableOpen={(direction) => {
            //     if (direction === "left") {
            //       handleDeleteHabit(habit.id);
            //     } else if (direction === "right") {
            //       handleCompleteHabit(habit.id);
            //     }
            //     SwipeableRefs.current[habit.id]?.close();
            //   }}
            // >
            <TouchableOpacity
              key={habit.id}
              onPress={() => setSelectedHabit(habit)}
              activeOpacity={0.8}
            >
              <Surface
                style={[styles.card, { backgroundColor: colors.surface }]}
                elevation={0}
              >
                <View style={styles.cardContent}>
                  <View style={styles.cardHeader}>
                    <Text
                      style={[styles.cardTitle, { color: colors.onBackground }]}
                      variant="titleMedium"
                    >
                      {String(habit.title ?? "")}
                    </Text>
                    <Text style={[styles.detailsCue, { color: colors.onSurfaceVariant }]}>
                      Tap for details
                    </Text>
                  </View>
                  {/* <Text
                    style={[styles.cardDescription, { color: colors.onSurfaceVariant }]}
                    variant="bodyMedium"
                  >
                    {String(habit.description ?? "")}
                  </Text> */}
                  <View style={styles.cardFooter}>
                    <View style={[styles.streakBadge]}>
                      <MaterialCommunityIcons name="fire" size={18} color={'#ff9800'} />
                      <Text
                        style={[styles.streakText, { color: colors.secondary }]}
                        variant="bodySmall"
                      >
                        {`${Number(habit.streak_count ?? 0)} days streak`}
                      </Text>
                    </View>
                    <View style={[styles.frequencyBadge, { backgroundColor: colors.primaryContainer }]}>
                      <Text style={[styles.frequencyText, { color: colors.primary }]}>
                        {String(habit.frequency ?? "")
                          .charAt(0)
                          .toUpperCase() + String(habit.frequency ?? "").slice(1)}
                      </Text>
                    </View>
                  </View>
                </View>
              </Surface>
            </TouchableOpacity>
            // </Swipeable>
          ))
        )}
      </ScrollView>
      <HabitDetailModal
        visible={!!selectedHabit}
        onClose={() => setSelectedHabit(null)}
        habit={selectedHabit}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  emptyState: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 100,
  },
  emptyStateText: {
    textAlign: "center",
    fontSize: 16,
  },
  card: {
    marginBottom: 16,
    borderRadius: 16,
    borderWidth: 0.5,
    borderColor: "rgba(0, 0, 0, 0.1)",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardContent: {
    padding: 12,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 6,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: "600",
  },
  detailsCue: {
    fontSize: 12,
    fontStyle: "italic",
    opacity: 0.6,
  },
  cardDescription: {
    fontSize: 14,
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
    fontWeight: "600",
    fontSize: 14,
  },
  frequencyBadge: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  frequencyText: {
    fontWeight: "600",
    fontSize: 14,
  },
});