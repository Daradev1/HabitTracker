import { MaterialCommunityIcons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
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
        // 1️⃣ Try loading cached quote
        const cachedData = await AsyncStorage.getItem("dailyQuote");
        if (cachedData) {
          const { quote, author, date } = JSON.parse(cachedData);
          const isSameDay = checkIfSameDay(date);

          if (isSameDay) {
            // Use cached quote if it's from today
            setQuote(quote);
            setAuthor(author);
            setLoading(false);
            return;
          }
        }

        // 2️⃣ Fetch new quote if not cached or outdated
        const response = await fetch("https://zenquotes.io/api/today");
        const data = await response.json();

        if (data && data[0]) {
          const newQuote = data[0].q;
          const newAuthor = data[0].a;

          setQuote(newQuote);
          setAuthor(newAuthor);

          // 3️⃣ Cache new quote with today's date
          const newCache = {
            quote: newQuote,
            author: newAuthor,
            date: new Date().toISOString(),
          };
          await AsyncStorage.setItem("dailyQuote", JSON.stringify(newCache));
        }
      } catch (error) {
        console.log("Error fetching quote:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchQuote();
  }, []);

  // Utility: Check if stored date is today
  const checkIfSameDay = (dateString) => {
    const savedDate = new Date(dateString);
    const today = new Date();
    return (
      savedDate.getDate() === today.getDate() &&
      savedDate.getMonth() === today.getMonth() &&
      savedDate.getFullYear() === today.getFullYear()
    );
  };

  const handleCopy = async () => {
    await Clipboard.setStringAsync(`"${quote}" — ${author}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
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
