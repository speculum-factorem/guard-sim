import React, { useCallback, useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  RefreshControl,
  LayoutAnimation,
  Platform,
  UIManager,
} from "react-native";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { SafeAreaView } from "react-native-safe-area-context";
import { CHALLENGE_TRACKS, NEWCOMER_COMPLETION_THRESHOLD } from "../challengeTracks";
import { fetchPlayerState, fetchScenarios } from "../api";
import { colors } from "../theme";
import type { ScenarioSummary } from "../types";
import type { RootStackParamList } from "../navigation/types";

if (Platform.OS === "android" && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const accentBorder: Record<string, string> = {
  mint: "#3ecf8e",
  lilac: "#b388ff",
  orange: "#e6a23c",
  yellow: "#e6c06a",
};

export function ChallengesScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [items, setItems] = useState<ScenarioSummary[] | null>(null);
  const [completedIds, setCompletedIds] = useState<Set<string>>(new Set());
  const [openTrack, setOpenTrack] = useState<string | null>(CHALLENGE_TRACKS[0]?.id ?? null);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    const [p, data] = await Promise.all([fetchPlayerState(), fetchScenarios()]);
    setItems(data);
    setCompletedIds(new Set(p.completedScenarioIds));
  }, []);

  useFocusEffect(
    useCallback(() => {
      void load().catch(() => {});
    }, [load]),
  );

  const byId = useMemo(() => {
    const m = new Map<string, ScenarioSummary>();
    for (const s of items ?? []) {
      m.set(s.id, s);
    }
    return m;
  }, [items]);

  const solvedCount = completedIds.size;
  const showNewcomerHint = solvedCount < NEWCOMER_COMPLETION_THRESHOLD;

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await load();
    } finally {
      setRefreshing(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={["bottom"]}>
      <ScrollView
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => void onRefresh()} tintColor={colors.accent} />
        }
        contentContainerStyle={styles.scroll}
      >
        <Text style={styles.title}>Челлендж-дорожки</Text>
        <Text style={styles.lead}>
          Тематические цепочки сценариев. Нажмите дорожку, чтобы увидеть шаги и открыть миссию.
        </Text>
        {CHALLENGE_TRACKS.map((track) => {
          const border = accentBorder[track.accent] ?? colors.border;
          const expanded = openTrack === track.id;
          const steps = track.scenarioIds
            .map((id) => ({ id, scenario: byId.get(id) }))
            .filter((x): x is { id: string; scenario: ScenarioSummary } => x.scenario != null);
          return (
            <View key={track.id} style={[styles.track, { borderLeftColor: border }]}>
              <Pressable
                onPress={() => {
                  LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
                  setOpenTrack(expanded ? null : track.id);
                }}
                style={styles.trackHead}
              >
                <View style={{ flex: 1 }}>
                  <Text style={styles.trackTitle}>{track.title}</Text>
                  {showNewcomerHint && track.recommendedForNewcomers ? (
                    <Text style={styles.rec}>Рекомендуем новичкам</Text>
                  ) : null}
                </View>
                <Text style={styles.chev}>{expanded ? "▼" : "▶"}</Text>
              </Pressable>
              <Text style={styles.trackDesc}>{track.description}</Text>
              {expanded
                ? steps.map(({ id, scenario }) => {
                    const done = completedIds.has(id);
                    return (
                      <Pressable
                        key={id}
                        style={({ pressed }) => [styles.stepRow, pressed && styles.pressed]}
                        onPress={() => navigation.navigate("Play", { scenarioId: id })}
                      >
                        <Text style={[styles.stepDot, done && styles.stepDotDone]}>{done ? "✓" : "○"}</Text>
                        <View style={{ flex: 1 }}>
                          <Text style={styles.stepTitle}>{scenario.title}</Text>
                          <Text style={styles.stepSub} numberOfLines={2}>
                            {scenario.attackTypeLabel}
                          </Text>
                        </View>
                      </Pressable>
                    );
                  })
                : null}
            </View>
          );
        })}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  scroll: { padding: 16, paddingBottom: 32 },
  title: { color: colors.text, fontSize: 22, fontWeight: "800" },
  lead: { color: colors.muted, marginTop: 8, marginBottom: 16, lineHeight: 22, fontSize: 15 },
  track: {
    backgroundColor: colors.card,
    borderRadius: 14,
    padding: 14,
    marginBottom: 12,
    borderLeftWidth: 4,
    borderWidth: 1,
    borderColor: colors.border,
  },
  trackHead: { flexDirection: "row", alignItems: "flex-start", gap: 8 },
  trackTitle: { color: colors.text, fontSize: 17, fontWeight: "700" },
  rec: { color: colors.accent, fontSize: 12, fontWeight: "600", marginTop: 4 },
  chev: { color: colors.muted, fontSize: 14, marginTop: 2 },
  trackDesc: { color: colors.muted, fontSize: 14, lineHeight: 20, marginTop: 10 },
  stepRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    marginTop: 8,
  },
  stepDot: { color: colors.muted, fontSize: 16, width: 22 },
  stepDotDone: { color: colors.accent },
  stepTitle: { color: colors.text, fontSize: 15, fontWeight: "600" },
  stepSub: { color: colors.muted, fontSize: 13, marginTop: 2 },
  pressed: { opacity: 0.88 },
});
