// app/_layout.tsx
import { AuthProvider, useAuth } from "@/context/authContext";
import { HabitProvider } from "@/context/habitContext";
import * as LocalAuthentication from "expo-local-authentication";
import { Stack } from "expo-router";
import * as SecureStore from "expo-secure-store";
import { useEffect } from "react";
import { Alert } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { PaperProvider, useTheme } from "react-native-paper";
import { SafeAreaProvider } from "react-native-safe-area-context";

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <AuthProvider>
        <HabitProvider>
          <SafeAreaProvider>
            <InnerLayout />
          </SafeAreaProvider>
        </HabitProvider>
      </AuthProvider>
    </GestureHandlerRootView>
  );
}

function InnerLayout() {
  const { paperTheme } = useAuth();
  const { colors } = useTheme();

  // ✅ Safety Lock check on app launch
  useEffect(() => {
    const checkSafetyLock = async () => {
      try {
        const lockEnabled = await SecureStore.getItemAsync("safetyLockEnabled");
        if (lockEnabled === "true") {
          const result = await LocalAuthentication.authenticateAsync({
            promptMessage: "Unlock XchangeIT",
            fallbackLabel: "Use Passcode",
            disableDeviceFallback: false,
          });

          if (!result.success) {
            Alert.alert(
              "Access Denied",
              "Failed to authenticate. Please try again.",
              [
                {
                  text: "Retry",
                  onPress: () => checkSafetyLock(),
                },
                {
                  text: "Exit App",
                  onPress: () => {
                    // optionally exit or restrict access
                  },
                  style: "cancel",
                },
              ]
            );
          }
        }
      } catch (error) {
        console.error("Safety Lock Error:", error);
      }
    };

    checkSafetyLock();
  }, []);

  return (
    <PaperProvider theme={paperTheme}>
      <Stack
        screenOptions={{
          headerShown: false,
        }}
      >
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="auth" />
        <Stack.Screen name="login" />
        <Stack.Screen name="account" />
        <Stack.Screen
          name="appearance"
          options={{
            title: "appearance",
            headerShown: true,
            headerBackVisible: false,
          }}
        />
        <Stack.Screen
          name="profile"
          options={{
            title: "profile",
            headerShown: true,
            headerBackVisible: false,
          }}
        />
        <Stack.Screen
          name="habitManager"
          options={{
            title: "Manage Habits",
            headerShown: true,
            headerBackVisible: false,
          }}
        />
      </Stack>
    </PaperProvider>
  );
}
