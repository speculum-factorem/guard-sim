import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Modal,
  ActivityIndicator,
} from "react-native";
import { useRoute, useNavigation } from "@react-navigation/native";
import type { RouteProp } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { fetchScenario, startSession, submitAnswer } from "../api";
import { missionBriefText, stepAnalysisText } from "../missionText";
import { missionChannelLabel } from "../scenarioHub";
import { simulationHttpErrorMessage } from "../simulationErrorMessage";
import { colors } from "../theme";
import type {
  AnswerResponse,
  CareerSnapshot,
  ChoicePublic,
  ScenarioDetail,
  StepPublic,
} from "../types";
import type { RootStackParamList } from "../navigation/types";

function hotspotChoiceIds(step: StepPublic): Set<string> {
  return new Set(step.hotspots.map((h) => h.choiceId));
}

function serpPickChoiceIds(step: StepPublic): Set<string> {
  const g = step.serpPickGame;
  if (!g) return new Set();
  return new Set(g.results.map((r) => r.choiceId));
}

function netShieldChoiceIds(step: StepPublic): Set<string> {
  const g = step.netShieldGame;
  if (!g) return new Set();
  return new Set(g.rows.map((r) => r.choiceId));
}

function fallbackChoices(step: StepPublic): ChoicePublic[] {
  if (step.uiKind === "GENERIC" && step.hotspots.length === 0) {
    return [];
  }
  const fromHotspots = hotspotChoiceIds(step);
  const game = step.urlCompareGame;
  const serp = serpPickChoiceIds(step);
  const net = netShieldChoiceIds(step);
  return step.choices.filter((c) => {
    if (fromHotspots.has(c.id)) return false;
    if (game && (c.id === game.leftChoiceId || c.id === game.rightChoiceId)) return false;
    if (serp.has(c.id)) return false;
    if (net.has(c.id)) return false;
    return true;
  });
}

function PressureBar({
  totalSeconds,
  stepId,
  frozen,
  onExpired,
}: {
  totalSeconds: number | null | undefined;
  stepId: string;
  frozen: boolean;
  onExpired?: () => void;
}) {
  const [left, setLeft] = useState(totalSeconds ?? 0);
  const onExpiredRef = useRef(onExpired);
  onExpiredRef.current = onExpired;
  const firedRef = useRef(false);

  useEffect(() => {
    setLeft(totalSeconds ?? 0);
    firedRef.current = false;
  }, [stepId, totalSeconds]);

  useEffect(() => {
    if (frozen || !totalSeconds || totalSeconds <= 0) {
      return;
    }
    const id = setInterval(() => {
      setLeft((s) => {
        if (s <= 0) return 0;
        const next = s - 1;
        if (next === 0 && !firedRef.current) {
          firedRef.current = true;
          queueMicrotask(() => onExpiredRef.current?.());
        }
        return next;
      });
    }, 1000);
    return () => clearInterval(id);
  }, [totalSeconds, stepId, frozen]);

  if (!totalSeconds || totalSeconds <= 0) {
    return null;
  }

  const expired = left === 0;
  const pct = totalSeconds > 0 ? Math.min(100, (left / totalSeconds) * 100) : 0;

  return (
    <View style={[styles.pressureWrap, expired && styles.pressureExpired]}>
      <View style={styles.pressureHead}>
        <Text style={styles.pressureLabel}>Время на шаг</Text>
        <Text style={styles.pressureSec}>{left} с</Text>
      </View>
      <View style={styles.pressureTrack}>
        <View style={[styles.pressureFill, { width: `${pct}%` }]} />
      </View>
      {expired ? (
        <Text style={styles.pressureHint}>Время вышло — шаг засчитан как ошибка.</Text>
      ) : (
        <Text style={styles.pressureHint}>Уложитесь в лимит.</Text>
      )}
    </View>
  );
}

export function PlayScreen() {
  const route = useRoute<RouteProp<RootStackParamList, "Play">>();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const scenarioId = route.params.scenarioId;

  const [detail, setDetail] = useState<ScenarioDetail | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [step, setStep] = useState<StepPublic | null>(null);
  const [stepIndex, setStepIndex] = useState(0);
  const [totalSteps, setTotalSteps] = useState(0);
  const [score, setScore] = useState(0);
  const [completed, setCompleted] = useState(false);
  const [countedAsCompleted, setCountedAsCompleted] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{ ok: boolean; text: string } | null>(null);
  const [pendingNext, setPendingNext] = useState<StepPublic | null>(null);
  const [careerHud, setCareerHud] = useState<CareerSnapshot | null>(null);
  const [achievementToast, setAchievementToast] = useState<string | null>(null);
  const [viewedInvestigationIds, setViewedInvestigationIds] = useState<string[]>([]);
  const [consequenceModal, setConsequenceModal] = useState<string | null>(null);
  const [redFlagSelectionIds, setRedFlagSelectionIds] = useState<string[]>([]);
  const [missionPhase, setMissionPhase] = useState<"condition" | "simulation">("condition");
  const [sessionSyncBusy, setSessionSyncBusy] = useState(false);

  const pendingAfterConsequenceRef = useRef<AnswerResponse | null>(null);
  const pressureExpiryHandledRef = useRef(false);
  const sessionLoadGenerationRef = useRef(0);

  useEffect(() => {
    setViewedInvestigationIds([]);
    setRedFlagSelectionIds([]);
    setMissionPhase("condition");
    pressureExpiryHandledRef.current = false;
  }, [step?.id]);

  const finishAnswerFlow = useCallback((res: AnswerResponse) => {
    setFeedback({ ok: res.correct, text: res.explanation });
    setScore(res.totalScore);
    setCompleted(res.completed);
    if (res.completed) setCountedAsCompleted(res.countedAsCompleted);
    setStepIndex(res.stepIndex);
    setTotalSteps(res.totalSteps);
    if (res.completed) {
      setPendingNext(null);
      setStep(null);
    } else if (res.nextStep) {
      setPendingNext(res.nextStep);
    }
  }, []);

  const applySubmitResponse = useCallback(
    (res: AnswerResponse) => {
      setCareerHud(res.career);
      if (res.career.newAchievements.length > 0) {
        setAchievementToast(res.career.newAchievements.map((a) => a.title).join(" · "));
      } else if (!res.completed) {
        setAchievementToast(null);
      }
      setScore(res.totalScore);
      setStepIndex(res.stepIndex);
      setTotalSteps(res.totalSteps);
      if (res.consequenceBeat) {
        pendingAfterConsequenceRef.current = res;
        setConsequenceModal(res.consequenceBeat);
      } else {
        pendingAfterConsequenceRef.current = null;
        finishAnswerFlow(res);
      }
    },
    [finishAnswerFlow],
  );

  const bootstrapSession = useCallback(
    async (opts?: { restart?: boolean }) => {
      if (!scenarioId) return;
      const gen = ++sessionLoadGenerationRef.current;
      setSessionSyncBusy(true);
      setError(null);
      try {
        const d = await fetchScenario(scenarioId);
        if (gen !== sessionLoadGenerationRef.current) return;
        setDetail(d);
        const start = await startSession(scenarioId, opts?.restart ? { restart: true } : undefined);
        if (gen !== sessionLoadGenerationRef.current) return;
        setSessionId(start.sessionId);
        setStep(start.currentStep);
        setStepIndex(start.stepIndex);
        setTotalSteps(start.totalSteps);
        setScore(start.totalScore ?? 0);
        setCompleted(false);
        setFeedback(null);
        setPendingNext(null);
        setCareerHud(null);
        setAchievementToast(null);
        setConsequenceModal(null);
      } catch (e) {
        if (gen !== sessionLoadGenerationRef.current) return;
        const sessionMsg = simulationHttpErrorMessage(e);
        setError(sessionMsg ?? (e instanceof Error ? e.message : "Ошибка загрузки"));
      } finally {
        if (gen === sessionLoadGenerationRef.current) {
          setSessionSyncBusy(false);
        }
      }
    },
    [scenarioId],
  );

  useEffect(() => {
    void bootstrapSession();
  }, [bootstrapSession]);

  const markPanelViewed = useCallback((id: string) => {
    setViewedInvestigationIds((prev) => (prev.includes(id) ? prev : [...prev, id]));
  }, []);

  const handlePressureTimerExpired = useCallback(() => {
    if (pressureExpiryHandledRef.current) return;
    if (
      !sessionId ||
      !step ||
      busy ||
      completed ||
      pendingNext ||
      consequenceModal ||
      sessionSyncBusy ||
      missionPhase !== "simulation"
    ) {
      return;
    }
    if (!step.pressureSeconds || step.pressureSeconds <= 0) return;
    pressureExpiryHandledRef.current = true;
    void (async () => {
      setBusy(true);
      setError(null);
      try {
        const res = await submitAnswer(
          sessionId,
          step.id,
          "",
          viewedInvestigationIds,
          redFlagSelectionIds,
          { pressureExpired: true },
        );
        applySubmitResponse(res);
      } catch (e) {
        pressureExpiryHandledRef.current = false;
        const sessionMsg = simulationHttpErrorMessage(e);
        setError(sessionMsg ?? (e instanceof Error ? e.message : "Ошибка отправки ответа"));
      } finally {
        setBusy(false);
      }
    })();
  }, [
    sessionId,
    step,
    busy,
    completed,
    pendingNext,
    consequenceModal,
    sessionSyncBusy,
    missionPhase,
    viewedInvestigationIds,
    redFlagSelectionIds,
    applySubmitResponse,
  ]);

  const onContinue = useCallback(() => {
    if (!pendingNext) return;
    setStep(pendingNext);
    setPendingNext(null);
    setFeedback(null);
  }, [pendingNext]);

  const onConsequenceAck = useCallback(() => {
    const res = pendingAfterConsequenceRef.current;
    pendingAfterConsequenceRef.current = null;
    setConsequenceModal(null);
    if (res) {
      finishAnswerFlow(res);
    }
  }, [finishAnswerFlow]);

  const onChoose = useCallback(
    async (choiceId: string) => {
      if (!sessionId || !step || busy || completed || pendingNext || consequenceModal) return;
      setBusy(true);
      setError(null);
      try {
        const res = await submitAnswer(sessionId, step.id, choiceId, viewedInvestigationIds, redFlagSelectionIds);
        applySubmitResponse(res);
      } catch (e) {
        const sessionMsg = simulationHttpErrorMessage(e);
        setError(sessionMsg ?? (e instanceof Error ? e.message : "Ошибка отправки ответа"));
      } finally {
        setBusy(false);
      }
    },
    [
      sessionId,
      step,
      busy,
      completed,
      pendingNext,
      consequenceModal,
      viewedInvestigationIds,
      redFlagSelectionIds,
      applySubmitResponse,
    ],
  );

  const choiceBlockBusy = busy || !!pendingNext || !!consequenceModal || sessionSyncBusy;
  const redFlagReady = !step?.redFlagGame || redFlagSelectionIds.length === step.redFlagGame.requiredPickCount;
  const stepActionsLocked = choiceBlockBusy || !redFlagReady;
  const fallbacks = step ? fallbackChoices(step) : [];

  const toggleRedFlag = (id: string) => {
    if (stepActionsLocked || !step?.redFlagGame) return;
    const max = step.redFlagGame.requiredPickCount;
    const set = new Set(redFlagSelectionIds);
    if (set.has(id)) {
      set.delete(id);
    } else {
      if (set.size >= max) return;
      set.add(id);
    }
    setRedFlagSelectionIds([...set]);
  };

  if (!scenarioId) {
    return (
      <View style={styles.center}>
        <Text style={styles.muted}>Некорректный сценарий.</Text>
      </View>
    );
  }

  if (error && !detail) {
    return (
      <View style={styles.center}>
        <Text style={styles.errText}>{error}</Text>
        <Pressable style={styles.btnGhost} onPress={() => navigation.goBack()}>
          <Text style={styles.btnGhostText}>← Назад</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={styles.root}>
      <ScrollView contentContainerStyle={styles.scroll}>
        {detail ? (
          <View style={styles.breadcrumb}>
            <Text style={styles.bcMuted}>Задачи</Text>
            <Text style={styles.bcSep}> / </Text>
            <Text style={styles.bcTitle} numberOfLines={1}>
              {detail.title}
            </Text>
            {step && !completed ? (
              <Text style={styles.bcStep}>
                {" "}
                · Шаг {stepIndex + 1} из {totalSteps}
              </Text>
            ) : null}
          </View>
        ) : null}

        {sessionSyncBusy && !step ? (
          <ActivityIndicator style={{ marginTop: 24 }} color={colors.accent} />
        ) : null}

        {error ? (
          <View style={styles.errBanner}>
            <Text style={styles.errText}>{error}</Text>
          </View>
        ) : null}

        {achievementToast ? (
          <View style={styles.toast}>
            <Text style={styles.toastText}>🏅 {achievementToast}</Text>
          </View>
        ) : null}

        {careerHud && (careerHud.reputationDelta !== 0 || careerHud.experienceDelta !== 0) ? (
          <Text style={styles.hud}>
            {careerHud.reputationDelta !== 0 ? `Доверие ${careerHud.reputationDelta > 0 ? "+" : ""}${careerHud.reputationDelta} ` : ""}
            {careerHud.experienceDelta !== 0 ? `XP ${careerHud.experienceDelta > 0 ? "+" : ""}${careerHud.experienceDelta}` : ""}
          </Text>
        ) : null}

        {completed ? (
          <View style={styles.card}>
            <Text style={styles.doneTitle}>Сценарий завершён</Text>
            <Text style={styles.score}>Счёт: {score}</Text>
            <Text style={styles.muted}>
              {countedAsCompleted ? "Засчитано как успешное прохождение." : "Были ошибки — без бонуса за идеальное прохождение."}
            </Text>
            <Pressable style={styles.btnPrimary} onPress={() => navigation.goBack()}>
              <Text style={styles.btnPrimaryText}>К списку задач</Text>
            </Pressable>
            <Pressable style={styles.btnSecondary} onPress={() => void bootstrapSession({ restart: true })}>
              <Text style={styles.btnSecondaryText}>Пройти заново</Text>
            </Pressable>
          </View>
        ) : null}

        {step && !completed ? (
          <>
            <View style={styles.badgeRow}>
              <View style={styles.badgePill}>
                <Text style={styles.badgeTxt}>{detail ? missionChannelLabel(detail.hubChannel) : ""}</Text>
              </View>
              <Text style={styles.badgeMuted}>{step.uiKind}</Text>
            </View>

            {missionPhase === "condition" ? (
              <View style={styles.card}>
                <Text style={styles.cardTitle}>Ситуация</Text>
                <Text style={styles.body}>{missionBriefText(step)}</Text>
                <Pressable style={styles.btnPrimary} onPress={() => setMissionPhase("simulation")}>
                  <Text style={styles.btnPrimaryText}>К симуляции</Text>
                </Pressable>
              </View>
            ) : (
              <>
                <PressureBar
                  totalSeconds={step.pressureSeconds}
                  stepId={step.id}
                  frozen={stepActionsLocked}
                  onExpired={handlePressureTimerExpired}
                />

                {step.emailSubject ? (
                  <View style={styles.card}>
                    <Text style={styles.emailMeta}>От: {step.emailFrom ?? "—"}</Text>
                    <Text style={styles.emailSubj}>{step.emailSubject}</Text>
                  </View>
                ) : null}

                <View style={styles.card}>
                  <Text style={styles.cardTitle}>Материал</Text>
                  <Text style={styles.body}>{stepAnalysisText(step)}</Text>
                  {step.narrativeNoise ? <Text style={styles.noise}>{step.narrativeNoise}</Text> : null}
                </View>

                {step.virusTotalGame ? (
                  <View style={styles.card}>
                    <Text style={styles.cardTitle}>VirusTotal (учебный)</Text>
                    <Text style={styles.body}>{step.virusTotalGame.verdictHeadline}</Text>
                    <Text style={styles.muted}>
                      URL: {step.virusTotalGame.scannedUrl} · {step.virusTotalGame.enginesFlagged}/
                      {step.virusTotalGame.enginesTotal}
                    </Text>
                  </View>
                ) : null}

                {step.phoneIncidentGame ? (
                  <View style={styles.card}>
                    <Text style={styles.cardTitle}>{step.phoneIncidentGame.screenTitle}</Text>
                    {step.phoneIncidentGame.smsLines.map((ln, i) => (
                      <Text key={i} style={styles.smsLine}>
                        <Text style={styles.smsSender}>{ln.sender}: </Text>
                        {ln.text}
                      </Text>
                    ))}
                    <View style={styles.callBox}>
                      <Text style={styles.callTitle}>{step.phoneIncidentGame.callOverlay.callerLabel}</Text>
                      <Text style={styles.muted}>{step.phoneIncidentGame.callOverlay.callerSubtitle}</Text>
                      <Text style={styles.body}>{step.phoneIncidentGame.callOverlay.numberDisplay}</Text>
                    </View>
                  </View>
                ) : null}

                {step.investigationPanels.length > 0 ? (
                  <View style={styles.card}>
                    <Text style={styles.cardTitle}>Расследование</Text>
                    {step.investigationPanels.map((p) => {
                      const viewed = viewedInvestigationIds.includes(p.id);
                      return (
                        <Pressable
                          key={p.id}
                          style={styles.invBlock}
                          onPress={() => markPanelViewed(p.id)}
                          disabled={stepActionsLocked}
                        >
                          <Text style={styles.invTitle}>
                            {p.title}
                            {viewed ? " ✓" : ""}
                          </Text>
                          <Text style={styles.body}>{p.body}</Text>
                        </Pressable>
                      );
                    })}
                  </View>
                ) : null}

                {step.redFlagGame ? (
                  <View style={styles.card}>
                    <Text style={styles.body}>{step.redFlagGame.instruction}</Text>
                    <View style={styles.chips}>
                      {step.redFlagGame.candidates.map((c) => {
                        const on = redFlagSelectionIds.includes(c.id);
                        return (
                          <Pressable
                            key={c.id}
                            onPress={() => toggleRedFlag(c.id)}
                            disabled={stepActionsLocked}
                            style={[styles.chip, on && styles.chipOn]}
                          >
                            <Text style={[styles.chipText, on && styles.chipTextOn]}>{c.label}</Text>
                          </Pressable>
                        );
                      })}
                    </View>
                    <Text style={styles.muted}>
                      Отмечено: {redFlagSelectionIds.length} / {step.redFlagGame.requiredPickCount}
                    </Text>
                  </View>
                ) : null}

                {step.urlCompareGame ? (
                  <View style={styles.card}>
                    <Text style={styles.body}>{step.urlCompareGame.caption}</Text>
                    <Pressable
                      style={[styles.choiceBtn, stepActionsLocked && styles.disabled]}
                      disabled={stepActionsLocked}
                      onPress={() => onChoose(step.urlCompareGame!.leftChoiceId)}
                    >
                      <Text style={styles.choiceText}>{step.urlCompareGame.leftUrl}</Text>
                    </Pressable>
                    <Pressable
                      style={[styles.choiceBtn, stepActionsLocked && styles.disabled]}
                      disabled={stepActionsLocked}
                      onPress={() => onChoose(step.urlCompareGame!.rightChoiceId)}
                    >
                      <Text style={styles.choiceText}>{step.urlCompareGame.rightUrl}</Text>
                    </Pressable>
                  </View>
                ) : null}

                {step.serpPickGame
                  ? step.serpPickGame.results.map((r) => (
                      <Pressable
                        key={r.choiceId}
                        style={[styles.choiceBtn, stepActionsLocked && styles.disabled]}
                        disabled={stepActionsLocked}
                        onPress={() => onChoose(r.choiceId)}
                      >
                        <Text style={styles.choiceTitle}>{r.title}</Text>
                        <Text style={styles.choiceSub}>{r.displayUrl}</Text>
                        <Text style={styles.muted}>{r.snippet}</Text>
                      </Pressable>
                    ))
                  : null}

                {step.netShieldGame
                  ? step.netShieldGame.rows.map((row) => (
                      <Pressable
                        key={row.id}
                        style={[styles.choiceBtn, stepActionsLocked && styles.disabled]}
                        disabled={stepActionsLocked}
                        onPress={() => onChoose(row.choiceId)}
                      >
                        <Text style={styles.choiceTitle}>
                          {row.remoteIp} · {row.remoteHost}
                        </Text>
                        <Text style={styles.choiceSub}>{row.rateLabel}</Text>
                        {row.note ? <Text style={styles.muted}>{row.note}</Text> : null}
                      </Pressable>
                    ))
                  : null}

                {step.hotspots.map((h) => (
                  <Pressable
                    key={h.id}
                    style={[styles.choiceBtn, stepActionsLocked && styles.disabled]}
                    disabled={stepActionsLocked}
                    onPress={() => onChoose(h.choiceId)}
                  >
                    <Text style={styles.choiceText}>{h.label}</Text>
                  </Pressable>
                ))}

                {fallbacks.map((c) => (
                  <Pressable
                    key={c.id}
                    style={[styles.choiceBtn, stepActionsLocked && styles.disabled]}
                    disabled={stepActionsLocked}
                    onPress={() => onChoose(c.id)}
                  >
                    <Text style={styles.choiceText}>{c.label}</Text>
                  </Pressable>
                ))}
              </>
            )}
          </>
        ) : null}

        {feedback ? (
          <View style={[styles.feedback, feedback.ok ? styles.feedbackOk : styles.feedbackBad]}>
            <Text style={styles.feedbackTitle}>{feedback.ok ? "Верно" : "Неверно"}</Text>
            <Text style={styles.body}>{feedback.text}</Text>
            {pendingNext ? (
              <Pressable style={styles.btnPrimary} onPress={onContinue}>
                <Text style={styles.btnPrimaryText}>Дальше</Text>
              </Pressable>
            ) : null}
          </View>
        ) : null}

        <Text style={styles.scoreFoot}>Счёт: {score}</Text>
      </ScrollView>

      <Modal visible={!!consequenceModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Что произошло дальше</Text>
            <Text style={styles.body}>{consequenceModal}</Text>
            <Pressable style={styles.btnPrimary} onPress={onConsequenceAck}>
              <Text style={styles.btnPrimaryText}>Понятно</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  scroll: { padding: 16, paddingBottom: 40 },
  center: { flex: 1, justifyContent: "center", alignItems: "center", padding: 20, backgroundColor: colors.bg },
  breadcrumb: { flexDirection: "row", flexWrap: "wrap", alignItems: "center", marginBottom: 12 },
  bcMuted: { color: colors.muted, fontSize: 13 },
  bcSep: { color: colors.muted },
  bcTitle: { color: colors.text, fontWeight: "700", flexShrink: 1, fontSize: 13 },
  bcStep: { color: colors.muted, fontSize: 13 },
  badgeRow: { flexDirection: "row", gap: 8, marginBottom: 10 },
  badgePill: {
    backgroundColor: colors.accentDim,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  badgeTxt: { color: colors.text, fontSize: 12, fontWeight: "800" },
  badgeMuted: { color: colors.muted, fontSize: 12, alignSelf: "center" },
  card: {
    backgroundColor: colors.card,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 12,
  },
  cardTitle: { color: colors.text, fontSize: 17, fontWeight: "700", marginBottom: 8 },
  body: { color: colors.text, fontSize: 15, lineHeight: 22 },
  muted: { color: colors.muted, fontSize: 14, lineHeight: 20 },
  noise: { color: colors.muted, fontSize: 14, marginTop: 10, fontStyle: "italic" },
  emailMeta: { color: colors.muted, fontSize: 13 },
  emailSubj: { color: colors.text, fontSize: 18, fontWeight: "700", marginTop: 6 },
  smsLine: { color: colors.text, marginTop: 8, fontSize: 14 },
  smsSender: { fontWeight: "700", color: colors.accentBlue },
  callBox: { marginTop: 12, padding: 12, backgroundColor: colors.bgElevated, borderRadius: 10 },
  callTitle: { color: colors.text, fontWeight: "700", fontSize: 16 },
  invBlock: { marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: colors.border },
  invTitle: { color: colors.accentBlue, fontWeight: "700", marginBottom: 6 },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginVertical: 12 },
  chip: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 14,
    backgroundColor: colors.bgElevated,
  },
  chipOn: { borderColor: colors.accent, backgroundColor: "rgba(62,207,142,0.15)" },
  chipText: { color: colors.text, fontSize: 14 },
  chipTextOn: { color: colors.accent, fontWeight: "700" },
  choiceBtn: {
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: colors.border,
  },
  choiceText: { color: colors.text, fontSize: 15, lineHeight: 22 },
  choiceTitle: { color: colors.text, fontWeight: "700", fontSize: 15 },
  choiceSub: { color: colors.accentBlue, fontSize: 13, marginTop: 4 },
  disabled: { opacity: 0.45 },
  pressureWrap: {
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  pressureExpired: { borderColor: colors.danger },
  pressureHead: { flexDirection: "row", justifyContent: "space-between" },
  pressureLabel: { color: colors.muted, fontSize: 13 },
  pressureSec: { color: colors.text, fontWeight: "800" },
  pressureTrack: {
    height: 6,
    backgroundColor: colors.border,
    borderRadius: 3,
    marginTop: 8,
    overflow: "hidden",
  },
  pressureFill: { height: "100%", backgroundColor: colors.accent },
  pressureHint: { color: colors.muted, fontSize: 12, marginTop: 8 },
  feedback: { borderRadius: 14, padding: 14, marginTop: 8, marginBottom: 12, borderWidth: 1 },
  feedbackOk: { backgroundColor: "rgba(62,207,142,0.12)", borderColor: colors.accent },
  feedbackBad: { backgroundColor: "rgba(240,113,120,0.12)", borderColor: colors.danger },
  feedbackTitle: { fontWeight: "800", fontSize: 16, marginBottom: 8, color: colors.text },
  errBanner: {
    padding: 12,
    borderRadius: 10,
    backgroundColor: "rgba(240,113,120,0.12)",
    borderWidth: 1,
    borderColor: colors.danger,
    marginBottom: 12,
  },
  errText: { color: colors.danger, fontSize: 14 },
  toast: {
    backgroundColor: colors.bgElevated,
    padding: 10,
    borderRadius: 10,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: colors.border,
  },
  toastText: { color: colors.warning, fontSize: 13 },
  hud: { color: colors.accent, fontSize: 13, marginBottom: 8 },
  doneTitle: { color: colors.text, fontSize: 22, fontWeight: "800", marginBottom: 8 },
  score: { color: colors.accent, fontSize: 18, fontWeight: "700", marginBottom: 8 },
  scoreFoot: { color: colors.muted, marginTop: 16, fontSize: 13 },
  btnPrimary: {
    backgroundColor: colors.accent,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 12,
  },
  btnPrimaryText: { color: "#04210f", fontWeight: "700", fontSize: 16 },
  btnSecondary: {
    marginTop: 10,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
    backgroundColor: colors.bgElevated,
  },
  btnSecondaryText: { color: colors.text, fontWeight: "600" },
  btnGhost: { marginTop: 16, padding: 12 },
  btnGhostText: { color: colors.accentBlue, fontSize: 16 },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.55)",
    justifyContent: "center",
    padding: 24,
  },
  modalCard: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: colors.border,
  },
  modalTitle: { color: colors.text, fontSize: 18, fontWeight: "800", marginBottom: 12 },
});
