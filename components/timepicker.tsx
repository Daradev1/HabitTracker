import { useAuth } from '@/context/authContext';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Alert, Platform, StyleSheet, Text, View } from 'react-native';
import { Button, TouchableRipple } from 'react-native-paper';

interface TimePickerProps {
  reminderTimes: string[];
  setReminderTimes: (times: string[]) => void;
}

const TimePicker: React.FC<TimePickerProps> = ({ reminderTimes, setReminderTimes }) => {

  const { plan } = useAuth();
  const router = useRouter();
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [tempTime, setTempTime] = useState(new Date());


  const handleTimeChange = (event: any, selectedDate?: Date) => {
    if (Platform.OS === 'android') {
      setShowTimePicker(false);
    }
    
    if (selectedDate) {
      const formattedTime = selectedDate.toLocaleTimeString([], { 
        hour: '2-digit', 
        minute: '2-digit',
        hour12: false // Use 24-hour format
      });
      
      if (plan === 'free' && reminderTimes.length >= 2) {
        Alert.alert(
          'Upgrade Required',
          'Free plan allows only 2 reminders. Upgrade to premium for unlimited reminders.',
          [
            { text: 'Later' },
            { text: 'Upgrade', onPress: () => router.push('/auth') }
          ]
        );
        return;
      }

      setReminderTimes([...reminderTimes, formattedTime]);
    }
  };

  const handleRemoveTime = (index: number) => {
    const newTimes = [...reminderTimes];
    newTimes.splice(index, 1);
    setReminderTimes(newTimes);
  };

  return (
    <>
      <Text style={styles.sectionHeader}>Notification Times</Text>
      
      {reminderTimes.map((time, index) => (
        <View key={index} style={styles.timeItem}>
          <Text style={styles.timeText}>{time}</Text>
          <TouchableRipple onPress={() => handleRemoveTime(index)}>
            <MaterialCommunityIcons name="close" size={20} color="#ff4444" />
          </TouchableRipple>
        </View>
      ))}

      {reminderTimes.length === 0 && (
        <Text style={styles.placeholderText}>No times added yet</Text>
      )}

      <Button 
        mode="outlined" 
        onPress={() => setShowTimePicker(true)}
        style={styles.addButton}
        labelStyle={styles.addButtonLabel}
        icon="plus"
      >
        Add Time
      </Button>

      {(showTimePicker || Platform.OS === 'ios') && (
        <DateTimePicker
          value={tempTime}
          mode="time"
          is24Hour={true}
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={handleTimeChange}
          themeVariant="light"
        />
      )}
    </>
  );
};

const styles = StyleSheet.create({
  sectionHeader: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  timeItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    marginBottom: 8,
  },
  timeText: {
    fontSize: 16,
    color: '#333',
  },
  placeholderText: {
    color: '#888',
    fontSize: 14,
    textAlign: 'center',
    marginVertical: 8,
  },
  addButton: {
    borderColor: '#6200ee',
    borderRadius: 8,
    marginTop: 8,
  },
  addButtonLabel: {
    color: '#6200ee',
  },
});

export default TimePicker;