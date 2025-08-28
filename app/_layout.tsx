// app/_layout.tsx
import { AuthProvider } from "@/context/authContext";
import { HabitProvider } from "@/context/habitContext";
import { Stack } from "expo-router";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { useTheme } from 'react-native-paper';
import { SafeAreaProvider } from "react-native-safe-area-context";

export default function RootLayout() {
  const theme = useTheme(); // Get theme from PaperProvider
  
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <AuthProvider>
    <HabitProvider>
        <SafeAreaProvider>
          <Stack
            screenOptions={{
              headerTintColor: theme.colors.primary,
              headerStyle: {
                backgroundColor: theme.colors.background,
              },
              contentStyle: {
                backgroundColor: theme.colors.background,
              },
            }}
          >
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
            <Stack.Screen name="auth" options={{ headerShown: false }} />
            <Stack.Screen name="login" options={{ headerShown: false }} />
            <Stack.Screen name="account" options={{ headerShown: false }} />
            <Stack.Screen 
              name="appearance" 
              options={{ 
                headerShown: true, 
                title: "Theme",
                headerTitleStyle: {
                  color: theme.colors.text,
                }
              }} 
            />
          </Stack>
        </SafeAreaProvider>
          </HabitProvider>
      </AuthProvider>
    </GestureHandlerRootView>
  );
}