import { Audio, AVPlaybackStatus, AVPlaybackStatusSuccess } from "expo-av";
import React, { useEffect, useState } from "react";
import { FlatList, StyleSheet, TouchableOpacity, View } from "react-native";
import { Button, Text, useTheme } from "react-native-paper";


type RingtoneSelectorProps = {
  onSelect: (tone: string) => void;
  selectedTone: string;
  onClose: () => void;
};

const ringtones = [
  { name: "alert1.wav", path: require("../assets/sounds/alert1.wav") },
  { name: "alert2.wav", path: require("../assets/sounds/alert2.wav") },
  { name: "alert3.wav", path: require("../assets/sounds/alert3.wav") },
  { name: "alert4.wav", path: require("../assets/sounds/alert4.wav") },
  { name: "alert5.wav", path: require("../assets/sounds/alert5.wav") },
];

export default function RingtoneSelector({
  onSelect,
  selectedTone,
  onClose,
}: RingtoneSelectorProps) {
 const { colors } = useTheme();
   const [sound, setSound] = useState<Audio.Sound | null>(null);

  async function playTone(tone: any) {
  try {
    if (sound) {
      await sound.stopAsync();
      await sound.unloadAsync();
    }

    const { sound: newSound } = await Audio.Sound.createAsync(tone.path);
    setSound(newSound);
    await newSound.playAsync();

    let playedOnce = false;

    newSound.setOnPlaybackStatusUpdate(async (status: AVPlaybackStatus) => {
      if (!status.isLoaded) return; // Ignore unloaded or error states
      const successStatus = status as AVPlaybackStatusSuccess;

      if (successStatus.didJustFinish && !playedOnce) {
        playedOnce = true;
        await newSound.replayAsync();
      }
    });
  } catch (error) {
    console.warn("Error playing tone:", error);
  }
}


  useEffect(() => {
    return () => {
      if (sound) sound.unloadAsync();
    };
  }, [sound]);

  const handleSelect = (toneName: string, tone: any) => {
    onSelect(toneName);
    playTone(tone);
  };

// css
const styles = StyleSheet.create({
  container: {
    backgroundColor: "rgba(0,0,0,0.45)",
    flex: 1,
    justifyContent: "flex-end",
  },
  sheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 26,
    // subtle elevation/shadow for the sheet
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -6 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 10,
    maxHeight: "65%",
  },
  header: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 12,
    textAlign: "center",
    color: colors.onSurface,
  },
  toneItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 14,
    marginVertical: 6,
    borderRadius: 12,
    // remove the old bottom outline and use subtle surface contrast
    backgroundColor: "transparent",
  },
  // modern, subtle highlight for the selected tone
  selectedTone: {
    backgroundColor: colors.primaryContainer ?? colors.primary + "10",
    // left "zero" pointer / indicator feel by using a thicker left accent
    borderLeftWidth: 6,
    borderLeftColor: colors.primary,
    // slight shadow to lift the selected item
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 4,
  },
  toneText: {
    fontSize: 16,
    color: colors.onSurface,
  },
  // optional small circular indicator style (can be added in JSX if desired)
  dot: {
    width: 10,
    height: 10,
    borderRadius: 10,
    marginRight: 12,
    backgroundColor: colors.primary,
  },
  doneButton: {
    marginTop: 14,
    borderRadius: 10,
    alignSelf: "center",
    width: "92%",
    paddingVertical: 6,
    backgroundColor: colors.primary,
    // lift the button slightly
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 6,
  },
});


  return (
    <View style={styles.container}>
      <View style={styles.sheet}>
        <Text style={styles.header}>Select Notification Tone</Text>

        <FlatList
          data={ringtones}
          keyExtractor={(item) => item.name}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[
                styles.toneItem,
                item.name === selectedTone && styles.selectedTone,
              ]}
              onPress={() => handleSelect(item.name, item)}
            >
              <Text style={styles.toneText}>{item.name}</Text>
              {item.name === selectedTone && <Text>✓</Text>}
            </TouchableOpacity>
          )}
        />

        <Button mode="contained" onPress={onClose} style={styles.doneButton}>
          Done
        </Button>
      </View>
    </View>
  );
}

