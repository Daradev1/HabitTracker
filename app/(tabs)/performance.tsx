import { MaterialCommunityIcons } from '@expo/vector-icons';
import { ScrollView, StyleSheet, View } from 'react-native';
import { Button, Card, ProgressBar, Text, useTheme } from 'react-native-paper';

export default function PerformanceScreen() {
  const { colors } = useTheme();

  const stats = [
    { label: 'Current Streak', value: '7 days', icon: 'fire', progress: 0.7 },
    { label: 'Completion Rate', value: '85%', icon: 'chart-pie', progress: 0.85 },
    { label: 'Habits Formed', value: '12/20', icon: 'check-circle', progress: 0.6 },
    { label: 'Weekly Goal', value: '4/7 days', icon: 'calendar-check', progress: 0.57 },
  ];

  const achievements = [
    { name: 'Early Riser', earned: true, icon: 'weather-sunny' },
    { name: 'Week Warrior', earned: true, icon: 'trophy' },
    { name: 'Month Master', earned: false, icon: 'star' },
    { name: 'Perfect Week', earned: false, icon: 'shield-check' },
  ];

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
      fontSize: 24,
      fontWeight: 'bold',
      color: colors.primary,
      marginVertical: 8,
    },
    progressBar: {
      height: 8,
      borderRadius: 4,
      backgroundColor: colors.surfaceVariant,
      marginTop: 8,
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
      marginBottom: 32, // Added extra bottom padding for scroll
    },
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
            <Text style={styles.statValue}>{stat.value}</Text>
            <ProgressBar
              progress={stat.progress}
              color={colors.primary}
              style={styles.progressBar}
            />
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
              !achievement.earned && styles.lockedAchievement
            ]}
          >
            <MaterialCommunityIcons
              name={achievement.icon}
              size={32}
              color={achievement.earned ? colors.primary : colors.onSurfaceVariant}
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
          View Detailed Stats
        </Button>
      </View>
    </ScrollView>
  );
}