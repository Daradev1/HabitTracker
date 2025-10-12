import { useAuth } from "@/context/authContext";
import { useHabit } from "@/context/habitContext";
import {
  client,
  COMPLETIONS_COLLECTION_ID,
  DBID,
  habitCollectionId,
  RealtimeResponse,
} from "@/lib/appwrite";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { MotiView } from "moti"; // ✨ smooth animation library (install if not added)
import { useEffect } from "react";
import { ScrollView, StyleSheet, View } from "react-native";
import { Card, Text, useTheme } from "react-native-paper";

export default function Streaks() {
  const {
    habits,
    fetchHabits,
    allCompletions,
    fetchAllUserCompletions,
    getStreakData,
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
            response.events.includes(
              "databases.*.collections.*.documents.*.create"
            )
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



  const habitStreaks = habits.map((habit) => {
    const { streak, bestStreak, total } = getStreakData(habit);
    return { habit, streak, bestStreak, total };
  });

  const rankedHabits = habitStreaks.sort((a, b) => b.bestStreak - a.bestStreak);

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    gradientHeader: {
      height: 160,
      borderBottomLeftRadius: 28,
      borderBottomRightRadius: 28,
      justifyContent: "flex-end",
      paddingHorizontal: 20,
      paddingBottom: 24,
      shadowColor: "#000",
      shadowOpacity: 0.2,
      shadowRadius: 10,
    },
    title: {
      fontSize: 28,
      fontWeight: "800",
      color: "#fff",
      letterSpacing: 0.8,
    },
    scrollContainer: {
      flex: 1,
      paddingHorizontal: 16,
      marginTop: -12,
    },
    rankingContainer: {
      backgroundColor: colors.surface,
      borderRadius: 18,
      padding: 14,
      marginBottom: 24,
      elevation: 3,
      borderWidth: 0.5,
      borderColor: colors.outlineVariant,
    },
    rankingTitle: {
      fontWeight: "700",
      fontSize: 18,
      color: colors.primary,
      marginBottom: 12,
    },
    rankingRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingVertical: 8,
      borderBottomWidth: 1,
      borderBottomColor: colors.outlineVariant,
    },
    rankingBadge: {
      width: 30,
      height: 30,
      borderRadius: 15,
      alignItems: "center",
      justifyContent: "center",
    },
    badge1: { backgroundColor: "#FFD700" },
    badge2: { backgroundColor: "#C0C0C0" },
    badge3: { backgroundColor: "#CD7F32" },
    rankingBadgeText: { color: "#fff", fontWeight: "700" },
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
      fontWeight: "700",
    },
    card: {
      marginBottom: 18,
      borderRadius: 18,
      backgroundColor: dark
        ? "rgba(255,255,255,0.05)"
        : "rgba(255,255,255,0.8)",
      borderWidth: 1,
      borderColor: colors.outlineVariant,
      backdropFilter: "blur(10px)",
    },
    cardContent: { padding: 18 },
    habitTitle: {
      fontSize: 18,
      fontWeight: "700",
      color: colors.onSurface,
    },
    habitDescription: {
      fontSize: 14,
      color: colors.onSurfaceVariant,
      marginBottom: 8,
    },
    statsRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      marginTop: 10,
    },
    statBadge: {
      backgroundColor: colors.surfaceVariant,
      borderRadius: 12,
      paddingHorizontal: 12,
      paddingVertical: 8,
      alignItems: "center",
      minWidth: 70,
    },
    statBadgeGold: {
      backgroundColor: dark ? "#2d2d00" : "#FFFDE7",
      borderRadius: 12,
      paddingHorizontal: 12,
      paddingVertical: 8,
      alignItems: "center",
      minWidth: 70,
    },
    statBadgeGreen: {
      backgroundColor: dark ? "#1b3a1b" : "#E8F5E9",
      borderRadius: 12,
      paddingHorizontal: 12,
      paddingVertical: 8,
      alignItems: "center",
      minWidth: 70,
    },
    statBadgeText: {
      fontSize: 15,
      fontWeight: "700",
      color: colors.onSurface,
    },
    statLabel: {
      fontSize: 12,
      color: colors.onSurfaceVariant,
      marginTop: 2,
      fontWeight: "500",
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
      fontSize: 16,
    },
  });

  const badgeStyles = [styles.badge1, styles.badge2, styles.badge3];

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={["#7C4DFF", "#673AB7"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradientHeader}
      >
        <Text style={styles.title}>Habit Streaks</Text>
      </LinearGradient>

      <ScrollView showsVerticalScrollIndicator={false} style={styles.scrollContainer}>
        {rankedHabits.length > 0 && (
          <MotiView
            from={{ opacity: 0, translateY: 10 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ type: "timing", duration: 600 }}
            style={styles.rankingContainer}
          >
            <Text style={styles.rankingTitle}>🏆 Top Streaks</Text>
            {rankedHabits.slice(0, 3).map((item, key) => (
              <MotiView
                key={key}
                from={{ opacity: 0, translateY: 10 }}
                animate={{ opacity: 1, translateY: 0 }}
                transition={{ delay: key * 100 }}
                style={styles.rankingRow}
              >
                <View style={[styles.rankingBadge, badgeStyles[key]]}>
                  <Text style={styles.rankingBadgeText}>{key + 1}</Text>
                </View>
                <Text style={styles.rankingHabit}>{item.habit.title}</Text>
                <Text style={styles.rankingStreak}><MaterialCommunityIcons name="fire" size={24} color="#ff9800" /> {item.bestStreak}</Text>
              </MotiView>
            ))}
          </MotiView>
        )}

        {habits.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateText}>
              No habits found. Start by adding a new habit!
            </Text>
          </View>
        ) : (
          rankedHabits.map(({ habit, streak, bestStreak, total }, key) => (
            <MotiView
              key={key}
              from={{ opacity: 0, translateY: 10 }}
              animate={{ opacity: 1, translateY: 0 }}
              transition={{ delay: key * 120 }}
            >
              <Card style={styles.card}>
                <Card.Content style={styles.cardContent}>
                  <Text style={styles.habitTitle}>{habit.title}</Text>
                  {habit.description ? (
                    <Text style={styles.habitDescription}>
                      {habit.description}
                    </Text>
                  ) : null}

                  <View style={styles.statsRow}>
                    <View style={styles.statBadge}>
                      <Text style={styles.statBadgeText}><MaterialCommunityIcons name="fire" size={27} color="#ff9800" /> {streak}</Text>
                      <Text style={styles.statLabel}>Current</Text>
                    </View>

                    <View style={styles.statBadgeGold}>
                      <Text style={styles.statBadgeText}>🏆 {bestStreak}</Text>
                      <Text style={styles.statLabel}>Best</Text>
                    </View>

                    <View style={styles.statBadgeGreen}>
                      <Text style={styles.statBadgeText}>{total}</Text>
                      <Text style={styles.statLabel}>Total</Text>
                    </View>
                  </View>
                </Card.Content>
              </Card>
            </MotiView>
          ))
        )}
      </ScrollView>
    </View>
  );
}
