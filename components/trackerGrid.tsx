import React, { useMemo, useState } from 'react';
import {
    Dimensions,
    Modal,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';

// Types
interface ContributionGridProps {
  data?: Record<string, number>; // ISO date -> count
  colorSteps?: number;
  cellSize?: number;
  onPressEntry?: (dateStr: string, count: number) => void;
}

interface SelectedCell {
  date: string;
  count: number;
}

const WEEK_DAYS = 7;
const WEEKS = 53; // show ~1 year (53 weeks)

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CELL_MARGIN = 3;
const MONTH_LABEL_HEIGHT = 18;

export default function ContributionGrid({
  data = {},
  colorSteps = 5,
  cellSize,
  onPressEntry,
}: ContributionGridProps) {
  const [selected, setSelected] = useState<SelectedCell | null>(null);

  // compute cellSize if not provided
  const computedCellSize = useMemo(() => {
    const available = SCREEN_WIDTH - 40; // some padding
    const candidate = Math.floor((available - (WEEKS - 1) * CELL_MARGIN) / WEEKS);
    return Math.max(8, Math.min(candidate, cellSize ?? candidate));
  }, [cellSize]);

  // build array of weeks, each week: array of 7 date strings (sunday->saturday)
  const weeks = useMemo(() => generateWeeksArray(WEEKS), []);

  // Flatten to counts per cell
  const counts: Record<string, number> = useMemo(() => {
    const map: Record<string, number> = {};
    for (const w of weeks) {
      for (const d of w) {
        map[d] = data[d] ?? 0;
      }
    }
    return map;
  }, [weeks, data]);

  // months labels above grid for the first date appearing in each column
  const monthLabels = useMemo(() => getMonthLabels(weeks), [weeks]);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Year Activity</Text>

      <View style={{ height: MONTH_LABEL_HEIGHT }}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View style={{ flexDirection: 'row', paddingLeft: 10 }}>
            {monthLabels.map((m, i) => (
              <Text key={i} style={[styles.monthLabel, { marginLeft: m.offset }]}> 
                {m.label}
              </Text>
            ))}
          </View>
        </ScrollView>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View style={{ flexDirection: 'row', padding: 10 }}>
          {weeks.map((week, wi) => (
            <View key={wi} style={{ marginRight: CELL_MARGIN }}>
              {week.map((dateStr, di) => {
                const count = counts[dateStr] ?? 0;
                const color = getColorForCount(count, colorSteps);
                return (
                  <TouchableOpacity
                    key={`${dateStr}-${di}`}
                    onPress={() => {
                      setSelected({ date: dateStr, count });
                      onPressEntry?.(dateStr, count);
                    }}
                    activeOpacity={0.7}
                    style={{
                      width: computedCellSize,
                      height: computedCellSize,
                      backgroundColor: color,
                      borderRadius: 4,
                      marginBottom: CELL_MARGIN,
                    }}
                    accessibilityLabel={`Activity on ${dateStr}: ${count}`}
                  />
                );
              })}
            </View>
          ))}
        </View>
      </ScrollView>

      {/* legend */}
      <View style={styles.legendRow}>
        <Text style={styles.legendText}>Less</Text>
        <View style={styles.legendBoxes}>
          {Array.from({ length: colorSteps }).map((_, i) => (
            <View
              key={i}
              style={{
                width: 18,
                height: 18,
                marginRight: 6,
                backgroundColor: getColorByLevel(i, colorSteps),
                borderRadius: 3,
              }}
            />
          ))}
        </View>
        <Text style={styles.legendText}>More</Text>
      </View>

      {/* modal for selected day */}
      <Modal visible={!!selected} transparent animationType="fade">
        <Pressable style={styles.modalBackdrop} onPress={() => setSelected(null)}>
          <View style={styles.modalCard}>
            <Text style={styles.modalDate}>{selected?.date}</Text>
            <Text style={styles.modalCount}>{selected?.count} completions</Text>
            <Pressable
              onPress={() => setSelected(null)}
              style={({ pressed }) => [
                styles.modalClose,
                pressed && { opacity: 0.7 },
              ]}
            >
              <Text style={{ color: '#fff' }}>Close</Text>
            </Pressable>
          </View>
        </Pressable>
      </Modal>
    </View>
  );
}

// ---------- Helpers ---------- //

function generateWeeksArray(weeks: number): string[][] {
  const today = startOfDay(new Date());
  const lastSunday = startOfWeek(today);
  const weeksArr: string[][] = [];

  for (let w = 0; w < weeks; w++) {
    const weekStart = addDays(lastSunday, -7 * (weeks - 1 - w));
    const days: string[] = [];
    for (let d = 0; d < 7; d++) {
      const dt = addDays(weekStart, d);
      days.push(formatISODate(dt));
    }
    weeksArr.push(days);
  }
  return weeksArr;
}

function getMonthLabels(weeks: string[][]): { label: string; offset: number }[] {
  const labels: { label: string; offset: number }[] = [];
  let lastMonth: string | null = null;
  for (let i = 0; i < weeks.length; i++) {
    const firstDay = weeks[i][0];
    const month = new Date(firstDay).toLocaleString('default', { month: 'short' });
    if (month !== lastMonth) {
      labels.push({ label: month, offset: i * ((SCREEN_WIDTH - 40) / WEEKS) });
      lastMonth = month;
    }
  }
  return labels;
}

function getColorForCount(count: number, steps = 5): string {
  const level = Math.min(steps - 1, Math.max(0, Math.floor(count === 0 ? 0 : Math.log2(count + 1))));
  return getColorByLevel(level, steps);
}

function getColorByLevel(level: number, steps: number): string {
  if (level <= 0) return '#ebedf0';
  const greens = ['#9be9a8', '#40c463', '#30a14e', '#216e39'];
  const idx = Math.min(greens.length - 1, level - 1);
  return greens[idx];
}

// ---------- tiny date helpers ---------- //
function pad(n: number): string {
  return n < 10 ? '0' + n : '' + n;
}

function formatISODate(d: Date): string {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function startOfDay(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

function addDays(d: Date, days: number): Date {
  const x = new Date(d);
  x.setDate(x.getDate() + days);
  return x;
}

function startOfWeek(d: Date): Date {
  const dt = startOfDay(d);
  const day = dt.getDay();
  return addDays(dt, -day);
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: 8,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    marginLeft: 12,
    marginBottom: 6,
  },
  monthLabel: {
    fontSize: 12,
    color: '#444',
    marginRight: 8,
  },
  legendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
    paddingHorizontal: 12,
  },
  legendText: {
    fontSize: 12,
    color: '#666',
    marginHorizontal: 8,
  },
  legendBoxes: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalCard: {
    width: 260,
    padding: 16,
    backgroundColor: '#fff',
    borderRadius: 12,
    alignItems: 'center',
  },
  modalDate: {
    fontWeight: '700',
    marginBottom: 6,
  },
  modalCount: {
    marginBottom: 12,
    color: '#333',
  },
  modalClose: {
    backgroundColor: '#222',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
});
