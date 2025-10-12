import { MaterialCommunityIcons } from "@expo/vector-icons";
import * as Clipboard from "expo-clipboard";
import React, { useEffect, useState } from "react";
import { ActivityIndicator, Text, TouchableOpacity, View } from "react-native";
import { useTheme } from "react-native-paper";

export default function DailyQuote() {
  const { colors } = useTheme();
  const [quote, setQuote] = useState("");
  const [author, setAuthor] = useState("");
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const fetchQuote = async () => {
      try {
        const response = await fetch("https://zenquotes.io/api/today");
        const data = await response.json();
        setQuote(data[0].q);
        setAuthor(data[0].a);
      } catch (error) {
        console.log("Error fetching quote:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchQuote();
  }, []);

  const handleCopy = async () => {
    await Clipboard.setStringAsync(`"${quote}" — ${author}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500); // reset text after 1.5s
  };

  if (loading) {
    return (
      <ActivityIndicator color={colors.primary} style={{ marginTop: 20 }} />
    );
  }

  return (
    <View
      style={{
        padding: 20,
        alignItems: "center",
        borderRadius: 12,
        backgroundColor: colors.surfaceVariant,
        marginHorizontal: 20,
      }}
    >
      <Text
        style={{
          fontSize: 18,
          fontStyle: "italic",
          color: colors.onSurface,
          textAlign: "center",
          marginBottom: 10,
        }}
      >
        “{quote}”
      </Text>

      <Text style={{ fontWeight: "bold", color: colors.primary, marginBottom: 8 }}>
        — {author}
      </Text>

      <TouchableOpacity
        onPress={handleCopy}
        style={{ flexDirection: "row", alignItems: "center" }}
      >
        <MaterialCommunityIcons
          name={copied ? "check" : "content-copy"}
          size={20}
          color={copied ? colors.primary : colors.onSurface}
        />
        <Text
          style={{
            marginLeft: 6,
            color: copied ? colors.primary : colors.onSurface,
            fontSize: 14,
          }}
        >
          {copied ? "Copied!" : "Copy quote"}
        </Text>
      </TouchableOpacity>
    </View>
  );
}
