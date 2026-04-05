import React, { useCallback, useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  RefreshControl,
  ActivityIndicator,
} from "react-native";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { SafeAreaView } from "react-native-safe-area-context";
import { fetchMe, fetchPlayerState, fetchScenarios } from "../api";
import { isRegisteredInUi } from "../demoMode";
import { experienceSummary, levelLabel, xpIntoCurrentLevel } from "../progressLabels";
import { useAuth } from "../context/AuthContext";
import { colors } from "../theme";
import type { PlayerState, ScenarioSummary, UserMe } from "../types";
import type { RootStackParamList } from "../navigation/types";

function scenarioChannelRu(s: ScenarioSummary): string {
  switch (s.hubChannel) {
    case "SECURITY":
      return "ИБ";
    case "SOCIAL":
      return "Лента";
    default:
      return "Почта";
  }
}

export function AccountScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { logout, refresh: refreshAuth } = useAuth();
  const [me, setMe] = useState<UserMe | null>(null);
  const [player, setPlayer] = useState<PlayerState | null>(null);
  const [scenarios, setScenarios] = useState<ScenarioSummary[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      const [m, p, s] = await Promise.all([
        fetchMe().catch(() => null),
        fetchPlayerState(),
        fetchScenarios(),
      ]);
      setMe(m);
      setPlayer(p);
      setScenarios(s);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Не удалось загрузить профиль");
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load]),
  );

  const [regUi, setRegUi] = useState(false);
  useEffect(() => {
    void isRegisteredInUi(me).then(setRegUi);
  }, [me]);

  const onRefresh = async () => {
    setRefreshing(true);
    await load();
    await refreshAuth();
    setRefreshing(false);
  };

  const xpBarPct = player ? Math.round((xpIntoCurrentLevel(player.experience) / 100) * 100) : 0;

  async function onLogout() {
    await logout();
  }

  if (player === null && error === null) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={colors.accent} />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={["bottom"]}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => void onRefresh()} tintColor={colors.accent} />
        }
      >
        <Text style={styles.title}>Профиль</Text>
        {error ? (
          <View style={styles.errBox}>
            <Text style={styles.errText}>{error}</Text>
          </View>
        ) : null}
        {player ? (
          <>
            <View style={styles.card}>
              <Text style={styles.cardKicker}>{regUi ? "Аккаунт" : "Гостевой режим"}</Text>
              <Text style={styles.emailLine}>{regUi && me?.email ? me.email : "Демо — прогресс локальный для игрока"}</Text>
              <Text style={styles.level}>{levelLabel(player.level)}</Text>
              <Text style={styles.xpSummary}>{experienceSummary(player.experience)}</Text>
              <View style={styles.xpTrack}>
                <View style={[styles.xpFill, { width: `${xpBarPct}%` }]} />
              </View>
              <Text style={styles.statLine}>
                Доверие {player.reputation}% · серия идеальных миссий {player.perfectScenarioStreak}
              </Text>
              <Text style={styles.statLine}>
                Недельная цель: {player.weeklyGoalCurrent} / {player.weeklyGoalTarget}
              </Text>
            </View>
            <Text style={styles.section}>Достижения</Text>
            <View style={styles.card}>
              {player.achievements.length === 0 ? (
                <Text style={styles.muted}>Пока нет достижений в ответе сервера.</Text>
              ) : (
                player.achievements.map((a) => (
                  <View key={a.id} style={styles.achRow}>
                    <Text style={styles.achMark}>{a.unlocked ? "★" : "☆"}</Text>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.achTitle}>{a.title}</Text>
                      <Text style={styles.achDesc}>{a.description}</Text>
                    </View>
                  </View>
                ))
              )}
            </View>
            {scenarios ? (
              <>
                <Text style={styles.section}>История задач</Text>
                <View style={styles.card}>
                  {player.completedScenarioIds.length === 0 ? (
                    <Text style={styles.muted}>Пока нет завершённых сценариев.</Text>
                  ) : (
                    player.completedScenarioIds.map((id) => {
                      const s = scenarios.find((x) => x.id === id);
                      return (
                        <View key={id} style={styles.histRow}>
                          <Text style={styles.histTitle}>{s?.title ?? id}</Text>
                          <Text style={styles.histCh}>{s ? scenarioChannelRu(s) : ""}</Text>
                        </View>
                      );
                    })
                  )}
                </View>
              </>
            ) : null}
          </>
        ) : null}
        {regUi ? (
          <Pressable style={({ pressed }) => [styles.btnOut, pressed && styles.pressed]} onPress={() => void onLogout()}>
            <Text style={styles.btnOutText}>Выйти</Text>
          </Pressable>
        ) : (
          <Pressable
            style={({ pressed }) => [styles.btnPrimary, pressed && styles.pressed]}
            onPress={() => navigation.navigate("Login")}
          >
            <Text style={styles.btnPrimaryText}>Войти в аккаунт</Text>
          </Pressable>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  center: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: colors.bg },
  scroll: { padding: 16, paddingBottom: 40 },
  title: { color: colors.text, fontSize: 24, fontWeight: "800", marginBottom: 12 },
  errBox: {
    padding: 12,
    borderRadius: 10,
    backgroundColor: "rgba(240,113,120,0.12)",
    borderWidth: 1,
    borderColor: colors.danger,
    marginBottom: 12,
  },
  errText: { color: colors.danger },
  card: {
    backgroundColor: colors.card,
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 16,
  },
  cardKicker: { color: colors.accent, fontSize: 11, fontWeight: "700", letterSpacing: 1 },
  emailLine: { color: colors.text, fontSize: 15, marginTop: 6 },
  level: { color: colors.text, fontSize: 20, fontWeight: "800", marginTop: 12 },
  xpSummary: { color: colors.muted, marginTop: 6, fontSize: 14 },
  xpTrack: {
    height: 8,
    backgroundColor: colors.border,
    borderRadius: 4,
    marginTop: 12,
    overflow: "hidden",
  },
  xpFill: { height: "100%", backgroundColor: colors.accent, borderRadius: 4 },
  statLine: { color: colors.muted, marginTop: 10, fontSize: 14 },
  section: { color: colors.text, fontSize: 16, fontWeight: "700", marginBottom: 8 },
  muted: { color: colors.muted, fontSize: 14 },
  achRow: { flexDirection: "row", gap: 10, marginBottom: 14 },
  achMark: { color: colors.warning, fontSize: 18 },
  achTitle: { color: colors.text, fontWeight: "700" },
  achDesc: { color: colors.muted, fontSize: 13, marginTop: 2 },
  histRow: {
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  histTitle: { color: colors.text, fontWeight: "600" },
  histCh: { color: colors.muted, fontSize: 12, marginTop: 2 },
  btnOut: {
    marginTop: 8,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.danger,
    alignItems: "center",
  },
  btnOutText: { color: colors.danger, fontWeight: "700" },
  btnPrimary: {
    marginTop: 8,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: colors.accent,
    alignItems: "center",
  },
  btnPrimaryText: { color: "#04210f", fontWeight: "700" },
  pressed: { opacity: 0.9 },
});
