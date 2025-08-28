import { useAuth } from "@/context/authContext";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from 'react';
import { Alert, Linking, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Divider, Switch, useTheme } from 'react-native-paper';

const SettingScreen = () => {
  const { colors, dark } = useTheme();
  const { plan } = useAuth();
  const router = useRouter();
  const [isVacationEnabled, setIsVacationEnabled] = useState<string | boolean>(false);


const handleInstagramPress = () => {
    Linking.openURL('https://instagram.com/lightbyte_apps');
  };

  const handleShare = () => {
    // Implement your share functionality here
  };

  const handleReview = () => {
    // Implement app store review logic
  };
  const handleUpgradeRoute = ()=>{
    if (plan === "premium") return;
    router.replace('/auth')
  }

    useEffect(() => {
    const loadVacationMode = async () => {
      try {
        const storedValue = await AsyncStorage.getItem('vacationMode');
        if (storedValue !== null) {
          setIsVacationEnabled(
            storedValue === 'true' ? true :
            storedValue === 'false' ? false :
            storedValue // keep as string if not boolean
          );
        }
      } catch (error) {
        console.error('Failed to load vacation mode:', error);
      }
    };
    loadVacationMode();
  }, []);

 const handleVacationMode = async (value: boolean) => {
    if (plan === "free") {
      Alert.alert(
        "Premium Feature",
        "Upgrade to premium to use vacation mode",
        [
          { text: "Cancel" },
          { text: "Upgrade", onPress: () => router.push('/auth') }
        ]
      );
      return;
    }

    try {
      // Store as string if it's a string, otherwise convert boolean to string
      const valueToStore = typeof isVacationEnabled === 'string' 
        ? isVacationEnabled 
        : String(value);
      
      await AsyncStorage.setItem("vacationMode", valueToStore);
      setIsVacationEnabled(value);
      console.log("Vacation mode:", valueToStore);
    } catch (error) {
      console.error("Failed to set vacation mode:", error);
    }
  };


  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
      paddingTop: 50,
    },
    header: {
      paddingHorizontal: 20,
      paddingBottom: 20,
      backgroundColor: colors.surface,
    },
    headerContent: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 20,
    },
    name: {
      fontSize: 28,
      fontWeight: 'bold',
      color: colors.onSurface,
    },
    editButton: {
      padding: 5,
    },
    upgradeCard: {
      backgroundColor: dark ? '#1e1e1e' : '#ede7f6',
      borderRadius: 12,
      padding: 20,
      paddingRight: 50,
      position: 'relative',
      borderWidth: 1,
      borderColor: dark ? '#333' : '#d1c4e9',
    },
    upgradeTitle: {
      fontSize: 18,
      fontWeight: 'bold',
      color: colors.primary,
      marginBottom: 5,
    },
    upgradeSubtitle: {
      fontSize: 14,
      color: colors.onSurfaceVariant,
    },
    crownIcon: {
      position: 'absolute',
      right: 20,
      top: 20,
    },
    content: {
      flex: 1,
      paddingHorizontal: 20,
      backgroundColor: colors.background,
    },
    card: {
      backgroundColor: colors.surface,
      borderRadius: 12,
      padding: 20,
      marginBottom: 20,
      shadowColor: colors.shadow,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 6,
      elevation: 3,
    },
    quoteHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 15,
    },
    sectionTitle: {
      fontSize: 18,
      fontWeight: 'bold',
      color: colors.onSurface,
      marginBottom: 15,
    },
    viewAll: {
      color: colors.primary,
      fontSize: 14,
    },
    quoteText: {
      fontSize: 16,
      color: colors.onSurfaceVariant,
      fontStyle: 'italic',
      marginBottom: 20,
      lineHeight: 24,
    },
    divider: {
      marginVertical: 20,
      height: 1,
      backgroundColor: "#e0e0e0",
    },
    settingsList: {
      marginTop: 10,
    },
    settingItem: {
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: colors.surfaceVariant,
    },
    settingText: {
      fontSize: 16,
      color: colors.onSurface,
    },
    socialItem: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    versionItem: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingVertical: 16,
    },
    versionText: {
      fontSize: 14,
      color: colors.onSurfaceVariant,
    },
      

  });

  return (
    <View style={styles.container}>
      {/* Header Section */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <Text style={styles.name}>Dara</Text>
          <TouchableOpacity style={styles.editButton}>
            <MaterialCommunityIcons name="pencil" size={20} color={colors.primary} />
          </TouchableOpacity>
        </View>
        
        {plan === "free" ? (
          <TouchableOpacity style={styles.upgradeCard}>
            <View>
              <Text style={styles.upgradeTitle}>Upgrade to Premium</Text>
              <Text style={styles.upgradeSubtitle}>Get a bit better everyday</Text>
            </View>
            <MaterialCommunityIcons 
              name="crown" 
              size={24} 
              color="#FFD700" 
              style={styles.crownIcon}
            />
          </TouchableOpacity>
        ) : (
          <TouchableOpacity style={styles.upgradeCard}>
            <View>
              <Text style={styles.upgradeTitle}>Premium membership</Text>
              <Text style={styles.upgradeSubtitle}>Enjoy premium features</Text>
            </View>
            <MaterialCommunityIcons 
              name="crown" 
              size={24} 
              color="#FFD700" 
              style={styles.crownIcon}
            />
          </TouchableOpacity>
        )}
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.card}>
          <View style={styles.quoteHeader}>
            <Text style={styles.sectionTitle}>Daily Quote</Text>
            <TouchableOpacity>
              <Text style={styles.viewAll}>View {">"}</Text>
            </TouchableOpacity>
          </View>
          
          <Text style={styles.quoteText}>
            I am open to receiving all the love and support that surrounds me.
          </Text>
          
          <Divider style={styles.divider} />
          
          <Text style={styles.sectionTitle}>Settings</Text>
          <View style={styles.settingsList}>
            {/* All your setting items here */}
            <TouchableOpacity style={styles.settingItem}>
              <Text style={styles.settingText}>Vacation Mode</Text>
              <Switch
                value={Boolean(isVacationEnabled)} 
                onValueChange={handleVacationMode}
                color={colors.primary}
              />
            </TouchableOpacity>
            
        <TouchableOpacity style={styles.settingItem}>
              <Text style={styles.settingText}>Safety Lock</Text>
            </TouchableOpacity>
            <TouchableOpacity  onPress={()=>router.push('/appearance')} style={styles.settingItem}>
              <Text style={styles.settingText}>Appearance</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.settingItem}>
              <Text style={styles.settingText}>Reset Settings</Text>
            </TouchableOpacity>

             <TouchableOpacity style={styles.settingItem}>
              <Text style={styles.settingText}>Notifications Settings</Text>
            </TouchableOpacity>
             <TouchableOpacity onPress={handleUpgradeRoute} style={[styles.settingItem, {justifyContent:'space-between', flexDirection:"row"}]}>
              <Text style={styles.settingText}>Cloud sync</Text>
              <Text style={[styles.settingText, {opacity:0.5}, plan  === 'free' ? {color:"#FFD700", opacity:1}: '']}>{plan === "free" ? 'Upgrade to Premium' : 'Enabled'}</Text>
            </TouchableOpacity>
            
          </View>
        </View>
        {/* About section */}

         <TouchableOpacity style={styles.settingItem}>
    <Text style={styles.settingText}>About</Text>
  </TouchableOpacity>
  <Divider style={styles.divider} />
  
    <TouchableOpacity style={styles.settingItem}>
    <Text style={styles.settingText}>Usage Tips</Text>
  </TouchableOpacity>
  <Divider style={styles.divider} />
  
  <TouchableOpacity style={styles.settingItem}>
    <Text style={styles.settingText}>FAQs</Text>
  </TouchableOpacity>
  <Divider style={styles.divider} />
  
  <TouchableOpacity style={styles.settingItem}>
    <Text style={styles.settingText}>Contact us</Text>
  </TouchableOpacity>
  <Divider style={styles.divider} />
  
  <TouchableOpacity 
    style={styles.settingItem}
    onPress={() => Linking.openURL('https://instagram.com/lightbyte_apps')}
  >
    <View style={styles.socialItem}>
      <MaterialCommunityIcons name="instagram" size={20} color="#6200ee" />
      <Text style={[styles.settingText, { marginLeft: 10 }]}>Instagram: lightbyte_apps</Text>
    </View>
  </TouchableOpacity>
  <Divider style={styles.divider} />
  
  <TouchableOpacity 
    style={styles.settingItem}
    onPress={handleShare} //  share functionality
  >
    <View style={styles.socialItem}>
      <MaterialCommunityIcons name="share-variant" size={20} color="#6200ee" />
      <Text style={[styles.settingText, { marginLeft: 10 }]}>Share</Text>
    </View>
  </TouchableOpacity>
  <Divider style={styles.divider} />
  
  <TouchableOpacity style={styles.settingItem}>
    <Text style={styles.settingText}>Review & Support</Text>
  </TouchableOpacity>
  <Divider style={styles.divider} />
  
  <View style={styles.versionItem}>
    <Text style={styles.versionText}>V 2.10.21</Text>
    <MaterialCommunityIcons name="chevron-right" size={20} color="#888" />
  </View>
       
      </ScrollView>
    </View>
  );
};

export default SettingScreen;