import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  useWindowDimensions,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuth } from "../context/AuthContext";
import { colors } from "../theme";
import type { RootStackParamList } from "../navigation/types";

const SLIDER_SLIDES = [
  {
    icon: "⛔",
    title: "Подозрительные ссылки",
    body: "Сравнение URL и внимание к домену — как перед реальным переходом в браузере.",
  },
  {
    icon: "✉️",
    title: "Фишинг во входящих",
    body: "Письма с тем же напряжением, что и на работе: отправитель, вложения, срочность.",
  },
  {
    icon: "◉",
    title: "Лента и ложные призы",
    body: "Посты и кнопки действий — отмечайте манипуляции до ввода пароля.",
  },
] as const;

export function HomeScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { enterDemo } = useAuth();
  const { width } = useWindowDimensions();
  const [slideIndex, setSlideIndex] = useState(0);
  const slide = SLIDER_SLIDES[slideIndex] ?? SLIDER_SLIDES[0];

  return (
    <SafeAreaView style={styles.safe} edges={["top", "left", "right"]}>
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <View style={styles.hero}>
          <Text style={styles.kicker}>GuardSim · КиберСтоп</Text>
          <Text style={styles.title}>Защита. Фокус. Контроль.</Text>
          <Text style={styles.lead}>
            Почта, лента и тикеты — в учебных интерфейсах. Опыт и репутация растут вместе с навыком.
          </Text>
          <View style={styles.ctaRow}>
            <Pressable
              style={({ pressed }) => [styles.btnPrimary, pressed && styles.pressed]}
              onPress={() => navigation.navigate("Login")}
            >
              <Text style={styles.btnPrimaryText}>Войти</Text>
            </Pressable>
            <Pressable
              style={({ pressed }) => [styles.btnSecondary, pressed && styles.pressed]}
              onPress={() => void enterDemo()}
            >
              <Text style={styles.btnSecondaryText}>Демо</Text>
            </Pressable>
          </View>
          <Pressable onPress={() => navigation.navigate("Register")}>
            <Text style={styles.link}>Нет аккаунта? Зарегистрироваться</Text>
          </Pressable>
        </View>

        <View style={[styles.slider, { maxWidth: Math.min(420, width - 32) }]}>
          <Text style={styles.sliderIcon}>{slide.icon}</Text>
          <Text style={styles.sliderTitle}>{slide.title}</Text>
          <Text style={styles.sliderBody}>{slide.body}</Text>
          <View style={styles.sliderNav}>
            <Pressable
              onPress={() => setSlideIndex((i) => (i - 1 + SLIDER_SLIDES.length) % SLIDER_SLIDES.length)}
              style={styles.sliderArrow}
            >
              <Text style={styles.sliderArrowText}>←</Text>
            </Pressable>
            <Text style={styles.sliderDots}>
              {SLIDER_SLIDES.map((_, i) => (i === slideIndex ? "● " : "○ ")).join("")}
            </Text>
            <Pressable
              onPress={() => setSlideIndex((i) => (i + 1) % SLIDER_SLIDES.length)}
              style={styles.sliderArrow}
            >
              <Text style={styles.sliderArrowText}>→</Text>
            </Pressable>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  scroll: { paddingBottom: 32, paddingHorizontal: 20 },
  hero: { paddingTop: 12, marginBottom: 28 },
  kicker: { color: colors.accent, fontSize: 12, fontWeight: "700", letterSpacing: 1, marginBottom: 8 },
  title: { color: colors.text, fontSize: 28, fontWeight: "800", marginBottom: 12 },
  lead: { color: colors.muted, fontSize: 16, lineHeight: 24, marginBottom: 24 },
  ctaRow: { flexDirection: "row", gap: 12, flexWrap: "wrap", marginBottom: 16 },
  btnPrimary: {
    backgroundColor: colors.accent,
    paddingVertical: 14,
    paddingHorizontal: 22,
    borderRadius: 12,
  },
  btnPrimaryText: { color: "#04210f", fontWeight: "700", fontSize: 16 },
  btnSecondary: {
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: 14,
    paddingHorizontal: 22,
    borderRadius: 12,
    backgroundColor: colors.bgElevated,
  },
  btnSecondaryText: { color: colors.text, fontWeight: "600", fontSize: 16 },
  pressed: { opacity: 0.85 },
  link: { color: colors.accentBlue, fontSize: 15 },
  slider: {
    alignSelf: "center",
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: colors.border,
  },
  sliderIcon: { fontSize: 32, marginBottom: 8 },
  sliderTitle: { color: colors.text, fontSize: 18, fontWeight: "700", marginBottom: 8 },
  sliderBody: { color: colors.muted, fontSize: 15, lineHeight: 22 },
  sliderNav: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 16,
  },
  sliderArrow: { padding: 8 },
  sliderArrowText: { color: colors.text, fontSize: 20 },
  sliderDots: { color: colors.muted, fontSize: 12 },
});
