import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { Button } from "react-native-paper";

type IntervalUnit = "Day" | "Week" | "Month";

interface Props {
  count: number;
  unit: IntervalUnit;
  onChange: (newCount: number) => void;
}

const CompletionsPerInterval: React.FC<Props> = ({ count, unit, onChange }) => {
  const increase = () => onChange(count + 1);
  const decrease = () => onChange(count > 0 ? count - 1 : 0);

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Completions Per Interval</Text>

      <View style={styles.row}>
        <Text style={styles.value}>{count}</Text>
        <Text style={styles.unit}>/ {unit}</Text>

        <Button
          mode="contained"
          onPress={decrease}
          style={styles.button}
          labelStyle={styles.buttonLabel}
        >
          -
        </Button>

        <Button
          mode="contained"
          onPress={increase}
          style={styles.button}
          labelStyle={styles.buttonLabel}
        >
          +
        </Button>
      </View>
    </View>
  );
};

export default CompletionsPerInterval;

const styles = StyleSheet.create({
  container: {
    margin: 16,
    
  },
  label: {
    fontSize: 14,
    marginBottom: 8,
    fontWeight: "600",
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
  },
  value: {
    fontSize: 18,
    fontWeight: "700",
    marginRight: 4,
  },
  unit: {
    fontSize: 18,
    marginRight: 12,
  },
  button: {
    marginHorizontal: 4,
    borderRadius: 6,
    minWidth: 35,
    height: 35,
    justifyContent: "center",
  },
  buttonLabel: {
    fontSize: 20,
    lineHeight: 20,
  },
});
