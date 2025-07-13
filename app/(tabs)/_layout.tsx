// app/(tabs)/_layout.tsx
import { useAuth } from "@/lib/authContext";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Redirect, Tabs } from "expo-router";
import { Text } from "react-native";

export default function TabsLayout() {
  const { user, loading } = useAuth();

  if (loading) {
    return <Text>Loading...</Text>; // prevent early navigation
  }

  if (!user) {
    return <Redirect href="/auth" />;
  }

  return (
    <Tabs
      screenOptions={{
       headerStyle: { backgroundColor: "#f5f5f5" },
       headerShadowVisible:false,
       tabBarStyle: { 
       backgroundColor: "#f5f5f5",
       borderTopWidth:0,
       elevation:0,
       shadowOpacity:0, },
       tabBarActiveTintColor: "#6200ee",
       tabBarInactiveTintColor: "#666666",

      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Today's Habits",
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="calendar-today" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="streaks"
        options={{
          title: "streaks",
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="chart-line" size={size} color={color} />
          ),
        }}
      />

       <Tabs.Screen
        name="add-habit"
        options={{
          title: "Add Habit",
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="plus-circle" size={size} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
