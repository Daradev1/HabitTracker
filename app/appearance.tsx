import { useAuth } from "@/context/authContext";
import { MaterialIcons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import { Text, useTheme } from "react-native-paper";
import Animated, { FadeInDown } from 'react-native-reanimated';

export default function AppearanceScreen() {
  const { themeMode, setThemeMode, isDark } = useAuth();
  const theme = useTheme();
  const { colors } = theme;

  const options = [
    { value: 'light', icon: 'light-mode', label: 'Light' },
    { value: 'dark', icon: 'dark-mode', label: 'Dark' },
    { value: 'system', icon: 'settings', label: 'System' },
  ];

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Text variant="headlineMedium" style={[styles.title, { color: colors.onBackground }]}>
        Appearance
      </Text>

      <Animated.View 
        entering={FadeInDown.duration(400)}
        style={[
          styles.optionsContainer,
          { backgroundColor: colors.surfaceVariant, shadowColor: colors.shadow },
        ]}
      >
        {options.map((option) => (
          <TouchableOpacity
            key={option.value}
            onPress={() => setThemeMode(option.value as any)}
            style={[
              styles.option,
              themeMode === option.value && { backgroundColor: colors.primaryContainer },
            ]}
            activeOpacity={0.8}
          >
            <MaterialIcons
              name={option.icon as any}
              size={26}
              color={
                themeMode === option.value ? colors.primary : colors.onSurfaceVariant
              }
            />
            <Text
              variant="labelLarge"
              style={[
                styles.optionLabel,
                {
                  color:
                    themeMode === option.value
                      ? colors.primary
                      : colors.onSurfaceVariant,
                },
              ]}
            >
              {option.label}
            </Text>
          </TouchableOpacity>
        ))}
      </Animated.View>

      <Text
        variant="bodyMedium"
        style={[styles.hint, { color: colors.onSurfaceVariant }]}
      >
        Current mode: {isDark ? 'Dark' : 'Light'}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
  },
  title: {
    marginBottom: 28,
    textAlign: 'center',
    fontWeight: '600',
  },
  optionsContainer: {
    borderRadius: 14,
    padding: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 3,
  },
  option: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 18,
    borderRadius: 10,
    marginHorizontal: 4,
  },
  optionLabel: {
    marginTop: 6,
    fontWeight: '500',
  },
  hint: {
    marginTop: 30,
    textAlign: 'center',
    opacity: 0.7,
  },
});
