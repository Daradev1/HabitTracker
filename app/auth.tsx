// app/auth.tsx
import { useAuth } from "@/lib/authContext";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import { KeyboardAvoidingView, Platform, StyleSheet, View } from "react-native";
import { Button, Text, TextInput } from "react-native-paper";

export default function AuthScreen() {
  const [isSignUp, setIsSignup] = useState<boolean>(false);
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [error, setError] = useState<string | null>("");

  const router= useRouter();

 const { signUp, signIn } = useAuth();

const handleAuth = async()=>{
 if (!email || !password) {
      setError("Email and password are required.");
      return;
    }
  if (password.length < 6) {
      setError("Password must be at least 6 characters long.");
      return;
    }
  setError(null); // Reset error state
  try {
    if (isSignUp) {
      const signUpError = await signUp(email, password);
      if (signUpError) {
        setError(signUpError);
      } else {
        // Handle successful sign up, e.g., navigate to home
        router.replace("/");
      }
    } else {
      const signInError = await signIn(email, password);
      if (signInError) {
        setError(signInError);
      } else {
        // Handle successful sign in, e.g., navigate to home
        router.replace("/");

      }
    }
  } catch (err) {
    setError("An unexpected error occurred.");
  }

}

  const handleSwitchMode = () => {
    setIsSignup((prev) => !prev);
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={styles.container}
    >
      <View style={styles.content}>
        <Text variant="headlineMedium" style={styles.title}>
          {isSignUp ? "Create Account" : "Welcome Back!"}
        </Text>

        <TextInput
          style={styles.input}
          label="Email"
          autoCapitalize="none"
          keyboardType="email-address"
          placeholder="example@gmail.com"
          mode="outlined"
          onChangeText={setEmail}
        />
        <TextInput
          style={styles.input}
          label="Password"
          secureTextEntry
          placeholder="********"
          mode="outlined"
          onChangeText={setPassword}
        />
      {/* err state */}
        {error ? <Text style={{ color: "red" }}>{error}</Text> : null}
     
        <Button onPress={handleAuth} style={styles.button} mode="contained">
          {isSignUp ? "Sign Up" : "Sign In"}
        </Button>

        <Button
          style={styles.switchModeButton}
          onPress={handleSwitchMode}
          mode="text"
        >
          {isSignUp
            ? "Already have an account? Sign In"
            : "Don't have an account? Sign Up"}
        </Button>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  content: {
    flex: 1,
    padding: 16,
    justifyContent: "center",
  },
  title: {
    fontWeight: "bold",
    marginBottom: 24,
    textAlign: "center",
  },
  input: {
    marginBottom: 16,
  },
  button: {
    marginTop: 8,
    textAlign: "center",
  },
  switchModeButton: {
    marginTop: 16,
  },
});
