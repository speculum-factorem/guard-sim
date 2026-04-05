import React, { useCallback, useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  SectionList,
  Pressable,
  RefreshControl,
  ActivityIndicator,
} from "react-native";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { SafeAreaView } from "react-native-safe-area-context";
import { fetchPlayerState, fetchScenarios } from "../api";
import { channelLabel, hubBadgeLabel, splitScenariosByColumn, firstOpenScenarioId } from "../scenarioHub";
import { levelLabel } from "../progressLabels";
import { colors } from "../theme";
import type { PlayerState, ScenarioSummary } from "../types";
import type { RootStackParamList } from "../navigation/types";

export function DashboardScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [items, setItems] = useState<ScenarioSummary[] | null>(null);
  const [player, setPlayer] = useState<PlayerState | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      const [p, data] = await Promise.all([fetchPlayerState(), fetchScenarios()]);
      setPlayer(p);
      setItems(data);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Не удалось загрузить данные");
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load]),
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }, [load]);

  const columns = useMemo(() => {
    if (!items) {
      return { mail: [] as ScenarioSummary[], social: [] as ScenarioSummary[], security: [] as ScenarioSummary[] };
    }
    return splitScenariosByColumn(items);
  }, [items]);

  const quickStartId = useMemo(() => firstOpenScenarioId(columns), [columns]);

  const progressStats = useMemo(() => {
    if (!items || !player) return null;
    const total = items.length;
    const solved = player.completedScenarioIds.filter((id) => items.some((s) => s.id === id)).length;
    const pct = total === 0 ? 0 : Math.round((solved / total) * 100);
    return { total, solved, pct };
  }, [items, player]);

  const sections = useMemo(() => {
    const cols: { key: "mail" | "social" | "security"; data: ScenarioSummary[] }[] = [
      { key: "mail", data: columns.mail },
      { key: "social", data: columns.social },
      { key: "security", data: columns.security },
    ];
    return cols
      .filter((c) => c.data.length > 0)
      .map((c) => ({
        title: channelLabel(c.key),
        data: c.data,
      }));
  }, [columns]);

  return (
    <SafeAreaView style={styles.safe} edges={["bottom"]}>
      <View style={styles.header}>
        <Text style={styles.kicker}>Каталог миссий</Text>
        <Text style={styles.title}>Задачи и сценарии</Text>
        {player ? (
          <Text style={styles.meta}>
            {levelLabel(player.level)} · {player.experience} XP · доверие {player.reputation}%
          </Text>
        ) : null}
        {progressStats ? (
          <View style={styles.statsRow}>
            <View style={styles.stat}>
              <Text style={styles.statVal}>{progressStats.solved}</Text>
              <Text style={styles.statLbl}>Пройдено</Text>
            </View>
            <View style={styles.stat}>
              <Text style={styles.statVal}>{progressStats.total}</Text>
              <Text style={styles.statLbl}>В каталоге</Text>
            </View>
            <View style={[styles.stat, styles.statAccent]}>
              <Text style={styles.statVal}>{progressStats.pct}%</Text>
              <Text style={styles.statLbl}>Прогресс</Text>
            </View>
          </View>
        ) : null}
        {quickStartId ? (
          <Pressable
            style={({ pressed }) => [styles.quick, pressed && styles.pressed]}
            onPress={() => navigation.navigate("Play", { scenarioId: quickStartId })}
          >
            <Text style={styles.quickText}>Быстрый старт</Text>
          </Pressable>
        ) : null}
      </View>
      {error ? (
        <View style={styles.errBanner}>
          <Text style={styles.errText}>{error}</Text>
        </View>
      ) : null}
      {items === null && !error ? (
        <View style={styles.center}>
          <ActivityIndicator color={colors.accent} />
        </View>
      ) : (
        <SectionList
          sections={sections}
          keyExtractor={(item) => item.id}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => void onRefresh()} tintColor={colors.accent} />}
          renderSectionHeader={({ section: { title } }) => (
            <View style={styles.sectionHead}>
              <Text style={styles.sectionTitle}>{title}</Text>
            </View>
          )}
          renderItem={({ item }) => {
            const done = player?.completedScenarioIds.includes(item.id) ?? false;
            return (
              <Pressable
                style={({ pressed }) => [styles.card, pressed && styles.pressed]}
                onPress={() => navigation.navigate("Play", { scenarioId: item.id })}
              >
                <View style={styles.cardTop}>
                  <Text style={styles.badge}>{hubBadgeLabel(item)}</Text>
                  {done ? <Text style={styles.done}>✓</Text> : null}
                </View>
                <Text style={styles.cardTitle}>{item.title}</Text>
                <Text style={styles.cardDesc} numberOfLines={3}>
                  {item.description}
                </Text>
                <Text style={styles.cardAttack}>{item.attackTypeLabel}</Text>
              </Pressable>
            );
          }}
          contentContainerStyle={styles.listPad}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  header: { paddingHorizontal: 16, paddingTop: 8, paddingBottom: 12 },
  kicker: { color: colors.accent, fontSize: 11, fontWeight: "700", letterSpacing: 1 },
  title: { color: colors.text, fontSize: 22, fontWeight: "800", marginTop: 4 },
  meta: { color: colors.muted, marginTop: 8, fontSize: 14 },
  statsRow: { flexDirection: "row", gap: 10, marginTop: 14 },
  stat: {
    flex: 1,
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  statAccent: { borderColor: colors.accentDim },
  statVal: { color: colors.text, fontSize: 20, fontWeight: "800" },
  statLbl: { color: colors.muted, fontSize: 12, marginTop: 4 },
  quick: {
    marginTop: 14,
    alignSelf: "flex-start",
    backgroundColor: colors.accentBlue,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 10,
  },
  quickText: { color: "#0a1628", fontWeight: "700" },
  errBanner: {
    marginHorizontal: 16,
    padding: 12,
    backgroundColor: "rgba(240,113,120,0.12)",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.danger,
  },
  errText: { color: colors.danger },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  sectionHead: {
    backgroundColor: colors.bg,
    paddingVertical: 8,
    paddingHorizontal: 4,
  },
  sectionTitle: { color: colors.muted, fontSize: 13, fontWeight: "700", textTransform: "uppercase" },
  listPad: { paddingHorizontal: 16, paddingBottom: 24 },
  card: {
    backgroundColor: colors.card,
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cardTop: { flexDirection: "row", justifyContent: "space-between", marginBottom: 8 },
  badge: {
    color: colors.accent,
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 0.5,
  },
  done: { color: colors.accent, fontWeight: "800" },
  cardTitle: { color: colors.text, fontSize: 17, fontWeight: "700" },
  cardDesc: { color: colors.muted, fontSize: 14, marginTop: 6, lineHeight: 20 },
  cardAttack: { color: colors.warning, fontSize: 12, marginTop: 8, fontWeight: "600" },
  pressed: { opacity: 0.9 },
});
