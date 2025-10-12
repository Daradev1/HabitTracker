import { MaterialCommunityIcons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { useEffect, useState } from "react";
import { StyleSheet, TouchableOpacity, View } from "react-native";
import { Divider, Text, useTheme } from "react-native-paper";
import DatePickerModal from "../components/DatePickerModal";
import EditFieldModal from "../components/EditFieldModal";

type ModalState = {
  name: boolean;
  email: boolean;
  pronouns: boolean;
  birthday: boolean;
};

const ProfileScreen: React.FC = () => {
  const { colors } = useTheme();

  const [name, setName] = useState<string>("");
  const [email, setEmail] = useState<string>("");
  const [pronouns, setPronouns] = useState<string>("");
  const [birthday, setBirthday] = useState<string>("");

  const [modal, setModal] = useState<ModalState>({
    name: false,
    email: false,
    pronouns: false,
    birthday: false,
  });

  useEffect(() => {
    const loadProfile = async () => {
      const storedName = await AsyncStorage.getItem("userName");
      const storedEmail = await AsyncStorage.getItem("userEmail");
      const storedPronouns = await AsyncStorage.getItem("userPronouns");
      const storedBirthday = await AsyncStorage.getItem("userBirthday");
      if (storedName) setName(storedName);
      if (storedEmail) setEmail(storedEmail);
      if (storedPronouns) setPronouns(storedPronouns);
      if (storedBirthday) setBirthday(storedBirthday);
    };
    loadProfile();
  }, []);

  const saveToStorage = async (
    key: string,
    value: string,
    setter: React.Dispatch<React.SetStateAction<string>>
  ) => {
    await AsyncStorage.setItem(key, value);
    setter(value);
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Text style={[styles.header, { color: colors.primary }]}>Profile</Text>

      {[
        { label: "Name", value: name, key: "userName", modalKey: "name" },
        { label: "Email", value: email, key: "userEmail", modalKey: "email" },
        { label: "Pronouns", value: pronouns, key: "userPronouns", modalKey: "pronouns" },
        {
          label: "Birthday",
          value: birthday ? new Date(birthday).toDateString() : "",
          key: "userBirthday",
          modalKey: "birthday",
        },
      ].map((item, index) => (
        <React.Fragment key={index}>
          <TouchableOpacity
            style={styles.item}
            onPress={() => setModal({ ...modal, [item.modalKey]: true })}
          >
            <Text style={[styles.label, { color: colors.onSurfaceVariant }]}>
              {item.label}
            </Text>
            <View style={styles.rightSection}>
              <Text style={[styles.value, { color: colors.onSurface }]}>
                {item.value || "Not set"}
              </Text>
              <MaterialCommunityIcons
                name="chevron-right"
                size={22}
                color={colors.onSurfaceVariant}
              />
            </View>
          </TouchableOpacity>
          <Divider style={{ opacity: 0.2 }} />
        </React.Fragment>
      ))}

      {/* Modals */}
      <EditFieldModal
        visible={modal.name}
        label="Name"
        value={name}
        onSave={(v) => saveToStorage("userName", v, setName)}
        onClose={() => setModal({ ...modal, name: false })}
      />

      <EditFieldModal
        visible={modal.email}
        label="Email"
        value={email}
        onSave={(v) => saveToStorage("userEmail", v, setEmail)}
        onClose={() => setModal({ ...modal, email: false })}
      />

      <EditFieldModal
        visible={modal.pronouns}
        label="Pronouns"
        value={pronouns}
        onSave={(v) => saveToStorage("userPronouns", v, setPronouns)}
        onClose={() => setModal({ ...modal, pronouns: false })}
      />

      <DatePickerModal
        visible={modal.birthday}
        value={birthday}
        onSave={(v) => saveToStorage("userBirthday", v, setBirthday)}
        onClose={() => setModal({ ...modal, birthday: false })}
      />
    </View>
  );
};

export default ProfileScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  header: {
    fontSize: 24,
    fontWeight: "700",
    marginBottom: 30,
  },
  item: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 16,
  },
  label: {
    fontSize: 16,
  },
  value: {
    fontSize: 16,
    fontWeight: "500",
  },
  rightSection: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
});
