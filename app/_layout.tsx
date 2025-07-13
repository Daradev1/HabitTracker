// app/_layout.tsx
import { AuthProvider } from "@/lib/authContext";
import { Stack } from "expo-router";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { PaperProvider } from "react-native-paper";
import { SafeAreaProvider } from "react-native-safe-area-context";
export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      {/* <RootLayoutInner /> */}
    <AuthProvider>
  <PaperProvider>    
   <SafeAreaProvider>   
    <Stack>
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="auth" options={{ headerShown: false }} />
    </Stack>
    </SafeAreaProvider>
    </PaperProvider>
   </AuthProvider> 
   </GestureHandlerRootView>
  );
}
