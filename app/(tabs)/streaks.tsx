import { useAuth } from "@/context/authContext";
import { useHabit } from "@/context/habitContext";
import {
  client,
  COMPLETIONS_COLLECTION_ID,
  DBID,
  habitCollectionId,
  RealtimeResponse
} from "@/lib/appwrite";
import { useEffect } from "react";
import { ScrollView, StyleSheet, View } from "react-native";
import { Card, Text, useTheme } from "react-native-paper";

export default function Streaks() {
  const {
    habits,
    fetchHabits,
    allCompletions,
    fetchAllUserCompletions
  } = useHabit();

  const { user } = useAuth();
  const { colors, dark } = useTheme();

  useEffect(() => {
    if (user) {
      const habitChannel = `databases.${DBID}.collections.${habitCollectionId}.documents`;
      const habitsSubscription = client.subscribe(
        habitChannel,
        (response: RealtimeResponse) => {
          if (
            response.events.some((e) =>
              e.includes("databases.*.collections.*.documents.*")
            )
          ) {
            fetchHabits();
          }
        }
      );

      const completionsChannel = `databases.${DBID}.collections.${COMPLETIONS_COLLECTION_ID}.documents`;
      const completionsSubscription = client.subscribe(
        completionsChannel,
        (response: RealtimeResponse) => {
          if (
            response.events.includes("databases.*.collections.*.documents.*.create")
          ) {
            fetchAllUserCompletions();
          }
        }
      );

      fetchHabits();
      fetchAllUserCompletions();

      return () => {
        habitsSubscription();
        completionsSubscription();
      };
    }
  }, [user]);

  const getStreakData = (habitId: string) => {
    const completions = allCompletions
      .filter((c) => c.habit_id === habitId)
      .sort(
        (a, b) =>
          new Date(a.completed_at).getTime() -
          new Date(b.completed_at).getTime()
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
      if (lastDate) {
        const diff =
          (date.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24);
        if (diff <= 1.5) {
          currentStreak += 1;
        } else {
          currentStreak = 1;
        }
      } else {
        currentStreak = 1;
      }

      if (currentStreak > bestStreak) bestStreak = currentStreak;
      streak = currentStreak;
      lastDate = date;
    });

    return { streak, bestStreak, total };
  };

  // ... rest of your existing render logic remains untouched


  const habitStreaks = habits.map((habit) => {
    const { streak, bestStreak, total } = getStreakData(habit.id);
    return { habit, streak, bestStreak, total };
  });

  const rankedHabits = habitStreaks.sort((a, b) => b.bestStreak - a.bestStreak);


  const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    padding: 16,
  },
  emptyState: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  emptyStateText: {
    textAlign: "center",
    color: colors.onSurfaceVariant,
  },
  title: {
    fontWeight: "bold",
    marginBottom: 16,
    color: colors.onSurface,
  },
  card: {
    marginBottom: 18,
    borderRadius: 18,
    backgroundColor: colors.surface,
    elevation: 3,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    borderWidth: 1,
    borderColor: colors.outline,
  },
  firstCard: {
    marginTop: 0,
    borderWidth: 2,
    borderColor: colors.primary,
  },
  habitTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 2,
    color: colors.onSurface,
  },
  habitDescription: {
    marginBottom: 8,
    color: colors.onSurfaceVariant,
  },
  statsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 8,
    marginBottom: 12,
  },
  statBadge: {
    backgroundColor: colors.surfaceVariant,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 6,
    alignItems: "center",
    minWidth: 60,
  },
  statBadgeGold: {
    backgroundColor: dark ? '#2d2d00' : '#fffde7',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 6,
    alignItems: "center",
    minWidth: 60,
  },
  statBadgeGreen: {
    backgroundColor: dark ? '#1b3a1b' : '#e8f5e9',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 6,
    alignItems: "center",
    minWidth: 60,
  },
  statBadgeText: {
    fontSize: 15,
    fontWeight: "bold",
    color: colors.onSurface,
  },
  statLabel: {
    fontSize: 11,
    color: colors.onSurfaceVariant,
    marginTop: 2,
    fontWeight: "500",
  },
  rankingContainer: {
    marginBottom: 24,
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 12,
    elevation: 2,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
  },
  rankingTitle: {
    fontWeight: "bold",
    fontSize: 18,
    color: colors.primary,
    marginBottom: 12,
    letterSpacing: 0.5,
  },
  rankingRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: colors.outline,
    paddingBottom: 8,
    paddingHorizontal: 8,
  },
  rankingBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
  },
  badge1: { backgroundColor: "#ffd700" }, // Gold - kept original
  badge2: { backgroundColor: "#c0c0c0" }, // Silver - kept original
  badge3: { backgroundColor: "#cd7f32" }, // Bronze - kept original
  rankingBadgeText: {
    fontWeight: "bold",
    fontSize: 15,
    color: "#fff", // Kept white for contrast
  },
  rankingHabit: {
    flex: 1,
    fontSize: 15,
    fontWeight: "600",
    color: colors.onSurface,
    marginLeft: 8,
  },
  rankingStreak: {
    fontSize: 14,
    color: colors.primary,
    fontWeight: "bold",
  },
});

  const badgeStyles = [styles.badge1, styles.badge2, styles.badge3];

  return (
    <View style={styles.container }>
      <Text variant="headlineSmall" style={styles.title}>
        Habit Streaks
      </Text>

      {rankedHabits.length > 0 && (
        <View style={styles.rankingContainer}>
          <Text style={styles.rankingTitle}>🥇 Top Streaks</Text>
          {rankedHabits.slice(0, 3).map((item, key) => (
            <View style={styles.rankingRow} key={key}>
              <View style={[styles.rankingBadge, badgeStyles[key]]}>
                <Text style={styles.rankingBadgeText}>{key + 1}</Text>
              </View>
              <Text style={styles.rankingHabit}>{item.habit.title}</Text>
              <Text style={styles.rankingStreak}>🏆 {item.bestStreak}</Text>
            </View>
          ))}
        </View>
      )}

      {habits.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyStateText} variant="bodyLarge">
            No habits found. Start by adding a new habit!
          </Text>
        </View>
      ) : (
        <ScrollView showsVerticalScrollIndicator={false}>
          {rankedHabits.map(({ habit, streak, bestStreak, total }, key) => (
            <Card key={key} style={[styles.card, key === 0 && styles.firstCard]}>
              <Card.Content>
                <Text variant="titleMedium" style={styles.habitTitle}>
                  {habit.title}
                </Text>
                <Text style={styles.habitDescription}>{habit.description}</Text>
                <View style={styles.statsRow}>
                  <View style={styles.statBadge}>
                    <Text style={styles.statBadgeText}>🔥 {streak}</Text>
                    <Text style={styles.statLabel}>Current</Text>
                  </View>
                  <View style={styles.statBadgeGold}>
                    <Text style={styles.statBadgeText}>🏆 {bestStreak}</Text>
                    <Text style={styles.statLabel}>Best</Text>
                  </View>
                  <View style={styles.statBadgeGreen}>
                    <Text style={styles.statBadgeText}>✅ {total}</Text>
                    <Text style={styles.statLabel}>Total</Text>
                  </View>
                </View>
              </Card.Content>
            </Card>
          ))}
        </ScrollView>
      )}
    </View>
  );
}


