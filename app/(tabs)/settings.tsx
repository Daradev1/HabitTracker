import { useAuth } from "@/context/authContext";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import * as LocalAuthentication from "expo-local-authentication";
import { useRouter } from "expo-router";
import * as SecureStore from "expo-secure-store";
import React, { useEffect, useState } from "react";
import {
  Alert, Linking,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View
} from "react-native";
import {
  Divider,
  Switch,
  Text,
  TouchableRipple,
  useTheme,
} from "react-native-paper";
import DailyQuote from '../../components/dailyQuotes';

const SettingScreen = () => {
  const { colors, dark } = useTheme();
  const { plan } = useAuth();
  const router = useRouter();
  const [isSafetyLockEnabled, setIsSafetyLockEnabled] = useState(false);


  const handleInstagramPress = () => {
    Linking.openURL("https://instagram.com/");
  };

  const handleShare = () => {
    // share logic
  };

  const handleReview = () => {
    // store review logic
  };

  const handleUpgradeRoute = () => {
    if (plan === "premium") return;
    router.replace("/auth");
  };

 

// 🔹 Check stored value when the Settings screen loads
useEffect(() => {
  const loadSafetyLockStatus = async () => {
    const storedValue = await SecureStore.getItemAsync("safetyLockEnabled");
    setIsSafetyLockEnabled(storedValue === "true");
  };
  loadSafetyLockStatus();
}, []);


// 🔹 Handle toggle
const handleSafetyLock = async (value: boolean) => {
  try {
    if (value) {
      const compatible = await LocalAuthentication.hasHardwareAsync();
      if (!compatible) {
        Alert.alert("Not Supported", "Your device does not support biometric authentication.");
        return;
      }

      const enrolled = await LocalAuthentication.isEnrolledAsync();
      if (!enrolled) {
        Alert.alert(
          "No Biometrics Found",
          "Please enable Face ID, Touch ID, or PIN in your device settings first."
        );
        return;
      }

      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: "Confirm your identity to enable Safety Lock",
        fallbackLabel: "Enter Device Passcode",
      });

      if (result.success) {
        await SecureStore.setItemAsync("safetyLockEnabled", "true");
        setIsSafetyLockEnabled(true); // ✅ Update UI
        Alert.alert("Safety Lock Enabled", "Your app is now protected by biometrics or device PIN.");
      } else {
        Alert.alert("Cancelled", "Safety Lock was not enabled.");
      }
    } else {
      await SecureStore.deleteItemAsync("safetyLockEnabled");
      setIsSafetyLockEnabled(false); // ✅ Update UI
      Alert.alert("Safety Lock Disabled", "Your app is no longer protected.");
    }
  } catch (error) {
    console.error("Safety Lock Error:", error);
    Alert.alert("Error", "Something went wrong while updating safety lock.");
  }
};

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    header: {
      paddingHorizontal: 24,
      paddingTop: 50,
      paddingBottom: 28,
      backgroundColor: colors.surface,
      borderBottomWidth: 1,
      borderBottomColor: colors.surfaceVariant,
    },
    headerContent: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      marginBottom: 24,
    },
    name: {
      fontSize: 26,
      fontWeight: "700",
      color: colors.onSurface,
    },
    editButton: {
      padding: 6,
      borderRadius: 50,
    },
    upgradeCard: {
      backgroundColor: dark ? "#1e1e1e" : "#f5f2ff",
      borderRadius: 14,
      padding: 18,
      marginTop: 4,
      position: "relative",
      borderWidth: 1,
      borderColor: dark ? "#333" : "#e0d4ff",
    },
    upgradeTitle: {
      fontSize: 18,
      fontWeight: "600",
      color: colors.primary,
    },
    upgradeSubtitle: {
      fontSize: 14,
      color: colors.onSurfaceVariant,
      marginTop: 4,
    },
    crownIcon: {
      position: "absolute",
      right: 20,
      top: 20,
    },
    content: {
      flex: 1,
      paddingHorizontal: 0,
      paddingTop: 12,
    },
    card: {
      backgroundColor: colors.surface,
      borderRadius: 12,
      // padding: 20,
      marginBottom: 24,
      elevation: 2,
    },
    sectionTitle: {
      fontSize: 18,
      fontWeight: "600",
      color: colors.onSurface,
      marginBottom: 16,
      marginLeft: 20,
    },
    settingsSectionTitle:{
      fontSize: 18,
      fontWeight: "600",
      color: colors.onSurface,
      marginBottom: 16,
      padding: 20,
    },
    quoteText: {
      fontSize: 16,
      color: colors.onSurfaceVariant,
      fontStyle: "italic",
      lineHeight: 24,
      marginBottom: 12,
    },
    settingItem: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingVertical: 14,
      padding: 20,
    },
    settingText: {
      fontSize: 16,
      color: colors.onSurface,
    },
    divider: {
      opacity: 0.2,
    },
    versionItem: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      paddingVertical: 16,
    },
    versionText: {
      fontSize: 14,
      color: colors.onSurfaceVariant,
    },
  });

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <Text style={styles.name}>Dara</Text>
          <TouchableOpacity style={styles.editButton}>
            <MaterialCommunityIcons
              name="pencil-outline"
              size={22}
              color={colors.primary}  
             onPress={() => router.push("/profile")}
            />
          </TouchableOpacity>


        </View>

        <TouchableRipple
          onPress={handleUpgradeRoute}
          borderless
          style={styles.upgradeCard}
        >
          <>
            <Text style={styles.upgradeTitle}>
              {plan === "free" ? "Upgrade to Premium" : "Premium Member"}
            </Text>
            <Text style={styles.upgradeSubtitle}>
              {plan === "free"
                ? "Unlock all features for better tracking."
                : "Enjoy unlimited access and exclusive perks."}
            </Text>
            <MaterialCommunityIcons
              name="crown"
              size={28}
              color="#FFD700"
              style={styles.crownIcon}
            />
          </>
        </TouchableRipple>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/*quote  */}
        <Text style={styles.sectionTitle}>Daily Inspiration</Text>
       <DailyQuote/>
   {/*quote  */}
        <View style={styles.card}>
          <Text style={styles.settingsSectionTitle}>Settings</Text>

          <TouchableRipple onPress={() => handleSafetyLock(!isSafetyLockEnabled)}>
            <View style={styles.settingItem}>
              <Text style={styles.settingText}>Safety Lock</Text>
              <Switch
                value={Boolean(isSafetyLockEnabled)}
                onValueChange={handleSafetyLock}
                color={colors.primary}
              />
            </View>
          </TouchableRipple>

          <Divider style={styles.divider} />

          <TouchableRipple onPress={() => router.push("/appearance")}>
            <View style={styles.settingItem}>
              <Text style={styles.settingText}>Appearance</Text>
              <MaterialCommunityIcons
                name="chevron-right"
                size={22}
                color={colors.onSurfaceVariant}
              />
            </View>
          </TouchableRipple>

          <Divider style={styles.divider} />

          <TouchableRipple>
            <View style={styles.settingItem}>
              <Text style={styles.settingText}>Notifications</Text>
              <MaterialCommunityIcons
                name="chevron-right"
                size={22}
                color={colors.onSurfaceVariant}
              />
            </View>
          </TouchableRipple>

          <Divider style={styles.divider} />

          <TouchableRipple
          onPress={() => router.push("/habitManager")}>
            <View style={styles.settingItem}
            
            >
              <Text style={styles.settingText}>Habit Manager</Text>
              <MaterialCommunityIcons
                name="chevron-right"
                size={22}
                color={colors.onSurfaceVariant}
              />
            </View>
          </TouchableRipple>

          <Divider style={styles.divider} />

          <TouchableRipple onPress={handleUpgradeRoute}>
            <View style={styles.settingItem}>
              <Text style={styles.settingText}>Cloud Sync</Text>
              <Text
                style={[
                  styles.settingText,
                  plan === "free"
                    ? { color: "#FFD700", fontWeight: "600" }
                    : { opacity: 0.6 },
                ]}
              >
                {plan === "free" ? "Upgrade" : "Enabled"}
              </Text>
            </View>
          </TouchableRipple>
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>About</Text>

          <TouchableRipple onPress={handleInstagramPress}>
            <View style={styles.settingItem}>
              <MaterialCommunityIcons
                name="instagram"
                size={20}
                color={colors.primary}
              />
              <Text
                style={[styles.settingText, { marginLeft: 12, flexShrink: 1 }]}
              >
                Instagram: dara_apps
              </Text>
            </View>
          </TouchableRipple>

          <Divider style={styles.divider} />

          <TouchableRipple onPress={handleShare}>
            <View style={styles.settingItem}>
              <MaterialCommunityIcons
                name="share-variant"
                size={20}
                color={colors.primary}
              />
              <Text style={[styles.settingText, { marginLeft: 12 }]}>Share</Text>
            </View>
          </TouchableRipple>

          <Divider style={styles.divider} />

          <TouchableRipple>
            <View style={styles.versionItem}>
              <Text style={styles.versionText}>App Version</Text>
              <Text style={styles.versionText}>v1.10.0</Text>
            </View>
          </TouchableRipple>
        </View>
      </ScrollView>
    </View>
  );
};

export default SettingScreen; 