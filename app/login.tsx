import { useAuth } from "@/context/authContext";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import { KeyboardAvoidingView, Platform, StyleSheet, View } from "react-native";
import { Button, Divider, Text, TextInput, useTheme } from "react-native-paper";

export default function AuthScreen() {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [secureText, setSecureText] = useState(true);

  const { signIn } = useAuth(); // Removed signUp since we're handling that differently
  const router = useRouter();
  const theme = useTheme();

  // Clear stored credentials when switching between signup/login
  useEffect(() => {
    const clearStoredCredentials = async () => {
      await AsyncStorage.removeItem('pendingSignup');
    };
    clearStoredCredentials();
  }, [isSignUp]);

  const handleAuth = async () => {
    if (!email || !password) {
      setError("Email and password are required");
      return;
    }

    // For login only - signup is handled differently
    if (!isSignUp) {
      if (password.length < 6) {
        setError("Password must be at least 6 characters");
        return;
      }

      setError(null);
      try {
        const signInError = await signIn(email, password);

        if (signInError) {
          setError(signInError);
        } else {
          router.replace("/");
        }
      } catch (err) {
        setError("An unexpected error occurred");
      }
    }
  };

//   const handleSignUpInit = async () => {
//   if (!email || !password) {
//     setError("Email and password are required");
//     return;
//   }
//   if (password.length < 6) {
//     setError("Password must be at least 6 characters");
//     return;
//   }

//   try {
//     // First check if email exists in Appwrite
//     const { account, databases, DBID } = require("@/lib/appwrite");
    
//     // Option 1: Using account.get() - more reliable for email check
//     try {
//       await account.get(email);
//       // If no error, email exists
//       setError("Email already registered. Please sign in instead.");
//       return;
//     } catch (error) {
//       // Email doesn't exist, proceed
//     }

//     // If email doesn't exist, store credentials and proceed
//     await AsyncStorage.setItem('pendingSignup', JSON.stringify({ email, password }));
//     navigateToPricing();
//   } catch (err) {
//     console.error("Signup error:", err);
//     setError("Failed to verify email. Please try again.");
//   }
// };


const handleSignUpInit = async () => {
  if (!email || !password) {
    setError("Email and password are required");
    return;
  }
  if (password.length < 6) {
    setError("Password must be at least 6 characters");
    return;
  }

  try {
    const { account } = require("@/lib/appwrite");

    /* The Fix: Add timeout and retry logic */
    const checkEmailExists = async (attempts = 3): Promise<boolean> => {
      try {
        await account.get(email);
        return true; // Email exists
      } catch (error: any) {
        // 404 = Not found (email available)
        if (error.code === 404 || error.type === 'user_not_found') {
          return false;
        }
        // Network/server errors - retry
        if (attempts > 1) {
          await new Promise(resolve => setTimeout(resolve, 500));
          return checkEmailExists(attempts - 1);
        }
        throw error;
      }
    };

    const emailExists = await checkEmailExists();
    if (emailExists) {
      setError("Email already registered. Please sign in instead.");
      return;
    }

    await AsyncStorage.setItem('pendingSignup', JSON.stringify({ email, password }));
    navigateToPricing();
  } catch (err: any) {
    console.error("Signup error:", err);
    /* Improved error messages */
    setError(
      err.code === 500 ? "Server error. Please try again later." :
      err.message?.includes('network') ? "Network issues detected" :
      "Failed to verify email. Please try again."
    );
  }
};

  const toggleMode = () => {
    setIsSignUp((prev) => !prev);
    setError(null);
  };

  const navigateToPricing = () => {
    router.push({
      pathname: "/auth",
      params: { signupFlow: 'true' }
    });
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={styles.container}
    >
      <View style={styles.innerContainer}>
        <View style={styles.card}>
          <MaterialCommunityIcons 
            name={isSignUp ? "account-plus" : "account"} 
            size={48} 
            color="#7c4dff" 
            style={styles.icon}
          />
          <Text variant="headlineMedium" style={styles.title}>
            {isSignUp ? "Start Your Subscription" : "Welcome Back"}
          </Text>
          <Text variant="bodyMedium" style={styles.subtitle}>
            {isSignUp ? "Create your account after payment" : "Sign in to continue"}
          </Text>

          <TextInput
            style={styles.input}
            label="Email"
            left={<TextInput.Icon icon="email" />}
            keyboardType="email-address"
            autoCapitalize="none"
            mode="outlined"
            value={email}
            onChangeText={setEmail}
            theme={{ colors: { primary: '#6200ee' } }}
          />
          <TextInput
            style={styles.input}
            label="Password"
            left={<TextInput.Icon icon="lock" />}
            right={
              <TextInput.Icon 
                icon={secureText ? "eye-off" : "eye"} 
                onPress={() => setSecureText(!secureText)} 
              />
            }
            secureTextEntry={secureText}
            mode="outlined"
            value={password}
            onChangeText={setPassword}
            theme={{ colors: { primary: '#6200ee' } }}
          />

          {error && (
            <View style={styles.errorContainer}>
              <MaterialCommunityIcons name="alert-circle" size={16} color="#ff0033" />
              <Text style={styles.error}>{error}</Text>
            </View>
          )}

          {isSignUp ? (
            <>
              <Button
                mode="contained"
                onPress={handleSignUpInit}
                style={styles.authButton}
                labelStyle={styles.authButtonLabel}
              >
                Continue to Payment
              </Button>

              <View style={styles.dividerContainer}>
                <Divider style={styles.divider} />
                <Text style={styles.dividerText}>OR</Text>
                <Divider style={styles.divider} />
              </View>

              
            </>
          ) : (
            <Button
              mode="contained"
              onPress={handleAuth}
              style={styles.authButton}
              labelStyle={styles.authButtonLabel}
            >
              Sign In
            </Button>
          )}

          <Button 
            mode="text" 
            onPress={toggleMode}
            style={styles.toggleButton}
            labelStyle={styles.toggleButtonLabel}
          >
            {isSignUp
              ? "Already have an account? Sign in"
              : "Don't have an account? Subscribe now"}
          </Button>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

// ... (keep your existing styles)

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8f9fa",
  },
  innerContainer: {
    flex: 1,
    justifyContent: "center",
    padding: 20,
  },
  card: {
    backgroundColor: "#fff",
    padding: 24,
    borderRadius: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
  },
  icon: {
    alignSelf: "center",
    marginBottom: 16,
  },
  title: {
    textAlign: "center",
    fontWeight: "bold",
    color: "#333",
    marginBottom: 4,
  },
  subtitle: {
    textAlign: "center",
    color: "#666",
    marginBottom: 24,
  },
  input: {
    marginBottom: 16,
    backgroundColor: "transparent",
  },
  authButton: {
    marginTop: 8,
    borderRadius: 8,
    paddingVertical: 6,
    backgroundColor: "#7c4dff",
  },
  authButtonLabel: {
    color: "white",
    fontWeight: "bold",
    fontSize: 16,
  },
  paymentOptions: {
    marginTop: 16,
  },
  paymentButton: {
    borderRadius: 8,
    paddingVertical: 6,
    backgroundColor: Platform.OS === 'ios' ? '#000' : '#4285F4',
    marginBottom: 12,
  },
  paymentButtonLabel: {
    color: "white",
    fontWeight: "bold",
  },
  alternatePaymentButton: {
    borderRadius: 8,
    paddingVertical: 6,
    borderColor: "#6200ee",
  },
  alternatePaymentButtonLabel: {
    color: "#6200ee",
    fontWeight: "bold",
  },
  toggleButton: {
    marginTop: 16,
  },
  toggleButtonLabel: {
    color: "#6200ee",
  },
  errorContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginVertical: 8,
  },
  error: {
    color: "#ff0033",
    marginLeft: 4,
    textAlign: "center",
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 16,
  },
  divider: {
    flex: 1,
    height: 1,
    backgroundColor: '#e0e0e0',
  },
  dividerText: {
    width: 40,
    textAlign: 'center',
    color: '#888',
  },
});