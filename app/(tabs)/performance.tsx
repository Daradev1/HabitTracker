import ContributionGrid from '@/components/trackerGrid';
import { useHabit } from '@/context/habitContext';
import { Habit, HabitCompletion } from '@/types/database.type';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { ScrollView, StyleSheet, View } from 'react-native';
import { AnimatedCircularProgress } from 'react-native-circular-progress';
import { Button, Card, Text, useTheme } from 'react-native-paper';

// --- Utility functions stay OUTSIDE component ---
const calculateHabitCompletionRate = (habit: Habit, completions: HabitCompletion[]) => {
  const now = new Date();
  const createdAt = new Date(habit.created_at);
  const daysSinceCreated = Math.max(
    1,
    Math.floor((now.getTime() - createdAt.getTime()) / (1000 * 60 * 60 * 24))
  );

  const totalCompletions = completions.filter(
    (c) => c.habit_id === habit.id
  ).length;

  let expectedCompletions = 0;

  switch (habit.frequency) {
    case "daily":
      expectedCompletions = daysSinceCreated;
      break;
    case "weekly":
      expectedCompletions = Math.ceil(daysSinceCreated / 7);
      break;
    case "monthly":
      expectedCompletions = Math.ceil(daysSinceCreated / 30);
      break;
  }

  const completionRate =
    expectedCompletions > 0
      ? Math.min((totalCompletions / expectedCompletions) * 100, 100)
      : 0;

  return completionRate;
};

const calculateOverallCompletionRate = (
  habits: Habit[],
  completions: HabitCompletion[]
) => {
  if (!habits.length) return 0;

  const totalRate = habits.reduce((sum, habit) => {
    const rate = calculateHabitCompletionRate(habit, completions);
    return sum + rate;
  }, 0);

  return totalRate / habits.length;
};

// --- COMPONENT START ---
export default function PerformanceScreen() {
  const { colors } = useTheme();
  const { habits, allCompletions, getStreakData } = useHabit();

  // ✅ Calculate inside the component
  const overallRate = calculateOverallCompletionRate(habits, allCompletions);

  const stats = [
    {
      label: 'Completion Rate',
      value: `${overallRate.toFixed(1)}%`,
      icon: 'chart-pie',  
      text: 'Overall Rate',
      progress: overallRate / 100,
    },
  ];

 const achievements = [
  {
    name: "Daily Warrior",
    icon: "weather-sunny",
    earned: habits.some(h => h.frequency === "daily" && getStreakData(h).bestStreak >= 7),
  },
  {
    name: "Consistency King",
    icon: "crown-outline",
    earned: overallRate >= 80,
  },
  {
    name: "Weekly General",
    icon: "trophy",
    earned: habits.some(h => h.frequency === "weekly" && getStreakData(h).bestStreak >= 4),
  },
  {
    name: "Monthly Master",
    icon: "star",
    earned: habits.some(h => h.frequency === "monthly" && getStreakData(h).bestStreak >= 3),
  },
  {
    name: "Perfect Week",
    icon: "shield-check",
    earned: false, // You can later add weekly check logic here
  },
  {
    name: "Habit Veteran",
    icon: "medal-outline",
    earned: habits.some(h => {
      const createdAt = new Date(h.created_at);
      const daysActive = (Date.now() - createdAt.getTime()) / (1000 * 60 * 60 * 24);
      return daysActive >= 30;
    }),
  },
];


 const generateContributionData = (
  completions: HabitCompletion[]
): Record<string, number> => {
  const dateCountMap: Record<string, number> = {};

  completions.forEach((c) => {
    if (!c.completed_at) return;
    const date = new Date(c.completed_at).toISOString().split("T")[0];
    dateCountMap[date] = (dateCountMap[date] || 0) + 1;
  });

  return dateCountMap;
};

const data = generateContributionData(allCompletions);


  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    scrollContainer: {
      padding: 16,
    },
    header: {
      marginBottom: 24,
    },
    title: {
      fontSize: 28,
      fontWeight: 'bold',
      color: colors.onSurface,
      marginBottom: 8,
    },
    subtitle: {
      fontSize: 16,
      color: colors.onSurfaceVariant,
    },
    statsContainer: {
      marginBottom: 24,
    },
    statCard: {
      backgroundColor: colors.surface,
      marginBottom: 12,
      padding: 16,
      borderRadius: 12,
      elevation: 2,
    },
    statHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 12,
    },
    statIcon: {
      marginRight: 12,
    },
    statLabel: {
      fontSize: 18,
      fontWeight: '600',
      color: colors.onSurface,
    },
    statValue: {
      fontSize: 20,
      fontWeight: 'bold',
      textAlign: 'center',
      color: colors.primary,
      marginVertical: 8,
    },
    sectionTitle: {
      fontSize: 20,
      fontWeight: 'bold',
      color: colors.onSurface,
      marginBottom: 16,
    },
    achievementsContainer: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      justifyContent: 'space-between',
    },
    achievementCard: {
      width: '48%',
      backgroundColor: colors.surface,
      marginBottom: 16,
      padding: 16,
      borderRadius: 12,
      alignItems: 'center',
      elevation: 2,
    },
    achievementIcon: {
      marginBottom: 8,
    },
    achievementName: {
      fontSize: 14,
      fontWeight: '500',
      color: colors.onSurface,
      textAlign: 'center',
    },
    lockedAchievement: {
      opacity: 0.5,
    },
    buttonContainer: {
      marginTop: 24,
      marginBottom: 32,
    },
    text: { color: colors.onSurfaceVariant, fontSize: 8, textAlign: 'center' }
  });

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.scrollContainer}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.header}>
        <Text style={styles.title}>Your Performance</Text>
        <Text style={styles.subtitle}>Track your habit-building progress</Text>
        <ContributionGrid
          data={data}
          onPressEntry={(date, count) => console.log(date, count)}
        />
      </View>

      <View style={styles.statsContainer}>
        {stats.map((stat, index) => (
          <Card key={index} style={styles.statCard}>
            <View style={styles.statHeader}>
              <MaterialCommunityIcons
                name={stat.icon}
                size={24}
                color={colors.primary}
                style={styles.statIcon}
              />
              <Text style={styles.statLabel}>{stat.label}</Text>
            </View>
            <View style={{ alignItems: 'center', marginTop: 10 }}>
              <AnimatedCircularProgress
                size={150}
                width={10}
                fill={stat.progress * 100}
                tintColor={colors.primary}
                backgroundColor={colors.surfaceVariant}
                rotation={0}
              >
                {() => <Text style={styles.statValue}>{stat.value}</Text>}
                {/* {() => <Text style={styles.text}>{stat.text}</Text>} */}
              </AnimatedCircularProgress>
            </View>
          </Card>
        ))}
      </View>

      <Text style={styles.sectionTitle}>Achievements</Text>
      <View style={styles.achievementsContainer}>
        {achievements.map((achievement, index) => (
          <Card
            key={index}
            style={[
              styles.achievementCard,
              !achievement.earned && styles.lockedAchievement,
            ]}
          >
            <MaterialCommunityIcons
              name={achievement.icon}
              size={32}
              color={
                achievement.earned
                  ? colors.primary
                  : colors.onSurfaceVariant
              }
              style={styles.achievementIcon}
            />
            <Text style={styles.achievementName}>{achievement.name}</Text>
            <Text style={{ color: colors.onSurfaceVariant, fontSize: 12 }}>
              {achievement.earned ? 'Earned' : 'Locked'}
            </Text>
          </Card>
        ))}
      </View>

      <View style={styles.buttonContainer}>
        <Button
          mode="contained"
          onPress={() => console.log('View detailed stats')}
          labelStyle={{ color: colors.onPrimary }}
        >
          manage habits
        </Button>
      </View>
    </ScrollView>
  );
}
