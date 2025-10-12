import React, { useState } from "react";
import {
    Modal,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import { useTheme } from "react-native-paper";

type EditFieldModalProps = {
  visible: boolean;
  onClose: () => void;
  label: string;
  value?: string;
  onSave: (value: string) => void;
};

const EditFieldModal: React.FC<EditFieldModalProps> = ({
  visible,
  onClose,
  label,
  value = "",
  onSave,
}) => {
  const { colors } = useTheme();
  const [inputValue, setInputValue] = useState<string>(value);

  const handleSave = () => {
    onSave(inputValue);
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={styles.overlay}>
        <View style={[styles.modal, { backgroundColor: colors.surface }]}>
          <Text style={[styles.title, { color: colors.primary }]}>
            Edit {label}
          </Text>

          <TextInput
            placeholder={`Enter ${label}`}
            placeholderTextColor={colors.onSurfaceVariant}
            value={inputValue}
            onChangeText={setInputValue}
            style={[
              styles.input,
              { borderColor: colors.primary, color: colors.onSurface },
            ]}
          />

          <View style={styles.actions}>
            <TouchableOpacity onPress={onClose}>
              <Text style={{ color: colors.error }}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={handleSave}>
              <Text style={{ color: colors.primary, fontWeight: "bold" }}>
                Save
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

export default EditFieldModal;

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.4)",
  },
  modal: {
    width: "85%",
    borderRadius: 16,
    padding: 20,
  },
  title: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 14,
  },
  input: {
    borderWidth: 1,
    borderRadius: 10,
    padding: 10,
    marginBottom: 20,
  },
  actions: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
});
